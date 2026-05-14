/**
 * W4-S7 acceptance test — tool:profile_extraction end-to-end.
 *
 * Uses a stub AnthropicAdapter (no real API calls; no API key required
 * in CI). Verifies:
 *   1. Tool contract conformance (invokeLLM: 'haiku', side effects,
 *      retry policy)
 *   2. CostEvent ALWAYS emitted (even when LLM output fails parsing)
 *   3. ProfileEvent CONDITIONALLY emitted (only when new fields)
 *   4. Cost computation matches the anthropicPricing helper
 *   5. Diff logic correctly identifies "new" fields vs currentProfile
 *   6. Markdown code-fence stripping
 *   7. Trust boundary on inputs and on malformed LLM output
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventsRepository } from '../../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import { profileExtraction } from '../profile_extraction';
import {
  setAnthropicAdapter,
  resetAnthropicAdapter,
  makeTestAdapter,
  type AnthropicAdapter,
} from '../../llm/anthropicAdapter';
import type { ToolContext } from '../types';

const SETUP_TIMEOUT_MS = 90_000;

describe('tool:profile_extraction (W4-S7)', () => {
  let mongoServer: MongoMemoryServer;
  let writes: EventsRepository;
  let reads: EventsRepositoryReads;

  function makeCtx(userId: Types.ObjectId, traceId = 'trace-profile'): ToolContext {
    return {
      traceId,
      userId,
      eventsRepo: writes,
      eventsReads: reads,
      tools: {},
    };
  }

  /**
   * Build a stub adapter that returns the provided JSON text + usage stats.
   * Default usage simulates a small Haiku call.
   */
  function makeStubAdapter(
    text: string,
    usage = { inputTokens: 800, outputTokens: 120, cachedTokens: 0 }
  ): AnthropicAdapter {
    return makeTestAdapter({
      async call() {
        return {
          text,
          usage,
          model: 'claude-haiku-4-5',
          stopReason: 'end_turn',
        };
      },
    });
  }

  function makeJsonResponse(payload: Record<string, unknown>): string {
    return JSON.stringify(payload);
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    writes = new EventsRepository();
    reads = new EventsRepositoryReads();
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
    resetAnthropicAdapter();
  });

  // ===== Contract conformance =====

  describe('Tool contract', () => {
    it("declares invokeLLM: 'haiku' (the ONLY wave-1 LLM-using tool)", () => {
      expect(profileExtraction.invokeLLM).toBe('haiku');
    });

    it('declares external_api: anthropic and event: profile side effects', () => {
      expect(profileExtraction.sideEffects).toEqual([
        { type: 'external_api', service: 'anthropic' },
        { type: 'event', eventType: 'profile' },
      ]);
    });

    it('uses NO_RETRY (LLM calls are expensive — caller decides on full re-do)', () => {
      expect(profileExtraction.retrySemantics.maxAttempts).toBe(1);
    });

    it('has the stable global name', () => {
      expect(profileExtraction.name).toBe('profile_extraction');
    });
  });

  // ===== Happy path =====

  describe('execute() — happy path', () => {
    it('extracts fields from a credit-union-lender message', async () => {
      setAnthropicAdapter(
        makeStubAdapter(
          makeJsonResponse({
            investorType: 'lender',
            role: 'loan_officer',
            institutionContext: {
              institutionType: 'credit_union',
              typicalDealVolume: 'medium',
            },
            primaryMarkets: ['Wichita'],
            confidence: 92,
          })
        )
      );
      const userId = new Types.ObjectId();
      const out = await profileExtraction.execute(
        {
          userInput:
            "I'm a loan officer at a credit union in Wichita, we close about 30 deals a year.",
        },
        makeCtx(userId)
      );

      expect(out.extractedProfile.investorType).toBe('lender');
      expect(out.extractedProfile.role).toBe('loan_officer');
      expect(out.extractedProfile.institutionContext?.institutionType).toBe(
        'credit_union'
      );
      expect(out.extractedProfile.primaryMarkets).toEqual(['Wichita']);
      expect(out.confidence).toBe(92);
    });

    it('writes a CostEvent ALWAYS (every LLM call → one CostEvent)', async () => {
      setAnthropicAdapter(
        makeStubAdapter(makeJsonResponse({ confidence: 50 }))
      );
      const userId = new Types.ObjectId();
      const out = await profileExtraction.execute(
        { userInput: 'something cryptic' },
        makeCtx(userId, 'trace-cost')
      );

      expect(out.costEventId).toBeInstanceOf(Types.ObjectId);

      // Verify it was actually written
      const costDocs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: 'trace-cost' })
        .toArray();
      expect(costDocs).toHaveLength(1);
      expect(costDocs[0]).toMatchObject({
        traceId: 'trace-cost',
        costType: 'llm',
        provider: 'anthropic',
        model: 'claude-haiku-4-5',
      });
    });

    it('computes cost from token usage via anthropicPricing', async () => {
      // 1500 input / 300 output / 1500 cached should produce 0.165 cents
      setAnthropicAdapter(
        makeStubAdapter(
          makeJsonResponse({ confidence: 80 }),
          { inputTokens: 1500, outputTokens: 300, cachedTokens: 1500 }
        )
      );
      const userId = new Types.ObjectId();
      await profileExtraction.execute(
        { userInput: 'hello' },
        makeCtx(userId, 'trace-pricing')
      );

      const costDoc = await mongoose.connection.db
        .collection('cost_events')
        .findOne({ traceId: 'trace-pricing' });
      const cents = (costDoc as unknown as { costCents: number }).costCents;
      // uncached=0, output=300, cached=1500
      // cost_$ = (0*1 + 300*5 + 1500*0.1) / 1M = 0.00165
      // costCents = 0.165
      expect(cents).toBeCloseTo(0.165, 5);
    });

    it('writes a ProfileEvent when extraction yields fields (no currentProfile)', async () => {
      setAnthropicAdapter(
        makeStubAdapter(
          makeJsonResponse({
            investorType: 'retail',
            riskTolerance: 'conservative',
            confidence: 75,
          })
        )
      );
      const userId = new Types.ObjectId();
      const out = await profileExtraction.execute(
        { userInput: "I'm just getting started — really cautious." },
        makeCtx(userId, 'trace-new')
      );

      expect(out.hadNewFields).toBe(true);
      expect(out.profileEventId).toBeInstanceOf(Types.ObjectId);

      const events = await reads.getEventsByTraceId('trace-new');
      const profileEvent = events.find((e) => e.eventType === 'profile');
      expect(profileEvent).toBeDefined();
      expect(profileEvent!.payload).toMatchObject({
        investorType: 'retail',
        riskTolerance: 'conservative',
        extractedFromInput: "I'm just getting started — really cautious.",
        extractionConfidence: 75,
      });
    });

    it('uses actorType "tool:profile_extraction" on the ProfileEvent', async () => {
      setAnthropicAdapter(
        makeStubAdapter(
          makeJsonResponse({ investorType: 'retail', confidence: 70 })
        )
      );
      const userId = new Types.ObjectId();
      await profileExtraction.execute(
        { userInput: 'retail' },
        makeCtx(userId, 'trace-actor')
      );
      const events = await reads.getEventsByTraceId('trace-actor');
      const profileEvent = events.find((e) => e.eventType === 'profile')!;
      expect(profileEvent.actorType).toBe('tool:profile_extraction');
    });

    it('captures extractedFromInput + extractionConfidence on the ProfileEvent', async () => {
      setAnthropicAdapter(
        makeStubAdapter(
          makeJsonResponse({ investorType: 'pro', confidence: 88 })
        )
      );
      const userId = new Types.ObjectId();
      await profileExtraction.execute(
        { userInput: 'I have a portfolio of 12 properties.' },
        makeCtx(userId, 'trace-audit')
      );
      const events = await reads.getEventsByTraceId('trace-audit');
      const profileEvent = events.find((e) => e.eventType === 'profile')!;
      expect(profileEvent.payload).toMatchObject({
        extractedFromInput: 'I have a portfolio of 12 properties.',
        extractionConfidence: 88,
      });
    });
  });

  // ===== Conditional ProfileEvent =====

  describe('ProfileEvent emission is conditional on new fields', () => {
    it('does NOT write ProfileEvent when extraction yields nothing new (vs currentProfile)', async () => {
      setAnthropicAdapter(
        makeStubAdapter(
          makeJsonResponse({
            investorType: 'retail',
            riskTolerance: 'moderate',
            confidence: 60,
          })
        )
      );
      const userId = new Types.ObjectId();
      const out = await profileExtraction.execute(
        {
          userInput: 'hi',
          currentProfile: {
            investorType: 'retail',
            riskTolerance: 'moderate',
          },
        },
        makeCtx(userId, 'trace-no-new')
      );

      expect(out.hadNewFields).toBe(false);
      expect(out.profileEventId).toBeUndefined();

      const events = await reads.getEventsByTraceId('trace-no-new');
      expect(events.filter((e) => e.eventType === 'profile')).toHaveLength(0);

      // CostEvent still emitted — we paid for the call
      const costDocs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: 'trace-no-new' })
        .toArray();
      expect(costDocs).toHaveLength(1);
    });

    it('writes ProfileEvent when only ONE field differs from currentProfile', async () => {
      setAnthropicAdapter(
        makeStubAdapter(
          makeJsonResponse({
            investorType: 'retail',
            riskTolerance: 'aggressive', // changed
            confidence: 80,
          })
        )
      );
      const userId = new Types.ObjectId();
      const out = await profileExtraction.execute(
        {
          userInput: "Actually I'm pretty aggressive about this.",
          currentProfile: { investorType: 'retail', riskTolerance: 'moderate' },
        },
        makeCtx(userId, 'trace-one-change')
      );

      expect(out.hadNewFields).toBe(true);
      const events = await reads.getEventsByTraceId('trace-one-change');
      const profileEvent = events.find((e) => e.eventType === 'profile')!;
      expect(profileEvent.payload).toMatchObject({
        riskTolerance: 'aggressive',
      });
      // investorType wasn't in newFields (unchanged), so isn't in payload
      expect((profileEvent.payload as { investorType?: string }).investorType).toBeUndefined();
    });

    it('does NOT write ProfileEvent when extraction yields zero fields', async () => {
      setAnthropicAdapter(
        makeStubAdapter(makeJsonResponse({ confidence: 40 }))
      );
      const userId = new Types.ObjectId();
      const out = await profileExtraction.execute(
        { userInput: 'just saying hello' },
        makeCtx(userId, 'trace-empty')
      );

      expect(out.hadNewFields).toBe(false);
      expect(out.profileEventId).toBeUndefined();

      const events = await reads.getEventsByTraceId('trace-empty');
      expect(events.filter((e) => e.eventType === 'profile')).toHaveLength(0);
    });

    it('treats null fields from LLM as absent (does NOT emit empty-field ProfileEvent)', async () => {
      setAnthropicAdapter(
        makeStubAdapter(
          makeJsonResponse({
            investorType: null,
            portfolioSize: null,
            primaryMarkets: null,
            confidence: 30,
          })
        )
      );
      const userId = new Types.ObjectId();
      const out = await profileExtraction.execute(
        { userInput: 'nothing specific' },
        makeCtx(userId, 'trace-nulls')
      );

      expect(out.hadNewFields).toBe(false);
      expect(Object.keys(out.extractedProfile)).toHaveLength(0);
    });
  });

  // ===== Markdown fence handling =====

  describe('LLM output cleaning', () => {
    it('strips ```json ... ``` code fences', async () => {
      const json = JSON.stringify({ investorType: 'pro', confidence: 85 });
      setAnthropicAdapter(makeStubAdapter('```json\n' + json + '\n```'));
      const userId = new Types.ObjectId();
      const out = await profileExtraction.execute(
        { userInput: 'I have rentals' },
        makeCtx(userId)
      );
      expect(out.extractedProfile.investorType).toBe('pro');
    });

    it('strips plain ``` fences', async () => {
      const json = JSON.stringify({ investorType: 'retail', confidence: 70 });
      setAnthropicAdapter(makeStubAdapter('```\n' + json + '\n```'));
      const userId = new Types.ObjectId();
      const out = await profileExtraction.execute(
        { userInput: 'newbie' },
        makeCtx(userId)
      );
      expect(out.extractedProfile.investorType).toBe('retail');
    });
  });

  // ===== Trust boundary =====

  describe('error handling', () => {
    it('rejects empty userInput', async () => {
      setAnthropicAdapter(makeStubAdapter(makeJsonResponse({ confidence: 0 })));
      await expect(
        profileExtraction.execute(
          { userInput: '' },
          makeCtx(new Types.ObjectId())
        )
      ).rejects.toThrow();
    });

    it('throws on non-JSON LLM output', async () => {
      setAnthropicAdapter(
        makeStubAdapter("I'm sorry, I can't help with that.")
      );
      await expect(
        profileExtraction.execute(
          { userInput: 'hi' },
          makeCtx(new Types.ObjectId(), 'trace-bad')
        )
      ).rejects.toThrow(/non-JSON output/);

      // CostEvent should STILL have been written — we paid for the call
      const costDocs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: 'trace-bad' })
        .toArray();
      expect(costDocs).toHaveLength(1);
    });

    it('throws when LLM JSON has an invalid enum value', async () => {
      setAnthropicAdapter(
        makeStubAdapter(
          makeJsonResponse({ investorType: 'gambler', confidence: 50 })
        )
      );
      await expect(
        profileExtraction.execute(
          { userInput: 'hi' },
          makeCtx(new Types.ObjectId())
        )
      ).rejects.toThrow();
    });

    it('throws when confidence is missing from LLM response', async () => {
      setAnthropicAdapter(
        makeStubAdapter(makeJsonResponse({ investorType: 'retail' }))
      );
      await expect(
        profileExtraction.execute(
          { userInput: 'hi' },
          makeCtx(new Types.ObjectId())
        )
      ).rejects.toThrow();
    });

    it('propagates adapter failures with NO substrate writes', async () => {
      setAnthropicAdapter(
        makeTestAdapter({
          async call() {
            throw new Error('Anthropic API timeout');
          },
        })
      );
      await expect(
        profileExtraction.execute(
          { userInput: 'hi' },
          makeCtx(new Types.ObjectId(), 'trace-fail')
        )
      ).rejects.toThrow(/Anthropic API timeout/);

      // Adapter failure means we never billed — no CostEvent either
      const events = await reads.getEventsByTraceId('trace-fail');
      expect(events).toHaveLength(0);

      const costDocs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: 'trace-fail' })
        .toArray();
      expect(costDocs).toHaveLength(0);
    });
  });

  // ===== Substrate correlation =====

  describe('substrate correlation', () => {
    it('CostEvent and ProfileEvent share the ToolContext.traceId', async () => {
      setAnthropicAdapter(
        makeStubAdapter(
          makeJsonResponse({ investorType: 'pro', confidence: 80 })
        )
      );
      const userId = new Types.ObjectId();
      await profileExtraction.execute(
        { userInput: 'investor' },
        makeCtx(userId, 'trace-corr')
      );

      const events = await reads.getEventsByTraceId('trace-corr');
      const profileEvent = events.find((e) => e.eventType === 'profile');
      expect(profileEvent?.traceId).toBe('trace-corr');

      const costDocs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: 'trace-corr' })
        .toArray();
      expect(costDocs).toHaveLength(1);
      expect(costDocs[0]).toMatchObject({ traceId: 'trace-corr' });
    });

    it('getCurrentProfile returns the just-extracted profile', async () => {
      setAnthropicAdapter(
        makeStubAdapter(
          makeJsonResponse({
            investorType: 'lender',
            role: 'underwriter',
            confidence: 90,
          })
        )
      );
      const userId = new Types.ObjectId();
      await profileExtraction.execute(
        { userInput: "I'm an underwriter at a lender." },
        makeCtx(userId)
      );

      const profile = await reads.getCurrentProfile(userId);
      expect(profile).toMatchObject({
        investorType: 'lender',
        role: 'underwriter',
      });
    });
  });
});
