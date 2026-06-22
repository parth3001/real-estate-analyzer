/**
 * MANUAL TEST — real Haiku call through profile_extraction.
 * Not part of CI; not part of the smoke test.
 *
 * Requires ANTHROPIC_API_KEY. Costs ~$0.001 total for the 4 calls.
 *
 * Run:
 *   cd backend && npx ts-node scripts/manual-test-profile.ts
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { profileExtraction } from '../src/agents/tools/profile_extraction';
import { eventsRepository } from '../src/repositories/EventsRepository';
import { eventsRepositoryReads } from '../src/repositories/EventsRepositoryReads';

(async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  ANTHROPIC_API_KEY not set. Add to backend/.env and re-run.');
    process.exit(1);
  }

  const m = await MongoMemoryServer.create();
  await mongoose.connect(m.getUri());

  const userId = new Types.ObjectId();
  const ctx = {
    traceId: 'real-call',
    userId,
    eventsRepo: eventsRepository,
    eventsReads: eventsRepositoryReads,
    tools: {},
  };

  const cases = [
    "I'm a loan officer at a credit union in Wichita; we close about 30 deals a year.",
    'Just getting started — really cautious. Bought one duplex last year.',
    'I run a private lending fund out of Austin, focused on bridge loans.',
    'hey', // edge case — minimal input
  ];

  for (const userInput of cases) {
    console.log('\n──────────────────────────────');
    console.log('INPUT:    ', userInput);
    try {
      const out = await profileExtraction.execute({ userInput }, ctx);
      console.log('EXTRACTED:', JSON.stringify(out.extractedProfile, null, 2));
      console.log('CONFIDENCE:', out.confidence);
      console.log('NEW FIELDS:', out.hadNewFields);
    } catch (e) {
      console.log('THREW:', (e as Error).message);
    }
  }

  // Total cost from CostEvents
  const costs = await mongoose.connection.db.collection('cost_events').find({}).toArray();
  const totalCents = costs.reduce(
    (s, c) => s + ((c as unknown as { costCents: number }).costCents ?? 0),
    0
  );
  console.log('\n──────────────────────────────');
  console.log(`💰  ${costs.length} CostEvents written, total = ${totalCents.toFixed(4)}¢ (about $${(totalCents / 100).toFixed(5)})`);

  await mongoose.disconnect();
  await m.stop();
})();
