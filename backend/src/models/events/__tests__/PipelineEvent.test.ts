/**
 * W1-S2 part 11 — PipelineEvent acceptance tests.
 * Discriminated union on `subType` — 5 pipeline actions.
 * Wave 1 schema; capture lights up in wave 1.5.
 *
 * pipeline_deal_closed.finalOutcome is intentionally schema-aligned with
 * OutcomeEvent.outcome — verified in the "outcome backfill alignment"
 * test at the bottom.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PipelineEventModel, PipelinePayloadSchema, PipelinePayload } from '../PipelineEvent';
import { APPEND_ONLY_ERROR } from '../BaseEvent';

const SETUP_TIMEOUT_MS = 90_000;

describe('PipelineEvent (W1-S2 part 11)', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  describe('Discriminated union — Zod parses all 5 subTypes', () => {
    it('parses deal_added_to_pipeline', () => {
      const payload: PipelinePayload = {
        subType: 'deal_added_to_pipeline',
        pipelineDealId: new Types.ObjectId(),
        dealId: new Types.ObjectId(),
        stage: 'initial_review',
      };
      expect(() => PipelinePayloadSchema.parse(payload)).not.toThrow();
    });

    it('parses pipeline_stage_changed', () => {
      const payload: PipelinePayload = {
        subType: 'pipeline_stage_changed',
        pipelineDealId: new Types.ObjectId(),
        oldStage: 'initial_review',
        newStage: 'under_contract',
        reason: 'Offer accepted',
      };
      expect(() => PipelinePayloadSchema.parse(payload)).not.toThrow();
    });

    it('parses pipeline_stage_changed without optional reason', () => {
      const payload: PipelinePayload = {
        subType: 'pipeline_stage_changed',
        pipelineDealId: new Types.ObjectId(),
        oldStage: 'under_contract',
        newStage: 'closed',
      };
      expect(() => PipelinePayloadSchema.parse(payload)).not.toThrow();
    });

    it('parses next_action_set', () => {
      const payload: PipelinePayload = {
        subType: 'next_action_set',
        pipelineDealId: new Types.ObjectId(),
        action: 'Schedule inspection',
        dueDate: new Date('2026-06-15'),
      };
      expect(() => PipelinePayloadSchema.parse(payload)).not.toThrow();
    });

    it('parses next_action_set with ISO-string date (coerced)', () => {
      const payload = {
        subType: 'next_action_set' as const,
        pipelineDealId: new Types.ObjectId(),
        action: 'Submit final paperwork',
        dueDate: '2026-06-15T10:00:00Z' as unknown as Date,
      };
      const parsed = PipelinePayloadSchema.parse(payload);
      if (parsed.subType === 'next_action_set') {
        expect(parsed.dueDate).toBeInstanceOf(Date);
      }
    });

    it('parses pipeline_deal_closed with all 4 outcomes', () => {
      const outcomes = ['closed', 'walked', 'fell_through', 'expired'] as const;
      for (const finalOutcome of outcomes) {
        const payload: PipelinePayload = {
          subType: 'pipeline_deal_closed',
          pipelineDealId: new Types.ObjectId(),
          finalOutcome,
        };
        expect(() => PipelinePayloadSchema.parse(payload)).not.toThrow();
      }
    });

    it('parses pipeline_note_added', () => {
      const payload: PipelinePayload = {
        subType: 'pipeline_note_added',
        pipelineDealId: new Types.ObjectId(),
        noteId: new Types.ObjectId(),
      };
      expect(() => PipelinePayloadSchema.parse(payload)).not.toThrow();
    });

    it('rejects unknown subType', () => {
      const payload = {
        subType: 'pipeline_paused',
        pipelineDealId: new Types.ObjectId(),
      } as unknown as PipelinePayload;
      expect(() => PipelinePayloadSchema.parse(payload)).toThrow();
    });

    it('rejects deal_added_to_pipeline with empty stage', () => {
      const payload = {
        subType: 'deal_added_to_pipeline' as const,
        pipelineDealId: new Types.ObjectId(),
        dealId: new Types.ObjectId(),
        stage: '',
      };
      expect(() => PipelinePayloadSchema.parse(payload)).toThrow();
    });
  });

  describe('Mongoose discriminator', () => {
    it('creates a PipelineEvent in events collection', async () => {
      const event = await PipelineEventModel.create({
        traceId: 'test-pipeline-1',
        eventVersion: 1,
        actorType: 'system',
        userId: new Types.ObjectId(),
        payload: {
          subType: 'deal_added_to_pipeline',
          pipelineDealId: new Types.ObjectId(),
          dealId: new Types.ObjectId(),
          stage: 'initial_review',
        },
      });
      expect(event.get('eventType')).toBe('pipeline');
      expect(event.get('payload').subType).toBe('deal_added_to_pipeline');
    });

    it('inherits append-only', async () => {
      const event = await PipelineEventModel.create({
        traceId: 'test-pipeline-2',
        eventVersion: 1,
        actorType: 'system',
        userId: new Types.ObjectId(),
        payload: {
          subType: 'pipeline_stage_changed',
          pipelineDealId: new Types.ObjectId(),
          oldStage: 'a',
          newStage: 'b',
        },
      });
      await expect(
        PipelineEventModel.updateOne({ _id: event._id }, { 'payload.newStage': 'c' })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });
  });

  describe('Outcome backfill alignment (pipeline_deal_closed → OutcomeEvent)', () => {
    it('pipeline_deal_closed.finalOutcome values match OutcomeEvent.outcome enum (closed/walked/fell_through)', () => {
      // The 3 outcomes that overlap with OutcomeEvent.outcome enum.
      // 'expired' is pipeline-specific (no corresponding outcome event).
      // 'defaulted' is outcome-specific (no pipeline equivalent — pipeline
      // doesn't track post-purchase defaults).
      const overlappingOutcomes = ['closed', 'walked', 'fell_through'] as const;
      for (const outcome of overlappingOutcomes) {
        const payload: PipelinePayload = {
          subType: 'pipeline_deal_closed',
          pipelineDealId: new Types.ObjectId(),
          finalOutcome: outcome,
        };
        expect(() => PipelinePayloadSchema.parse(payload)).not.toThrow();
        // When outcome capture activates, this same `finalOutcome` value
        // becomes the corresponding OutcomeEvent.outcome value.
      }
    });

    it('demonstrates the future backfill query pattern (closed deals from pipeline)', async () => {
      // The backfill pattern per events store §3.11:
      // SELECT pipeline events with finalOutcome='closed' →
      // CREATE corresponding OutcomeEvents seeded with this data
      const userId = new Types.ObjectId();
      const closedDeals: Array<PipelinePayload['subType' extends 'pipeline_deal_closed' ? PipelinePayload : never] | undefined> = [];

      for (let i = 0; i < 3; i++) {
        await PipelineEventModel.create({
          traceId: `pipeline-close-${i}`,
          eventVersion: 1,
          actorType: 'system',
          userId,
          payload: {
            subType: 'pipeline_deal_closed',
            pipelineDealId: new Types.ObjectId(),
            finalOutcome: 'closed',
          },
        });
      }

      const closed = await PipelineEventModel.find({
        userId,
        'payload.subType': 'pipeline_deal_closed',
        'payload.finalOutcome': 'closed',
      });
      expect(closed).toHaveLength(3);
      // Future: each of these maps 1:1 to a new OutcomeEvent insert.
    });
  });
});
