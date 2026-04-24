import { User } from '../models/User';
import { logger } from './logger';

/**
 * Ensure an admin user exists. In the magic-link era, we no longer seed
 * a password-based admin with a non-deliverable email. If ADMIN_EMAIL is
 * not set, this is a no-op — an existing user can be promoted to admin
 * directly in the database.
 *
 * Behavior:
 *   - ADMIN_EMAIL unset → no-op
 *   - ADMIN_EMAIL set + user exists → no-op (idempotent)
 *   - ADMIN_EMAIL set + user missing → create a magic-link-ready admin
 *     (no password, isVerified=true). First sign-in via magic link
 *     populates firstName/lastName/etc.
 */
export async function ensureAdminUser(): Promise<void> {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

  if (!adminEmail) {
    logger.info('[ensureAdminUser] ADMIN_EMAIL not set — skipping bootstrap.');
    return;
  }

  try {
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        logger.info(`[ensureAdminUser] Promoted ${adminEmail} to admin.`);
      } else {
        logger.info(`[ensureAdminUser] Admin user already present: ${adminEmail}`);
      }
      return;
    }

    const adminUser = new User({
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isVerified: true,
      emailVerifiedAt: new Date(),
    });

    await adminUser.save();
    logger.info(`[ensureAdminUser] Created admin user: ${adminEmail} (magic-link first sign-in)`);
  } catch (error) {
    logger.error('[ensureAdminUser] Failed:', error);
    // Never throw — don't block server startup.
  }
}
