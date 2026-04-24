/**
 * Merge two users: reassign all userId-linked documents from --from to --to,
 * then delete the --from user. Atomic via a MongoDB transaction (Atlas
 * supports transactions on replica sets).
 *
 * Usage (dry run):
 *   cd backend && npx tsx src/scripts/mergeUsers.ts \
 *     --from stale@email.com --to real@email.com
 *
 * Usage (commit):
 *   cd backend && npx tsx src/scripts/mergeUsers.ts \
 *     --from stale@email.com --to real@email.com --confirm
 *
 * Safety:
 *   - Refuses if either user is missing.
 *   - Refuses if --from and --to resolve to the same _id.
 *   - Transaction rolls back on any error (reassignment partial OR delete fails).
 *   - Dry-run is default — you must pass --confirm to write.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';

function getArg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const idx = args.indexOf(flag);
  return idx === -1 ? undefined : args[idx + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.slice(2).includes(flag);
}

async function main() {
  const fromEmail = getArg('--from');
  const toEmail = getArg('--to');
  const confirm = hasFlag('--confirm');

  if (!fromEmail || !toEmail) {
    // eslint-disable-next-line no-console
    console.error('Usage: mergeUsers.ts --from <email> --to <email> [--confirm]');
    process.exit(1);
  }

  const from = fromEmail.trim().toLowerCase();
  const to = toEmail.trim().toLowerCase();

  if (from === to) {
    // eslint-disable-next-line no-console
    console.error('--from and --to are the same email. Nothing to merge.');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // eslint-disable-next-line no-console
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);

  try {
    const fromUser = await User.findOne({ email: from });
    const toUser = await User.findOne({ email: to });

    if (!fromUser) {
      // eslint-disable-next-line no-console
      console.error(`Source user "${from}" not found.`);
      process.exit(2);
    }
    if (!toUser) {
      // eslint-disable-next-line no-console
      console.error(`Target user "${to}" not found.`);
      process.exit(2);
    }
    if (fromUser._id.equals(toUser._id)) {
      // eslint-disable-next-line no-console
      console.error('Resolved to the same user _id. Refusing.');
      process.exit(2);
    }

    // eslint-disable-next-line no-console
    console.log(
      `Merging:\n  FROM ${fromUser.email}  (id=${fromUser._id}, role=${fromUser.role})\n` +
        `  TO   ${toUser.email}  (id=${toUser._id}, role=${toUser.role})\n`
    );

    const db = mongoose.connection.db!;
    const collections = await db.listCollections().toArray();

    // Count per-collection docs to be reassigned
    const plan: Array<{ collection: string; count: number }> = [];
    for (const coll of collections) {
      const name = coll.name;
      try {
        const count = await db
          .collection(name)
          .countDocuments({ userId: fromUser._id });
        if (count > 0) plan.push({ collection: name, count });
      } catch {
        // skip collections whose schema doesn't accept our query shape
      }
    }

    if (plan.length === 0) {
      // eslint-disable-next-line no-console
      console.log('No documents to reassign. Only the source user will be deleted.');
    } else {
      // eslint-disable-next-line no-console
      console.log('Planned reassignments:');
      plan
        .sort((a, b) => b.count - a.count)
        .forEach((r) => {
          // eslint-disable-next-line no-console
          console.log(`  ${r.collection.padEnd(30)} ${r.count}`);
        });
    }

    if (!confirm) {
      // eslint-disable-next-line no-console
      console.log(
        '\nDRY RUN — no changes written. Re-run with --confirm to execute.'
      );
      return;
    }

    // eslint-disable-next-line no-console
    console.log('\n--confirm detected. Executing merge in a transaction…');

    const session = await mongoose.startSession();
    try {
      let totalReassigned = 0;
      await session.withTransaction(async () => {
        for (const item of plan) {
          const res = await db
            .collection(item.collection)
            .updateMany(
              { userId: fromUser._id },
              { $set: { userId: toUser._id } },
              { session }
            );
          totalReassigned += res.modifiedCount;
          // eslint-disable-next-line no-console
          console.log(
            `  ✓ ${item.collection}: reassigned ${res.modifiedCount} docs`
          );
        }

        const del = await db
          .collection('users')
          .deleteOne({ _id: fromUser._id }, { session });
        if (del.deletedCount !== 1) {
          throw new Error(
            `Expected to delete 1 user, deleted ${del.deletedCount}. Rolling back.`
          );
        }
        // eslint-disable-next-line no-console
        console.log(`  ✓ users: deleted source user ${fromUser.email}`);
      });

      // eslint-disable-next-line no-console
      console.log(
        `\nMerge complete. ${totalReassigned} documents reassigned; source user deleted.`
      );
    } finally {
      await session.endSession();
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed:', err);
  process.exit(10);
});
