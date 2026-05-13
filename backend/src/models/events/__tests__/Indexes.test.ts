/**
 * W1-S6 acceptance test — index strategy per events store §7.
 *
 * Verifies that connecting to a Mongoose-managed MongoDB (in-memory here)
 * creates every index the read API expects. Catches regressions where
 * an index declaration is silently dropped or renamed, which would make
 * production reads fall back to COLLSCAN.
 *
 * The events store enforces a 1:1 contract between query recipes (§8)
 * and indexes (§7). New queries demand new indexes; this test is the
 * tripwire.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { BaseEventModel } from '../BaseEvent';
// Importing discriminators forces their registration so the unified
// collection gets the full set of indexes when syncIndexes() runs.
import '../ProfileEvent';
import '../AnalysisEvent';
import '../DecisionEvent';
import '../OverrideEvent';
import '../CritiqueEvent';
import '../ConversationEvent';
import '../AuditTrailEvent';
import '../WatchlistEvent';
import '../OutcomeEvent';
import '../PortfolioEvent';
import '../PipelineEvent';

const SETUP_TIMEOUT_MS = 90_000;

describe('Events collection indexes (W1-S6)', () => {
  let mongoServer: MongoMemoryServer;
  let indexes: Record<string, unknown>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    // Ensure all declared indexes are materialized in the underlying collection.
    await BaseEventModel.syncIndexes();
    indexes = await BaseEventModel.collection.indexInformation();
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  /**
   * Helper — find an index whose key spec matches the given key pairs.
   * MongoDB returns the keys as an array of [field, direction] tuples.
   */
  function findIndexByKey(keyPairs: Array<[string, number]>): unknown[] | null {
    for (const value of Object.values(indexes)) {
      if (
        Array.isArray(value) &&
        value.length === keyPairs.length &&
        value.every(
          (pair, i) =>
            Array.isArray(pair) &&
            pair[0] === keyPairs[i][0] &&
            pair[1] === keyPairs[i][1]
        )
      ) {
        return value as unknown[];
      }
    }
    return null;
  }

  // ===== Single-field indexes inherited from the schema =====

  it('has a single-field index on traceId', () => {
    expect(findIndexByKey([['traceId', 1]])).not.toBeNull();
  });

  it('has a single-field index on userId', () => {
    expect(findIndexByKey([['userId', 1]])).not.toBeNull();
  });

  it('has a single-field index on timestamp', () => {
    expect(findIndexByKey([['timestamp', 1]])).not.toBeNull();
  });

  // ===== Compound indexes (§7) =====

  it('has compound index { userId: 1, timestamp: -1 } for per-user feed', () => {
    expect(
      findIndexByKey([
        ['userId', 1],
        ['timestamp', -1],
      ])
    ).not.toBeNull();
  });

  it('has compound index { userId: 1, eventType: 1, timestamp: -1 } for type-filtered feed', () => {
    expect(
      findIndexByKey([
        ['userId', 1],
        ['eventType', 1],
        ['timestamp', -1],
      ])
    ).not.toBeNull();
  });

  // ===== Sparse compound indexes =====

  it('has sparse index { payload.dealId: 1, timestamp: -1 } for per-deal history', () => {
    expect(indexes.payload_dealId_timestamp).toBeDefined();
  });

  it('has sparse index { payload.sessionId: 1, eventType: 1 } for conversation reload', () => {
    expect(indexes.payload_sessionId_eventType).toBeDefined();
  });

  it('has sparse index { institutionId: 1, eventType: 1, timestamp: -1 } for B2B compliance', () => {
    expect(indexes.institutionId_eventType_timestamp).toBeDefined();
  });

  it('has sparse index { payload.criticPersona: 1, timestamp: -1 } for kill-criterion eval', () => {
    expect(indexes.payload_criticPersona_timestamp).toBeDefined();
  });

  it('has sparse index { payload.originalDecisionId: 1, timestamp: 1 } for audit-trail joins', () => {
    expect(indexes.payload_originalDecisionId_timestamp).toBeDefined();
  });

  it('has sparse index { payload.fieldPath: 1, timestamp: -1 } for override calibration aggregation', () => {
    expect(indexes.payload_fieldPath_timestamp).toBeDefined();
  });

  // ===== Sparse semantics =====

  it('sparse indexes carry sparse: true (verified via collection.indexes())', async () => {
    const fullIndexList = await BaseEventModel.collection.indexes();
    const namesExpectedSparse = [
      'payload_dealId_timestamp',
      'payload_sessionId_eventType',
      'institutionId_eventType_timestamp',
      'payload_criticPersona_timestamp',
      'payload_originalDecisionId_timestamp',
      'payload_fieldPath_timestamp',
    ];
    for (const name of namesExpectedSparse) {
      const idx = fullIndexList.find((i) => i.name === name);
      expect(idx).toBeDefined();
      expect(idx?.sparse).toBe(true);
    }
  });
});
