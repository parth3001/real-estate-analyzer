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
import { type AuthenticatedRequest } from '../middleware/auth';
import { chatIdentityMiddleware } from '../middleware/chatIdentity';
import { chatSessionRateLimit } from '../middleware/chatSessionRateLimit';
import { handleTurn } from '../agents/orchestrator/orchestrator';
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

export default router;
