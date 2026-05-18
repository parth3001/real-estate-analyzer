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

// ===== Router =====

const router = Router();

router.post(
  '/turn',
  chatIdentityMiddleware,
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

    try {
      const out = await handleTurn({
        userInput: body.userInput,
        userId: new Types.ObjectId(req.user.id),
        sessionId: body.sessionId,
        turnNumber: body.turnNumber,
        inputMethod: body.inputMethod,
        toolPayload: body.toolPayload,
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

    try {
      const stream = streamTurn(
        {
          userInput: body.userInput,
          userId: new Types.ObjectId(req.user.id),
          sessionId: body.sessionId,
          turnNumber: body.turnNumber,
          inputMethod: body.inputMethod,
          toolPayload: body.toolPayload,
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

      // 4. Send the email. Forward the full card payload (assumptions
      //    + projection) so the email surfaces the same depth the user
      //    saw in chat — addresses Issue #111 (email was "shallow"
      //    relative to the legacy wizard email).
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

export default router;
