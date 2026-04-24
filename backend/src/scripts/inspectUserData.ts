/**
 * Read-only inspection of what data is tied to a given user's _id.
 * Use before deleting a user to see the blast radius.
 *
 * Usage:
 *   cd backend && npx tsx src/scripts/inspectUserData.ts --email <email>
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';

function getArg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const idx = args.indexOf(flag);
  return idx === -1 ? undefined : args[idx + 1];
}

async function main() {
  const email = getArg('--email');
  if (!email) {
    // eslint-disable-next-line no-console
    console.error('Usage: inspectUserData.ts --email <email>');
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
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // eslint-disable-next-line no-console
      console.log(`No user found with email "${email}".`);
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`User: ${user.email}  (id=${user._id}, role=${user.role})\n`);

    // Enumerate every collection with a userId field
    const db = mongoose.connection.db!;
    const collections = await db.listCollections().toArray();

    const results: Array<{ collection: string; count: number }> = [];
    for (const coll of collections) {
      const name = coll.name;
      try {
        const count = await db
          .collection(name)
          .countDocuments({ userId: user._id });
        if (count > 0) results.push({ collection: name, count });
      } catch {
        // some system collections don't accept our query shape — skip
      }
    }

    if (results.length === 0) {
      // eslint-disable-next-line no-console
      console.log('No related documents found in any collection.');
    } else {
      // eslint-disable-next-line no-console
      console.log('Related documents by collection:');
      results
        .sort((a, b) => b.count - a.count)
        .forEach((r) => {
          // eslint-disable-next-line no-console
          console.log(`  ${r.collection.padEnd(30)} ${r.count}`);
        });
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
