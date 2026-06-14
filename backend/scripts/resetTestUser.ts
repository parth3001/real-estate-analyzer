/**
 * resetTestUser — wipe a user's entire footprint so a test email can
 * be re-used for fresh signups.
 *
 * Usage:
 *   npx tsx backend/scripts/resetTestUser.ts <email>
 *   npx tsx backend/scripts/resetTestUser.ts <email> --force   (skip confirm)
 *
 * Example:
 *   npx tsx backend/scripts/resetTestUser.ts ppatel21@gmail.com --force
 *
 * WHAT IT DELETES (everything tied to this userId or email):
 *   - User document
 *   - All events (AnalysisEvent, DecisionEvent, ConversationEvent,
 *     OverrideEvent, CritiqueEvent, AuditTrailEvent, WatchlistEvent,
 *     ProfileEvent) — all stored in the unified `events` collection
 *   - CostEvent (cost tracking, separate collection)
 *   - DealLicense + DealCredit (license collections)
 *   - Deal (legacy materialized deals)
 *   - Portfolio + PortfolioAnalytics + PortfolioRecommendations
 *   - PipelineDeal
 *   - Scenario
 *   - Feedback
 *   - SharedAnalysis
 *   - MagicLinkToken (matched by emailNormalized)
 *
 * SAFETY: requires explicit email argument. No bulk operations. Prints
 * a confirmation prompt before deleting unless --force is passed.
 *
 * THE PROBLEM IT SOLVES: gmail/outlook/icloud sub-addressing (+tag) is
 * stripped at signup time for anti-abuse (per normalizeEmail in
 * authController + magicLinkToken). So one Gmail inbox can't create
 * unlimited test users via `ppatel21+test1@gmail.com`,
 * `ppatel21+test2@gmail.com`, etc. — they all collapse to
 * `ppatel21@gmail.com`. For testing, this script lets you re-use ONE
 * email by wiping its account between test cycles.
 */

import mongoose, { Types } from 'mongoose';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { User } from '../src/models/User';
import { BaseEventModel } from '../src/models/events/BaseEvent';
import { CostEvent } from '../src/models/cost/CostEvent';
import { DealLicenseModel } from '../src/models/license/DealLicense';
import { DealCreditModel } from '../src/models/license/DealCredit';
import { DealModel } from '../src/models/Deal';
import { normalizeEmail } from '../src/utils/magicLinkToken';
import { MagicLinkTokenModel } from '../src/models/MagicLinkToken';

// Models that may or may not exist depending on what's been built —
// imported defensively; deletion skipped if the model isn't present.
async function safeDelete(
  label: string,
  modelPath: string,
  filter: Record<string, unknown>
): Promise<number> {
  try {
    const mod = await import(modelPath);
    const Model =
      mod.default ?? mod[Object.keys(mod).find((k) => k.endsWith('Model')) ?? ''];
    if (!Model || typeof Model.deleteMany !== 'function') return 0;
    const result = await Model.deleteMany(filter);
    return result?.deletedCount ?? 0;
  } catch {
    return 0;
  }
}

async function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith('--'));
  const force = args.includes('--force');

  if (!email) {
    console.error('Usage: npx tsx scripts/resetTestUser.ts <email> [--force]');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);

  // Normalize the email the same way auth normalizes at signup time —
  // so we find users whose stored email differs from raw input due to
  // +tag stripping or Gmail dot collapsing.
  const normalized = normalizeEmail(email);
  if (normalized !== email) {
    console.log(`Email normalized: ${email} → ${normalized}`);
  }

  const user = await User.findOne({ email: normalized });
  if (!user) {
    console.log(`No user found with email "${normalized}". Nothing to delete.`);
    await mongoose.disconnect();
    return;
  }

  const userId = user._id as Types.ObjectId;
  console.log(`Found user: ${normalized} (id: ${userId.toHexString()})`);
  console.log(`First name: ${user.firstName}, anonymous: ${user.anonymous ?? false}`);

  if (!force) {
    const ok = await confirm(
      `\nWipe ALL data for this user (events, deals, licenses, credits, portfolios)?`
    );
    if (!ok) {
      console.log('Aborted.');
      await mongoose.disconnect();
      return;
    }
  }

  console.log('\nDeleting...');

  // 1. All event documents — substrate. The `events` collection is
  //    discriminator-keyed across all event types. One deleteMany
  //    covers them all.
  const eventsCount = await BaseEventModel.deleteMany({ userId }).then(
    (r) => r.deletedCount ?? 0
  );
  console.log(`  events:                 ${eventsCount}`);

  // 2. CostEvent — separate collection (cost tracking).
  const costEventsCount = await CostEvent.deleteMany({ userId }).then(
    (r) => r.deletedCount ?? 0
  );
  console.log(`  cost_events:            ${costEventsCount}`);

  // 3. License + credit collections.
  const licensesCount = await DealLicenseModel.deleteMany({ userId }).then(
    (r) => r.deletedCount ?? 0
  );
  console.log(`  deal_licenses:          ${licensesCount}`);

  const creditsCount = await DealCreditModel.deleteMany({ userId }).then(
    (r) => r.deletedCount ?? 0
  );
  console.log(`  deal_credits:           ${creditsCount}`);

  // 4. Legacy Deal records.
  const dealsCount = await DealModel.deleteMany({ userId }).then(
    (r) => r.deletedCount ?? 0
  );
  console.log(`  deals (legacy):         ${dealsCount}`);

  // 5. MagicLinkToken — match by emailNormalized field per
  //    MagicLinkToken.ts schema.
  const magicLinkCount = await MagicLinkTokenModel.deleteMany({
    emailNormalized: normalized,
  }).then((r) => r.deletedCount ?? 0);
  console.log(`  magic_link_tokens:      ${magicLinkCount}`);

  // 6. Defensive cleanup of portfolio / pipeline / feedback / shared
  //    analysis / scenario / portfolio analytics tables. Imports
  //    are dynamic because not every model may be wired up; safeDelete
  //    silently skips missing ones.
  const userIdFilter = { userId };
  const portfoliosCount = await safeDelete(
    'portfolios',
    '../src/models/Portfolio',
    userIdFilter
  );
  console.log(`  portfolios:             ${portfoliosCount}`);

  const portfolioAnalyticsCount = await safeDelete(
    'portfolio_analytics',
    '../src/models/PortfolioAnalytics',
    userIdFilter
  );
  console.log(`  portfolio_analytics:    ${portfolioAnalyticsCount}`);

  const portfolioRecsCount = await safeDelete(
    'portfolio_recommendations',
    '../src/models/PortfolioRecommendations',
    userIdFilter
  );
  console.log(`  portfolio_recs:         ${portfolioRecsCount}`);

  const pipelineDealsCount = await safeDelete(
    'pipeline_deals',
    '../src/models/PipelineDeal',
    userIdFilter
  );
  console.log(`  pipeline_deals:         ${pipelineDealsCount}`);

  const scenarioCount = await safeDelete(
    'scenarios',
    '../src/models/Scenario',
    userIdFilter
  );
  console.log(`  scenarios:              ${scenarioCount}`);

  const feedbackCount = await safeDelete(
    'feedback',
    '../src/models/Feedback',
    userIdFilter
  );
  console.log(`  feedback:               ${feedbackCount}`);

  const sharedAnalysisCount = await safeDelete(
    'shared_analyses',
    '../src/models/SharedAnalysis',
    userIdFilter
  );
  console.log(`  shared_analyses:        ${sharedAnalysisCount}`);

  // 7. Finally — the User document itself.
  await User.deleteOne({ _id: userId });
  console.log(`  user:                   1`);

  console.log(`\n✓ Wiped ${normalized}. You can sign up fresh with the same email.`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
