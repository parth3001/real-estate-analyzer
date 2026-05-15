/**
 * POST /api/chat/email-summary — W6-S4 acceptance tests.
 *
 * Verifies the email-CTA endpoint:
 *   - 200 happy path: finds the conversation, projects the audit trail,
 *     calls emailService.sendDealScoreSummary with the right shape
 *   - 400 on invalid body (bad email, missing fields, non-UUID sessionId)
 *   - 404 when the conversationEventId doesn't exist
 *   - 403 when the conversation's sessionId doesn't match the request
 *     (prevents one ghost session from emailing another's analysis)
 *   - 422 when the conversation has no related events (turn without
 *     an analysis)
 *   - 500 with no internal leak when downstream throws
 */

import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';

// ===== Mocks =====

const mockChatIdentityState = {
  userId: new Types.ObjectId().toHexString(),
  anonymous: true,
};

jest.mock('../../middleware/chatIdentity', () => ({
  chatIdentityMiddleware: (
    req: { user?: { id: string; email: string; role: string; anonymous?: boolean } },
    _res: unknown,
    next: () => void
  ): void => {
    req.user = {
      id: mockChatIdentityState.userId,
      email: 'anon@anon.app',
      role: 'user',
      anonymous: mockChatIdentityState.anonymous,
    };
    next();
  },
}));

// ConversationEventModel.findById → lean → exec chain
const mockConvFindById = jest.fn();
jest.mock('../../models/events/ConversationEvent', () => ({
  ConversationEventModel: {
    findById: (id: unknown): unknown => mockConvFindById(id),
  },
}));

// eventsRepositoryReads.getAuditTrail
const mockGetAuditTrail = jest.fn();
jest.mock('../../repositories/EventsRepositoryReads', () => ({
  eventsRepositoryReads: {
    getAuditTrail: (id: unknown): unknown => mockGetAuditTrail(id),
  },
}));

// emailService.sendDealScoreSummary
const mockSendDealScoreSummary = jest.fn();
jest.mock('../../services/emailService', () => ({
  emailService: {
    sendDealScoreSummary: (opts: unknown): unknown => mockSendDealScoreSummary(opts),
  },
}));

// streamTurn / handleTurn are required by chat.ts top-level imports but not
// used by the email-summary endpoint — stub them so the module loads.
jest.mock('../../agents/orchestrator/orchestrator', () => ({
  handleTurn: jest.fn(),
  streamTurn: jest.fn(),
}));

// eslint-disable-next-line import/first
import chatRouter from '../chat';
// eslint-disable-next-line import/first
import { __resetChatSessionRateLimitForTests } from '../../middleware/chatSessionRateLimit';

// ===== Test app =====

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/chat', chatRouter);
  return app;
}

const SESSION_ID = '11111111-2222-4333-8444-555555555555';
const OTHER_SESSION_ID = '22222222-3333-4444-8555-666666666666';
const CONVERSATION_ID = '6a0700000000000000000001';
const DECISION_ID = new Types.ObjectId();
const ANALYSIS_ID = new Types.ObjectId();

function leanChain<T>(value: T) {
  // Mongoose chain: findById(...) → .lean() → .exec()
  return {
    lean: (): { exec: () => Promise<T> } => ({
      exec: async (): Promise<T> => value,
    }),
  };
}

function fakeConversation(sessionId: string = SESSION_ID) {
  return {
    _id: new Types.ObjectId(CONVERSATION_ID),
    eventType: 'conversation',
    payload: {
      sessionId,
      turnNumber: 1,
      agentResponse: {
        text: 'Analysis done.',
        structuredOutputs: [],
        relatedEventIds: [ANALYSIS_ID, DECISION_ID],
      },
      // Other ConversationPayload fields omitted — the route only reads
      // sessionId + agentResponse.relatedEventIds.
    },
  };
}

function fakeAuditBundle() {
  return {
    decision: {
      _id: DECISION_ID,
      payload: {
        analysisEventId: ANALYSIS_ID,
        dealQuality: 87,
        qualityLabel: 'Above professional standards',
        qualityColor: 'green',
        professionalAssessment: {
          dealQuality: 87,
          cashFlowScore: 92,
          irrScore: 70,
          marketStrengthScore: 70,
          debtStructureScore: 75,
          exitStrategyScore: 60,
          capRateScore: 65,
          propertyRiskScore: 40,
          executionDifficulty: 30,
          dataReliability: 80,
          primaryInsight: 'Strong cash flow.',
          strategicRecommendations: ['Offer at $385,000.'],
          riskMitigation: [],
          opportunityMaximization: [],
          confidenceLevel: 85,
          keyStrengths: [],
          keyRisks: [],
        },
        marketPosition: { walkAwayPrice: 385000 },
        reasoningTrail: {
          primaryInsight: 'Strong cash flow.',
          strategicRecommendations: ['Offer at $385,000.'],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
        confidence: 85,
        scoringWeightsUsed: {},
        engineVersion: 'v3.0',
      },
    },
    analysis: {
      _id: ANALYSIS_ID,
      payload: {
        propertyData: {
          propertyType: 'SFR',
          propertyAddress: {
            street: '1837 Walnut Way',
            city: 'Anna',
            state: 'TX',
            zipCode: '75409',
          },
          purchasePrice: 425000,
          downPayment: 106250,
          interestRate: 6.95,
          loanTerm: 30,
          propertyTaxRate: 1.8,
          insuranceRate: 0.5,
          maintenanceCost: 100,
          propertyManagementRate: 8,
          monthlyRent: 2800,
          squareFootage: 2200,
          bedrooms: 4,
          bathrooms: 2.5,
          yearBuilt: 2015,
        },
        assumptions: { vacancyRate: 5 },
      },
    },
    overrides: [],
    critiques: [],
    auditEvents: [],
  };
}

const validBody = (overrides: Record<string, unknown> = {}) => ({
  email: 'investor@example.com',
  sessionId: SESSION_ID,
  conversationEventId: CONVERSATION_ID,
  ...overrides,
});

describe('POST /api/chat/email-summary (W6-S4)', () => {
  beforeEach(() => {
    mockConvFindById.mockReset();
    mockGetAuditTrail.mockReset();
    mockSendDealScoreSummary.mockReset();
    __resetChatSessionRateLimitForTests();
    mockChatIdentityState.userId = new Types.ObjectId().toHexString();
    mockChatIdentityState.anonymous = true;
  });

  describe('200 happy path', () => {
    it('emails the deal-score summary with projected card data', async () => {
      mockConvFindById.mockReturnValueOnce(leanChain(fakeConversation()));
      mockGetAuditTrail.mockResolvedValueOnce(fakeAuditBundle());
      mockSendDealScoreSummary.mockResolvedValueOnce(undefined);

      const res = await request(buildApp())
        .post('/api/chat/email-summary')
        .send(validBody());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sent: true });

      expect(mockSendDealScoreSummary).toHaveBeenCalledTimes(1);
      const payload = mockSendDealScoreSummary.mock.calls[0]?.[0] as {
        recipientEmail: string;
        strategy: 'buy_hold' | 'brrrr';
        dealQuality: number;
        addressLine: string;
        topFactors: Array<{ label: string; score: number }>;
        walkAwayPrice: number;
        purchasePrice: number;
        nextStep: string;
      };
      expect(payload.recipientEmail).toBe('investor@example.com');
      expect(payload.dealQuality).toBe(87);
      expect(payload.addressLine).toContain('1837 Walnut Way');
      expect(payload.walkAwayPrice).toBe(385000);
      expect(payload.purchasePrice).toBe(425000);
      expect(payload.nextStep).toContain('Offer at $385,000');
      expect(payload.topFactors.length).toBeGreaterThan(0);
    });
  });

  describe('400 body validation', () => {
    it.each<[string, Record<string, unknown>]>([
      ['invalid email', { email: 'not-an-email' }],
      ['missing email', { email: undefined }],
      ['missing sessionId', { sessionId: undefined }],
      ['sessionId not UUID', { sessionId: 'not-a-uuid' }],
      ['missing conversationEventId', { conversationEventId: undefined }],
      ['conversationEventId not 24-hex', { conversationEventId: 'short' }],
      ['unknown top-level field (strict)', { extraField: 1 }],
    ])('rejects: %s', async (_label, override) => {
      const res = await request(buildApp())
        .post('/api/chat/email-summary')
        .send(validBody(override));
      expect(res.status).toBe(400);
      expect(mockSendDealScoreSummary).not.toHaveBeenCalled();
    });
  });

  describe('404 / 403 / 422', () => {
    it('returns 404 when the conversation doesn\'t exist', async () => {
      mockConvFindById.mockReturnValueOnce(leanChain(null));
      const res = await request(buildApp())
        .post('/api/chat/email-summary')
        .send(validBody());
      expect(res.status).toBe(404);
      expect(mockSendDealScoreSummary).not.toHaveBeenCalled();
    });

    it('returns 403 when the conversation\'s sessionId mismatches the request', async () => {
      mockConvFindById.mockReturnValueOnce(
        leanChain(fakeConversation(OTHER_SESSION_ID))
      );
      const res = await request(buildApp())
        .post('/api/chat/email-summary')
        .send(validBody());
      expect(res.status).toBe(403);
      expect(mockSendDealScoreSummary).not.toHaveBeenCalled();
    });

    it('returns 422 when the conversation has no related events', async () => {
      const conv = fakeConversation();
      conv.payload.agentResponse.relatedEventIds = [];
      mockConvFindById.mockReturnValueOnce(leanChain(conv));
      const res = await request(buildApp())
        .post('/api/chat/email-summary')
        .send(validBody());
      expect(res.status).toBe(422);
      expect(mockSendDealScoreSummary).not.toHaveBeenCalled();
    });
  });

  describe('500 with no internal leak', () => {
    it('returns generic error when emailService throws', async () => {
      mockConvFindById.mockReturnValueOnce(leanChain(fakeConversation()));
      mockGetAuditTrail.mockResolvedValueOnce(fakeAuditBundle());
      mockSendDealScoreSummary.mockRejectedValueOnce(
        new Error('Sensitive: Resend at api.resend.com refused')
      );

      const res = await request(buildApp())
        .post('/api/chat/email-summary')
        .send(validBody());

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/Could not send email/);
      // Internal detail must not leak
      expect(JSON.stringify(res.body)).not.toContain('Resend');
      expect(JSON.stringify(res.body)).not.toContain('api.resend.com');
    });
  });

  describe('session rate limit', () => {
    it('applies the anon 10/24h limit', async () => {
      mockConvFindById.mockReturnValue(leanChain(fakeConversation()));
      mockGetAuditTrail.mockResolvedValue(fakeAuditBundle());
      mockSendDealScoreSummary.mockResolvedValue(undefined);

      for (let i = 0; i < 10; i++) {
        await request(buildApp())
          .post('/api/chat/email-summary')
          .send(validBody());
      }
      const res = await request(buildApp())
        .post('/api/chat/email-summary')
        .send(validBody());

      expect(res.status).toBe(429);
    });
  });
});
