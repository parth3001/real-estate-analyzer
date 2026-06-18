/**
 * Chat API — W6-S1 + W6-S2.5 (anonymous chat).
 *
 * The HTTP surface the chat overlay (W6-S2+) calls. Single endpoint:
 *
 *   POST /api/chat/turn
 *
 * Wraps the orchestrator's handleTurn(). The orchestrator is stateless
 * — substrate IS the state — so the client manages sessionId +
 * turnNumber. Backend just validates, dispatches, persists.
 *
 * IDENTITY (W6-S2.5)
 * ------------------
 *
 * Anonymous access is allowed via the ghost-user pattern (see
 * middleware/chatIdentity.ts). Either a Bearer JWT or a valid sessionId
 * is required:
 *
 *   - chatIdentityMiddleware resolves req.user from Bearer (real user)
 *     OR creates/loads a ghost User keyed by sessionId. Sets
 *     req.user.anonymous accordingly.
 *   - chatSessionRateLimit caps anonymous sessions at 10 turns / 24h
 *     (cost containment for LLM-backed turns). Authed users skip.
 *   - calculationRateLimit (IP-scoped, 50/15min, applied at mount in
 *     index.ts) is the abuse-level ceiling — independent of session.
 *
 * Errors as { error: string } (strangler-fig parity with
 * /api/deals/analyze). Per /docs/PRODUCT_2.0_FRONTEND.md §1.
 */

import { Router, type Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { chatIdentityMiddleware } from '../middleware/chatIdentity';
import { chatSessionRateLimit } from '../middleware/chatSessionRateLimit';
import { chatPerIpRateLimit } from '../middleware/chatPerIpRateLimit';
import { mergeAnonymousSessionIntoUser } from '../services/chatSessionMergeService';
import { handleTurn, streamTurn } from '../agents/orchestrator/orchestrator';
import { projectDealScoreCard } from '../agents/orchestrator/dealScoreCardProjection';
import {
  eventsRepositoryReads,
  type ConversationEventDocument,
} from '../repositories/EventsRepositoryReads';
import { ConversationEventModel } from '../models/events/ConversationEvent';
import { emailService } from '../services/emailService';
import { logger } from '../utils/logger';
import { DealModel } from '../models/Deal';
import {
  persistStressScenario,
  PerturbationSpecSchema,
  StressTestNotFoundError,
  StressTestForbiddenError,
  StressTestIncompleteError,
  StressTestUnsupportedError,
} from '../services/perturbation';
import { extractPerturbations } from '../services/perturbation/extractor';
import { getAnthropicAdapter } from '../agents/llm/anthropicAdapter';
import { licenseRepository } from '../repositories/LicenseRepository';

// ===== Request validation =====

/**
 * Request body for POST /api/chat/turn.
 *
 * sessionId + turnNumber are CLIENT-managed. The orchestrator is
 * stateless; the client tracks chat threads and turn ordering. This
 * keeps the backend free of session state (substrate is the source
 * of truth, queryable via getConversationHistory(sessionId)).
 *
 * toolPayload carries structured data tool-only routes need that
 * can't be parsed from text alone (e.g., apply_override needs
 * originalDecisionId + fieldPath + newValue; export_audit_pdf needs
 * decisionId + format).
 */
const ChatTurnBodySchema = z
  .object({
    userInput: z.string().min(1).max(8000),
    sessionId: z.string().uuid(),
    turnNumber: z.number().int().positive(),
    inputMethod: z.enum(['text', 'voice', 'paste']).optional(),
    toolPayload: z.record(z.string(), z.unknown()).optional(),
    /**
     * Optional Deal id the turn is operating against (Day 9b, 2026-05-18).
     * When set, the chat route looks up the user's active DealLicense
     * for that property and passes its id into the orchestrator so the
     * per-license cap (Issue #106 Phase B) aggregates this turn's spend.
     * Free-tier turns and turns initiated from /app top-level (no
     * property in scope) omit this field — session + daily caps still
     * apply.
     *
     * Validation: 24-char hex Mongo ObjectId. We don't fail-closed if
     * the deal can't be resolved at runtime; we just proceed without
     * a licenseId (cost-discipline degrades to session+daily-only).
     */
    dealId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, 'dealId must be a 24-char hex ObjectId')
      .optional(),
  })
  .strict();

type ChatTurnBody = z.infer<typeof ChatTurnBodySchema>;

// ===== Response shape =====

/**
 * Wire shape returned to the chat overlay. ObjectIds stringified
 * (HTTP is text; the orchestrator returns Types.ObjectId).
 */
export interface ChatTurnResponse {
  traceId: string;
  responseText: string;
  routing: {
    target: string;
    routedTo: string;
    classifierIntent: string;
    classifierConfidence: number;
    fallbackReason?: string;
  };
  events: {
    conversationEventId: string;
    related: string[];
  };
  totalCostCents: number;
  agentStubbed: boolean;
}

// ===== License resolver (Day 9b — activates Issue #106 Phase B) =====
//
// Resolves the optional `dealId` body field to an active DealLicense
// id, which the orchestrator uses to enforce the per-license cost cap.
// Failure modes are intentionally SILENT — a missed lookup degrades
// gracefully to "no per-license cap on this turn" rather than blocking
// the user. Session + daily caps still apply on every turn regardless.
//
// Why ownership is enforced in the Deal query: the dealId comes from
// the frontend body and is therefore untrusted. The `{ _id, userId }`
// filter prevents a malicious / buggy client from probing other users'
// deals by guessing ids. License lookup then runs against the SAME
// userId so the partial-index on (userId, canonicalKey, status='active')
// is the only path it can hit.

async function resolveLicenseIdForChatTurn(opts: {
  dealId: string | undefined;
  userId: Types.ObjectId;
}): Promise<Types.ObjectId | undefined> {
  if (!opts.dealId) return undefined;
  try {
    const deal = await DealModel.findOne({
      _id: opts.dealId,
      userId: opts.userId,
    })
      .select('propertyAddress')
      .lean();
    if (!deal?.propertyAddress) return undefined;
    const license = await licenseRepository.findActiveForProperty(
      opts.userId,
      deal.propertyAddress
    );
    return license?._id;
  } catch (err) {
    // License lookup must NEVER block a chat turn. Log + return
    // undefined so we fall back to session/daily-cap-only protection.
    logger.warn('chat: license lookup failed, proceeding without licenseId', {
      dealId: opts.dealId,
      userId: opts.userId.toHexString(),
      error: err instanceof Error ? err.message : String(err),
    });
    return undefined;
  }
}

// ===== Router =====

const router = Router();

router.post(
  '/turn',
  chatIdentityMiddleware,
  // Day 11e: per-IP gate FIRST — catches cookie-cleared bypass of
  // chatSessionRateLimit. Both run; chatSessionRateLimit handles
  // the per-conversation cap, chatPerIpRateLimit handles the
  // per-day-per-IP cap. Authenticated users skip both.
  chatPerIpRateLimit,
  chatSessionRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Identity middleware guarantees req.user (auth OR ghost); defensive
    // guard for the type system.
    if (!req.user?.id) {
      res.status(401).json({ error: 'Identity resolution failed' });
      return;
    }
    if (!Types.ObjectId.isValid(req.user.id)) {
      res.status(401).json({ error: 'Invalid user id' });
      return;
    }

    // Validate body (Zod throws on malformed input — caught below)
    let body: ChatTurnBody;
    try {
      body = ChatTurnBodySchema.parse(req.body);
    } catch (err) {
      res.status(400).json({
        error: 'Invalid request body',
        detail: err instanceof Error ? err.message : 'Unknown validation error',
      });
      return;
    }

    // Day 9b — resolve dealId → active license (if any). Failure is
    // a no-op; the orchestrator still runs with session + daily caps.
    const turnUserId = new Types.ObjectId(req.user.id);
    const licenseId = await resolveLicenseIdForChatTurn({
      dealId: body.dealId,
      userId: turnUserId,
    });

    try {
      const out = await handleTurn({
        userInput: body.userInput,
        userId: turnUserId,
        sessionId: body.sessionId,
        turnNumber: body.turnNumber,
        inputMethod: body.inputMethod,
        toolPayload: body.toolPayload,
        licenseId,
        // Day 11e (Issue E1) — Layer-1 anonymous gating signal.
        isAnonymous: req.user.anonymous === true,
      });

      const response: ChatTurnResponse = {
        traceId: out.traceId,
        responseText: out.responseText,
        routing: {
          target: out.routing.target,
          routedTo: out.routing.routedTo,
          classifierIntent: out.routing.classifierIntent,
          classifierConfidence: out.routing.classifierConfidence,
          fallbackReason: out.routing.fallbackReason,
        },
        events: {
          conversationEventId: out.events.conversationEventId.toHexString(),
          related: out.events.related.map((id) => id.toHexString()),
        },
        totalCostCents: out.totalCostCents,
        agentStubbed: out.agentStubbed,
      };

      // Activation-funnel telemetry (W6-S2.5). One structured log per
      // successful turn — queryable to answer "are anonymous visitors
      // completing first analyses?" without needing a frontend SDK yet.
      logger.info('chat.turn.completed', {
        event: 'chat.turn.completed',
        anonymous: req.user.anonymous === true,
        userId: req.user.id,
        sessionId: body.sessionId,
        turnNumber: body.turnNumber,
        intent: out.routing.classifierIntent,
        routedTo: out.routing.routedTo,
        totalCostCents: out.totalCostCents,
      });

      res.status(200).json(response);
    } catch (err) {
      logger.error('chat/turn: orchestrator threw', {
        userId: req.user.id,
        sessionId: body.sessionId,
        turnNumber: body.turnNumber,
        error: err instanceof Error ? err.stack ?? err.message : String(err),
      });
      // Generic message to the client — internal detail stays in logs.
      // The chat overlay handles this as a "something went wrong, try
      // again" surface per agent-mesh §2.6 "System" error category.
      res.status(500).json({
        error: 'Chat turn failed. Please try again.',
      });
    }
  }
);

// ===== Streaming endpoint — W6-S3 =====

/**
 * POST /api/chat/turn/stream — Server-Sent Events.
 *
 * Same identity + rate-limit + body contract as /turn (JSON). Difference
 * is the response transport: this endpoint yields the orchestrator's
 * event stream as SSE frames so the chat overlay can render text
 * progressively (first-byte time ~500ms on agent routes vs 3-5s
 * blocking).
 *
 * SSE frame format:
 *   data: <json-event>\n\n
 *
 * Each <json-event> is one OrchestratorStreamEvent (see
 * agents/orchestrator/streamEvents.ts). The terminal event is one of
 * `done` / `error` / `cancelled`.
 *
 * CANCELLATION
 * ────────────
 * If the client closes the HTTP connection mid-stream, we abort the
 * in-flight LLM call via an AbortController forwarded into streamTurn.
 * The orchestrator yields a `cancelled` event (which never reaches the
 * disconnected client, but completes substrate accounting). The route
 * then ends cleanly.
 */
router.post(
  '/turn/stream',
  chatIdentityMiddleware,
  // Day 11e — same per-IP gate as /turn, plus per-session cap.
  chatPerIpRateLimit,
  chatSessionRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Identity resolution failed' });
      return;
    }
    if (!Types.ObjectId.isValid(req.user.id)) {
      res.status(401).json({ error: 'Invalid user id' });
      return;
    }

    // Body validation — same schema as /turn.
    let body: ChatTurnBody;
    try {
      body = ChatTurnBodySchema.parse(req.body);
    } catch (err) {
      res.status(400).json({
        error: 'Invalid request body',
        detail: err instanceof Error ? err.message : 'Unknown validation error',
      });
      return;
    }

    // SSE headers — set BEFORE any data is written. Once the body starts,
    // we can't change them.
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // Disable Nginx proxy buffering so events flush immediately. Render
    // and most CDNs respect this header.
    res.setHeader('X-Accel-Buffering', 'no');
    // Express flushes headers on first `res.write` by default; explicitly
    // flushing here gets the connection established before the first
    // (potentially slow) classifier call.
    res.flushHeaders?.();

    const controller = new AbortController();
    // If the client (or a proxy) drops the connection mid-stream, fire
    // the AbortSignal so the orchestrator halts the LLM call.
    req.on('close', () => {
      if (!res.writableEnded) {
        controller.abort();
      }
    });

    const writeEvent = (event: unknown): boolean => {
      // Returns false if the connection has closed (writable === false).
      // Callers should stop iterating in that case.
      if (res.writableEnded) return false;
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        return true;
      } catch {
        return false;
      }
    };

    // Day 9b — resolve dealId → active license (same logic as /turn).
    const streamUserId = new Types.ObjectId(req.user.id);
    const streamLicenseId = await resolveLicenseIdForChatTurn({
      dealId: body.dealId,
      userId: streamUserId,
    });

    try {
      const stream = streamTurn(
        {
          userInput: body.userInput,
          userId: streamUserId,
          sessionId: body.sessionId,
          turnNumber: body.turnNumber,
          inputMethod: body.inputMethod,
          toolPayload: body.toolPayload,
          licenseId: streamLicenseId,
          // Day 11e (Issue E1) — Layer-1 gating: strip rich DealScoreCard
          // fields when the user is anonymous (ghost) so the score is
          // visible but the breakdown / walk-away / projection / metrics
          // are gated behind sign-up.
          isAnonymous: req.user.anonymous === true,
        },
        { signal: controller.signal }
      );

      for await (const ev of stream) {
        const ok = writeEvent(ev);
        if (!ok) break;
      }

      // Activation-funnel telemetry — emitted ONCE per stream attempt.
      // Mirrors the /turn endpoint's chat.turn.completed log so the
      // funnel query unions both transports.
      logger.info('chat.turn.completed', {
        event: 'chat.turn.completed',
        transport: 'sse',
        anonymous: req.user.anonymous === true,
        userId: req.user.id,
        sessionId: body.sessionId,
        turnNumber: body.turnNumber,
      });

      res.end();
    } catch (err) {
      logger.error('chat/turn/stream: orchestrator threw', {
        userId: req.user.id,
        sessionId: body.sessionId,
        turnNumber: body.turnNumber,
        error: err instanceof Error ? err.stack ?? err.message : String(err),
      });
      // Best-effort error frame. If the connection is already closed
      // this is a no-op.
      writeEvent({ type: 'error', message: 'Chat turn failed. Please try again.' });
      res.end();
    }
  }
);

// ===== Email-summary endpoint — W6-S4 =====

/**
 * Request body for POST /api/chat/email-summary.
 *
 * The user provides their email + the conversationEventId of the chat
 * turn whose Deal Score they want emailed. sessionId scopes the request
 * to the anonymous ghost user that owns the conversation (defense in
 * depth — prevents a malicious caller from emailing someone else's
 * analysis by guessing the conversationEventId).
 */
const ChatEmailSummaryBodySchema = z
  .object({
    email: z.string().email().max(254),
    sessionId: z.string().uuid(),
    conversationEventId: z.string().regex(/^[0-9a-f]{24}$/, {
      message: 'conversationEventId must be a 24-char hex ObjectId',
    }),
  })
  .strict();

/**
 * POST /api/chat/email-summary
 *
 * Anonymous-friendly (no auth required — chat surface is anon-by-design
 * per W6-S2.5). Identity resolution via chatIdentityMiddleware so the
 * ghost user keyed by sessionId owns the request. The session rate
 * limit (10 / 24h) applies — capturing emails costs us cents per Resend
 * call so the cap stays sensible.
 *
 * Validates that the ConversationEvent.payload.sessionId matches the
 * request's sessionId — prevents one ghost session from exfiltrating
 * another's analysis.
 */
router.post(
  '/email-summary',
  chatIdentityMiddleware,
  chatSessionRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Identity resolution failed' });
      return;
    }

    let body: z.infer<typeof ChatEmailSummaryBodySchema>;
    try {
      body = ChatEmailSummaryBodySchema.parse(req.body);
    } catch (err) {
      res.status(400).json({
        error: 'Invalid request body',
        detail: err instanceof Error ? err.message : 'Unknown validation error',
      });
      return;
    }

    try {
      // 1. Load the ConversationEvent → verify it belongs to this session.
      const conversation = await ConversationEventModel.findById(
        new Types.ObjectId(body.conversationEventId)
      )
        .lean<ConversationEventDocument | null>()
        .exec();
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found.' });
        return;
      }
      const convPayload = conversation.payload;
      if (convPayload.sessionId !== body.sessionId) {
        // Mismatch — refuse to leak another session's analysis.
        logger.warn(
          '[chat/email-summary] sessionId mismatch on conversation lookup',
          {
            conversationEventId: body.conversationEventId,
            requestSessionId: body.sessionId,
          }
        );
        res.status(403).json({ error: 'Session mismatch.' });
        return;
      }

      // 2. Find the DecisionEvent — last related event per
      //    dealScoringAgent's score_deal extraction convention.
      const related = convPayload.agentResponse.relatedEventIds ?? [];
      if (related.length === 0) {
        res.status(422).json({
          error: 'This conversation has no analysis to email yet.',
        });
        return;
      }
      const decisionEventId = related[related.length - 1];

      // 3. Load the audit trail (decision + analysis) and project.
      const bundle = await eventsRepositoryReads.getAuditTrail(decisionEventId);
      if (!bundle.analysis) {
        res.status(422).json({
          error: 'Analysis data missing for this conversation.',
        });
        return;
      }
      const propertyData = bundle.analysis.payload.propertyData as unknown as {
        investmentStrategy?: 'buy_hold' | 'brrrr';
      };
      const strategy: 'buy_hold' | 'brrrr' =
        propertyData.investmentStrategy === 'brrrr' ? 'brrrr' : 'buy_hold';
      const card = projectDealScoreCard(
        bundle.analysis.payload,
        bundle.decision.payload,
        strategy
      );

      // 4. Send the email. Day 11d adds keyMetrics (real numbers
      //    behind each factor) + ctaUrl so the email matches the
      //    in-chat depth AND drives return visits. Issue F resolution.
      const addressLine = `${card.address.street}, ${card.address.city} ${card.address.state}`;
      await emailService.sendDealScoreSummary({
        recipientEmail: body.email,
        strategy,
        dealQuality: card.dealQuality,
        addressLine,
        topFactors: card.topFactors,
        walkAwayPrice: card.walkAwayPrice,
        purchasePrice: card.purchasePrice,
        nextStep: card.nextStep,
        assumptions: card.assumptions,
        projection: card.projection,
        keyMetrics: card.keyMetrics,
        // CTA URL is generic /app for now — email-CTA may fire before
        // materialization (no dealId yet), so we don't deep-link to
        // /analysis/:id. The user lands on /app and finds the thread
        // in the sidebar. A future Day-N push can resolve this to a
        // deep-link when materialization is guaranteed to have run.
        // emailService falls back to FRONTEND_URL/app when ctaUrl is
        // omitted, so passing undefined here is equivalent + cleaner.
      });

      // Activation-funnel telemetry — email capture is a conversion
      // signal we want queryable per session.
      logger.info('chat.cta.email_sent', {
        event: 'chat.cta.email_sent',
        anonymous: req.user.anonymous === true,
        userId: req.user.id,
        sessionId: body.sessionId,
        conversationEventId: body.conversationEventId,
      });

      res.status(200).json({ sent: true });
    } catch (err) {
      logger.error('chat/email-summary failed', {
        sessionId: body.sessionId,
        conversationEventId: body.conversationEventId,
        error: err instanceof Error ? err.stack ?? err.message : String(err),
      });
      res.status(500).json({ error: 'Could not send email. Please try again.' });
    }
  }
);

// ===== Claim-session endpoint — W6-S5 =====

/**
 * Request body for POST /api/chat/claim-session.
 *
 * The frontend calls this AFTER magic-link signup completes. It carries
 * the anonymous sessionId the user had been chatting under so the
 * server can reassign every substrate row from the ghost user to the
 * now-authenticated real user.
 */
const ChatClaimSessionBodySchema = z
  .object({
    sessionId: z.string().uuid(),
  })
  .strict();

/**
 * POST /api/chat/claim-session
 *
 * Auth-required (real user — NOT the chat's anonymous identity
 * middleware). The mergeAnonymousSessionIntoUser service is idempotent:
 * if the ghost doesn't exist (already claimed, never existed), we return
 * { merged: false } and the caller proceeds normally.
 */
router.post(
  '/claim-session',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }
    if (!Types.ObjectId.isValid(req.user.id)) {
      res.status(401).json({ error: 'Invalid user id in auth token' });
      return;
    }

    let body: z.infer<typeof ChatClaimSessionBodySchema>;
    try {
      body = ChatClaimSessionBodySchema.parse(req.body);
    } catch (err) {
      res.status(400).json({
        error: 'Invalid request body',
        detail: err instanceof Error ? err.message : 'Unknown validation error',
      });
      return;
    }

    try {
      const result = await mergeAnonymousSessionIntoUser(
        body.sessionId,
        new Types.ObjectId(req.user.id)
      );

      // Activation-funnel telemetry — claim is the conversion completion
      // signal. Queryable: how many anonymous → authenticated transitions
      // brought meaningful prior activity (eventsMerged > 0).
      logger.info('chat.session.claimed', {
        event: 'chat.session.claimed',
        userId: req.user.id,
        sessionId: body.sessionId,
        merged: result.merged,
        eventsMerged: result.eventsMerged,
        costEventsMerged: result.costEventsMerged,
      });

      res.status(200).json(result);
    } catch (err) {
      logger.error('chat/claim-session: merge failed', {
        userId: req.user.id,
        sessionId: body.sessionId,
        error: err instanceof Error ? err.stack ?? err.message : String(err),
      });
      res.status(500).json({ error: 'Could not claim chat session.' });
    }
  }
);

/**
 * GET /api/chat/sessions/:sessionId/messages — Day 11f (Issue C / new Issue #123).
 *
 * Returns the conversation history for a session, projected to the
 * minimal wire shape the ChatOverlay needs to restore a thread on
 * mount. Without this endpoint, clicking a sidebar thread showed only
 * the empty welcome state — the underlying ConversationEvents were
 * in substrate but the frontend had no way to read them.
 *
 * AUTH
 * ────
 *
 * chatIdentityMiddleware — accepts authenticated Bearer tokens OR
 * a valid ghost-user sessionId in the body. For a GET we don't have
 * a body, so the relevant code path is: authed Bearer → req.user.id
 * resolves to the real user; we then verify the conversation belongs
 * to them.
 *
 * OWNERSHIP
 * ─────────
 *
 * Every ConversationEvent carries the userId that produced it.
 * After loading the session's events, we check that every event's
 * userId matches the requester. If ANY event mismatches (the session
 * was claimed by a different account, or the requester pasted
 * someone else's sessionId), we 403 — defense against probing.
 *
 * WIRE SHAPE
 * ──────────
 *
 * Returns `{ messages: ChatHistoryMessage[] }` ordered by turnNumber.
 * Each ConversationEvent produces TWO messages (the user-turn input
 * + the assistant-turn response), so a session with N turns returns
 * 2N messages.
 *
 * structuredOutputs (DealScoreCards from prior turns) are NOT
 * reconstructed yet — that's a follow-up (needs to load each
 * decisionEventId's audit trail and re-project). V1 ships text-only
 * restoration which is sufficient for the "I see my prior chat"
 * UX promise.
 */
router.get(
  '/sessions/:sessionId/messages',
  chatIdentityMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Identity resolution failed' });
      return;
    }

    const { sessionId } = req.params;
    // Body-shape validation is tight in /turn; reuse the UUID rule here.
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    try {
      const events =
        await eventsRepositoryReads.getConversationHistory(sessionId);

      if (events.length === 0) {
        // Fresh / unknown session — return empty list, NOT 404.
        // Frontend treats empty as "no history yet" and renders the
        // empty state. 404 would be a worse UX because users would
        // get an error when clicking a sidebar thread that turned
        // out to be empty.
        res.json({ messages: [] });
        return;
      }

      // Ownership check — every event in this session must belong to
      // the requester. If any mismatches, refuse the whole load (we
      // can't safely return a partial view because some events might
      // be from another account post-claim).
      const requesterId = req.user.id;
      const ownedByRequester = events.every(
        (e) => e.userId?.toString() === requesterId
      );
      if (!ownedByRequester) {
        logger.warn(
          'chat/sessions/:id/messages: ownership mismatch — refusing',
          {
            requesterId,
            sessionId,
            mismatchCount: events.filter(
              (e) => e.userId?.toString() !== requesterId
            ).length,
          }
        );
        res.status(403).json({ error: 'Not your session.' });
        return;
      }

      // Project each ConversationEvent → [user message, assistant
      // message] in turn order. ConversationEvents are already sorted
      // by turnNumber by the repository read.
      const messages = events.flatMap((e) => {
        const payload = e.payload;
        const turnNumber = payload.turnNumber;
        const out: Array<{
          role: 'user' | 'assistant';
          text: string;
          turnNumber: number;
          traceId?: string;
          conversationEventId?: string;
        }> = [];
        if (payload.userInput?.text) {
          out.push({
            role: 'user',
            text: payload.userInput.text,
            turnNumber,
            traceId: e.traceId,
          });
        }
        if (payload.agentResponse?.text) {
          out.push({
            role: 'assistant',
            text: payload.agentResponse.text,
            turnNumber,
            traceId: e.traceId,
            conversationEventId: (e._id as Types.ObjectId).toHexString(),
          });
        }
        return out;
      });

      res.json({ messages });
    } catch (err) {
      logger.error('chat/sessions/:id/messages: load failed', {
        userId: req.user.id,
        sessionId,
        error: err instanceof Error ? err.stack ?? err.message : String(err),
      });
      res.status(500).json({ error: 'Could not load conversation history.' });
    }
  }
);

// ===== Task #40 (2026-06-18): persist a stress test as a saved scenario =====
//
// The chat stress-test path (handleStressTest) returns a narrative + a
// structured StressTestResult to the LLM, but does NOT write substrate.
// This endpoint takes the same anchor decision + perturbation set and
// persists the stressed scenario as a real DecisionEvent — making it
// visible in the workspace's scenario-comparison spine alongside the
// baseline.
//
// Flow:
//   1. Validate body (priorDecisionId + perturbations array)
//   2. Service does ownership check + perturbation application + score_deal
//   3. score_deal writes AnalysisEvent + DecisionEvent + materializes Deal
//      + fires #14 auto-redeem + #18 critique (all already wired)
//   4. Return the new decisionEventId so the frontend can deep-link
//
// Errors map to status codes via the same typed-error catch pattern the
// turn endpoint uses.
// Accepts EITHER perturbations (programmatic callers) OR userMessage
// (chat-side callers: re-extract from the original prompt). The frontend
// chip only has the user's prompt string + the priorDecisionId from
// relatedEventIds — it doesn't have the typed perturbations.
const SaveStressScenarioRequestSchema = z
  .object({
    priorDecisionId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'priorDecisionId must be a 24-char hex string'),
    perturbations: z.array(PerturbationSpecSchema).min(1).optional(),
    userMessage: z.string().min(1).max(2000).optional(),
  })
  .refine((d) => d.perturbations || d.userMessage, {
    message: 'Either perturbations or userMessage must be provided',
  });

router.post(
  '/stress-test/save',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const parsed = SaveStressScenarioRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body.',
        details: parsed.error.flatten(),
      });
      return;
    }

    try {
      // Resolve perturbations: caller-supplied → use directly; else
      // re-extract from the user's stress-test prompt (one extra LLM
      // call, but mirrors what handleStressTest already did so the
      // saved scenario matches what the narrative described).
      let perturbations = parsed.data.perturbations;
      if (!perturbations) {
        const adapter = getAnthropicAdapter();
        const extraction = await extractPerturbations({
          userMessage: parsed.data.userMessage!,
          adapter,
        });
        if (extraction.perturbations.length === 0) {
          res.status(400).json({
            error:
              'Could not extract any assumption changes from the original prompt. ' +
              'Try re-running the stress test with a more explicit message.',
            extractionReasoning: extraction.reasoning,
          });
          return;
        }
        perturbations = extraction.perturbations;
      }

      const result = await persistStressScenario({
        priorDecisionId: parsed.data.priorDecisionId,
        userId: req.user.id,
        perturbations,
      });
      logger.info('[chat/stress-test/save] scenario persisted', {
        userId: req.user.id,
        priorDecisionId: parsed.data.priorDecisionId,
        newDecisionEventId: result.newDecisionEventId,
        dealQuality: result.dealQuality,
      });
      res.status(201).json(result);
    } catch (err) {
      if (
        err instanceof StressTestNotFoundError ||
        err instanceof StressTestForbiddenError
      ) {
        // Generic 404 for both — never leak existence of another user's
        // decision (same posture as runStressTest).
        res.status(404).json({ error: 'Prior decision not found.' });
        return;
      }
      if (err instanceof StressTestIncompleteError) {
        res.status(422).json({
          error:
            'The prior decision is missing its linked AnalysisEvent and cannot be re-scored.',
        });
        return;
      }
      if (err instanceof StressTestUnsupportedError) {
        res.status(400).json({ error: err.message });
        return;
      }
      logger.error('[chat/stress-test/save] unexpected error', {
        userId: req.user.id,
        priorDecisionId: parsed.data.priorDecisionId,
        error: err instanceof Error ? err.stack ?? err.message : String(err),
      });
      res.status(500).json({ error: 'Could not save stress scenario.' });
    }
  }
);

export default router;
