/**
 * One-off script: rename a user's email (typically an admin account that
 * was seeded with a non-deliverable address like admin@realestateanalyzer.com).
 *
 * Usage:
 *   npx tsx backend/src/scripts/migrateUserEmail.ts \
 *     --from admin@realestateanalyzer.com \
 *     --to real-email@example.com
 *
 * Safety checks:
 *   - Target email must not already exist (refuses to merge accounts).
 *   - Normalizes both addresses (lowercase + trim) to match the User schema.
 *   - Logs before/after for an audit trail.
 *
 * After running, the user signs in with --to via the normal magic-link flow
 * and keeps all their saved deals, portfolios, and role.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { logger } from '../utils/logger';

function parseArgs(): { from: string; to: string } {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx === -1 ? undefined : args[idx + 1];
  };
  const from = get('--from');
  const to = get('--to');

  if (!from || !to) {
    // eslint-disable-next-line no-console
    console.error(
      'Usage: migrateUserEmail.ts --from <old@email> --to <new@email>'
    );
    process.exit(1);
  }
  return { from: from.trim().toLowerCase(), to: to.trim().toLowerCase() };
}

async function main() {
  const { from, to } = parseArgs();

  if (from === to) {
    logger.error('--from and --to are the same. Nothing to do.');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('MONGODB_URI not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);

  try {
    const existing = await User.findOne({ email: from });
    if (!existing) {
      logger.error(`No user found with email "${from}"`);
      process.exit(2);
    }

    const collision = await User.findOne({ email: to });
    if (collision) {
      logger.error(
        `A user with email "${to}" already exists (id=${collision._id}). ` +
          `Refusing to merge — resolve manually.`
      );
      process.exit(3);
    }

    logger.info(
      `[migrateUserEmail] Renaming user ${existing._id}: "${from}" → "${to}" (role=${existing.role})`
    );

    existing.email = to;
    await existing.save();

    logger.info(`[migrateUserEmail] Done. User can now sign in with ${to} via magic link.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  logger.error('[migrateUserEmail] Failed', err);
  process.exit(10);
});
