/**
 * List all admin users. Read-only — safe to run anywhere.
 *
 * Usage:
 *   cd backend && npx tsx src/scripts/listAdmins.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // eslint-disable-next-line no-console
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);

  try {
    const admins = await User.find({ role: 'admin' })
      .select('email firstName lastName isVerified emailVerifiedAt createdAt lastLogin')
      .sort({ createdAt: 1 })
      .lean();

    if (admins.length === 0) {
      // eslint-disable-next-line no-console
      console.log('No admin users found.');
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`Found ${admins.length} admin user(s):\n`);
    admins.forEach((u, i) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || '(no name)';
      // eslint-disable-next-line no-console
      console.log(
        `${i + 1}. ${u.email}\n` +
        `   name:      ${name}\n` +
        `   verified:  ${u.isVerified ? 'yes' : 'no'}${u.emailVerifiedAt ? ` (${new Date(u.emailVerifiedAt).toISOString().slice(0, 10)})` : ''}\n` +
        `   created:   ${u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : '(unknown)'}\n` +
        `   lastLogin: ${u.lastLogin ? new Date(u.lastLogin).toISOString().slice(0, 10) : '(never)'}\n`
      );
    });
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed:', err);
  process.exit(10);
});
