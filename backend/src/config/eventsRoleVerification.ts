/**
 * W1-S5b — Startup verification that the events-writer user has the
 * expected append-only role.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §6.3.
 *
 * Why this matters:
 *
 *   The events-writer should only have `find` + `insert` privileges on
 *   the events collection. If the connection string is accidentally
 *   rotated to an admin-privileged user, the schema-level pre-hooks
 *   (BaseEvent.ts) and repository (EventsRepository.ts) would still
 *   prevent application-code mutations — but a future bug, direct shell
 *   access, or a misbehaving migration script would no longer be caught
 *   at the DB layer.
 *
 *   This module reads `connectionStatus.authInfo` on startup and verifies
 *   the currently-authenticated user's role set. If the expected role
 *   isn't present, behavior depends on `EVENTS_ROLE_CHECK_MODE`:
 *
 *     - 'strict' (recommended for production)  → throw, refuse to start
 *     - 'warn'   (default; dev / Atlas M0)     → log a warning, continue
 *     - 'skip'   (CI / tests)                  → no-op
 *
 *   M0 Atlas free tier doesn't support custom roles, so the dev cluster
 *   will always log a warning. That's the intended behavior: the layer-3
 *   safety net is aspirational on M0, real on M10+ in production.
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/** The role name the provisioning script (scripts/provision-events-role.js) creates. */
export const EXPECTED_ROLE_NAME = 'eventsAppendOnly';

/** Env-var-driven check mode. */
export type RoleCheckMode = 'strict' | 'warn' | 'skip';

/**
 * Returns the requested check mode. Defaults to 'warn' to keep dev frictionless.
 *
 * Set EVENTS_ROLE_CHECK_MODE=strict in production where the cluster supports
 * custom roles and the writer user is bound to `eventsAppendOnly`.
 */
export function resolveCheckMode(): RoleCheckMode {
  const raw = (process.env.EVENTS_ROLE_CHECK_MODE ?? '').toLowerCase().trim();
  if (raw === 'strict' || raw === 'warn' || raw === 'skip') return raw;
  return 'warn';
}

// ===== authInfo shape =====

/**
 * Shape of the relevant subset of `connectionStatus.authInfo`.
 * Mongo's response is larger; we type only what we read.
 */
export interface ConnectionAuthInfo {
  authenticatedUsers: Array<{ user: string; db: string }>;
  authenticatedUserRoles: Array<{ role: string; db: string }>;
}

/** Internal — pull `connectionStatus.authInfo` from the live mongoose connection. */
async function readAuthInfo(): Promise<ConnectionAuthInfo | null> {
  const db = mongoose.connection.db;
  if (!db) return null;
  // `connectionStatus` returns auth info for the current connection;
  // showPrivileges is not needed (we only care about role names).
  const result = await db.admin().command({ connectionStatus: 1 });
  const authInfo = result?.authInfo as ConnectionAuthInfo | undefined;
  return authInfo ?? null;
}

// ===== Verification result =====

export interface RoleCheckResult {
  /** True iff `authenticatedUserRoles` contains a role matching EXPECTED_ROLE_NAME. */
  hasExpectedRole: boolean;
  /** Roles actually held by the current user, e.g. ['readWrite', 'dbAdmin']. */
  observedRoles: string[];
  /** Authenticated user (e.g., 'reanalyzr_events_writer@admin'). null if unauthenticated. */
  authenticatedUser: string | null;
}

/**
 * Computes whether the authenticated user has the expected append-only role.
 * Exposed for unit tests; in normal flow callers should use `verifyEventsRoleOnStartup`.
 */
export function evaluateAuthInfo(authInfo: ConnectionAuthInfo | null): RoleCheckResult {
  if (!authInfo) {
    return { hasExpectedRole: false, observedRoles: [], authenticatedUser: null };
  }
  const observedRoles = authInfo.authenticatedUserRoles.map((r) => r.role);
  const hasExpectedRole = observedRoles.includes(EXPECTED_ROLE_NAME);
  const authenticatedUser =
    authInfo.authenticatedUsers.length > 0
      ? `${authInfo.authenticatedUsers[0].user}@${authInfo.authenticatedUsers[0].db}`
      : null;
  return { hasExpectedRole, observedRoles, authenticatedUser };
}

// ===== Public entry point =====

/**
 * Verify the append-only role on startup. Behavior depends on
 * EVENTS_ROLE_CHECK_MODE:
 *
 *   - 'strict': throws if the expected role isn't present
 *   - 'warn':   logs a warning, continues
 *   - 'skip':   no-op
 *
 * Always logs the outcome (info on pass, warn on miss, error before throw).
 *
 * Must be called AFTER `mongoose.connect()` resolves.
 */
export async function verifyEventsRoleOnStartup(): Promise<void> {
  const mode = resolveCheckMode();

  if (mode === 'skip') {
    logger.info('Events role check: SKIPPED (EVENTS_ROLE_CHECK_MODE=skip)');
    return;
  }

  let authInfo: ConnectionAuthInfo | null;
  try {
    authInfo = await readAuthInfo();
  } catch (error) {
    // connectionStatus requires no privileges, but if it fails for any
    // reason (network, unsupported deployment), don't block startup in
    // 'warn' mode. In 'strict' mode, this IS a failure.
    const message = error instanceof Error ? error.message : String(error);
    if (mode === 'strict') {
      logger.error(`Events role check: failed to read authInfo — ${message}`);
      throw new Error(`Events role check (strict): unable to read connectionStatus — ${message}`);
    }
    logger.warn(`Events role check: could not read authInfo (${message}) — continuing in 'warn' mode`);
    return;
  }

  const result = evaluateAuthInfo(authInfo);

  if (result.hasExpectedRole) {
    logger.info(
      `Events role check: ✅ user '${result.authenticatedUser}' has '${EXPECTED_ROLE_NAME}'`
    );
    return;
  }

  const detail =
    `expected role '${EXPECTED_ROLE_NAME}' not found on authenticated user ` +
    `'${result.authenticatedUser ?? 'unauthenticated'}' ` +
    `(observed roles: ${result.observedRoles.length > 0 ? result.observedRoles.join(', ') : 'none'})`;

  if (mode === 'strict') {
    logger.error(`Events role check (strict): ${detail}`);
    throw new Error(
      `Events role check (strict): ${detail}. ` +
        `Provision the role via scripts/provision-events-role.js and rotate MONGODB_URI to use the writer user, ` +
        `or set EVENTS_ROLE_CHECK_MODE=warn for dev clusters (e.g., Atlas M0) that don't support custom roles.`
    );
  }

  // mode === 'warn'
  logger.warn(
    `Events role check: ⚠️  ${detail}. Append-only is enforced at the repository + schema layers; ` +
      `DB-level enforcement is missing. Set EVENTS_ROLE_CHECK_MODE=strict in production once the writer user is provisioned.`
  );
}
