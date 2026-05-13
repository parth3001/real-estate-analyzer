/**
 * W1-S5 — MongoDB role provisioning script for the events store.
 *
 * Run once per cluster, by an admin user, to create:
 *   1. The `eventsAppendOnly` custom role (find + insert on the events
 *      collection only; explicitly no update/remove/drop privileges)
 *   2. The `reanalyzr_events_writer` user bound to that role
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §6.1 and §6.2 — this is the
 * third layer of append-only enforcement, below the repository layer
 * (W1-S3) and the schema-level pre-hooks (W1-S1).
 *
 * USAGE
 * -----
 *
 * Against a self-hosted MongoDB:
 *   mongosh "mongodb://admin_user:pass@host/admin" \
 *     scripts/provision-events-role.js \
 *     --eval "var EVENTS_WRITER_PASSWORD='...'; var TARGET_DB='real-estate-analyzer';"
 *
 * Against MongoDB Atlas:
 *   Atlas restricts custom database roles to M10+ tier clusters; the M0
 *   free tier rejects createRole / createUser. If your cluster is M10+,
 *   run with the Atlas admin connection string. If M0, this script will
 *   exit with a clear error and the app continues to use the existing
 *   reanalyzr_dev_user — see startup-verification module (W1-S5b) which
 *   logs a warning instead of failing.
 *
 * IDEMPOTENCY
 * -----------
 *
 * The script:
 *   - Checks for existing `eventsAppendOnly` role; updates if found.
 *   - Checks for existing `reanalyzr_events_writer` user; updates if found.
 *
 * So it's safe to re-run after schema evolutions that change the role's
 * scope. Password is only set on initial creation OR if EVENTS_WRITER_PASSWORD
 * is explicitly provided (so re-runs don't reset the password by accident).
 */

/* eslint-disable no-undef */
// `db`, `print`, `printjson` are mongosh globals — not Node.

(function () {
  // ===== Parameters =====
  // Set via --eval "var TARGET_DB='...'; var EVENTS_WRITER_PASSWORD='...';"

  const targetDb = typeof TARGET_DB === 'string' && TARGET_DB.length > 0
    ? TARGET_DB
    : 'real-estate-analyzer';

  const writerUsername = 'reanalyzr_events_writer';
  const writerPassword =
    typeof EVENTS_WRITER_PASSWORD === 'string' && EVENTS_WRITER_PASSWORD.length > 0
      ? EVENTS_WRITER_PASSWORD
      : null;

  const roleName = 'eventsAppendOnly';

  print(`\n[provision-events-role] Target database: ${targetDb}`);
  print(`[provision-events-role] Role: ${roleName}`);
  print(`[provision-events-role] User: ${writerUsername}`);

  // ===== 1. Create or update the role =====

  const adminDb = db.getSiblingDB('admin');

  const desiredPrivileges = [
    {
      resource: { db: targetDb, collection: 'events' },
      actions: ['find', 'insert'],
      // Intentionally NO 'update', NO 'remove', NO 'drop', NO 'bulkWrite'
      // (Mongo's bulkWrite is gated by per-operation privileges).
    },
  ];

  const existingRole = adminDb
    .getRoles({ rolesInfo: { role: roleName, db: 'admin' } })
    .roles.find((r) => r.role === roleName);

  if (existingRole) {
    print(`[provision-events-role] Role '${roleName}' exists — updating privileges`);
    adminDb.updateRole(roleName, { privileges: desiredPrivileges, roles: [] });
  } else {
    print(`[provision-events-role] Role '${roleName}' not found — creating`);
    adminDb.createRole({
      role: roleName,
      privileges: desiredPrivileges,
      roles: [],
    });
  }

  // ===== 2. Create or update the writer user =====

  const existingUser = adminDb
    .getUsers()
    .users.find((u) => u.user === writerUsername);

  if (existingUser) {
    print(`[provision-events-role] User '${writerUsername}' exists — updating role binding`);
    adminDb.updateUser(writerUsername, {
      roles: [{ role: roleName, db: 'admin' }],
    });
    if (writerPassword) {
      print(`[provision-events-role] EVENTS_WRITER_PASSWORD provided — resetting password`);
      adminDb.updateUser(writerUsername, { pwd: writerPassword });
    }
  } else {
    if (!writerPassword) {
      throw new Error(
        `User '${writerUsername}' does not exist and EVENTS_WRITER_PASSWORD was not provided. ` +
          `Re-run with --eval "var EVENTS_WRITER_PASSWORD='...';"`
      );
    }
    print(`[provision-events-role] Creating user '${writerUsername}'`);
    adminDb.createUser({
      user: writerUsername,
      pwd: writerPassword,
      roles: [{ role: roleName, db: 'admin' }],
    });
  }

  // ===== 3. Sanity check =====

  const finalRole = adminDb
    .getRole(roleName, { showPrivileges: true });
  const finalUser = adminDb.getUser(writerUsername, { showPrivileges: false });

  print(`\n[provision-events-role] ✅ Provisioning complete.\n`);
  print(`Role privileges:`);
  printjson(finalRole.privileges);
  print(`\nUser bindings:`);
  printjson(finalUser.roles);

  print(
    `\n[provision-events-role] Next step: rotate the production MONGODB_URI ` +
      `to use '${writerUsername}'. See PRODUCT_2.0_PROD_MIGRATION.md §2.4.\n`
  );
})();
