/**
 * W1-S5b acceptance test — startup verification of the events-writer role.
 *
 * The interesting logic is `evaluateAuthInfo` (pure function) and the
 * mode-driven branching in `verifyEventsRoleOnStartup`. The latter is
 * tested by stubbing `mongoose.connection.db.admin().command()` so we
 * don't need a live Mongo connection.
 */

import mongoose from 'mongoose';
import {
  EXPECTED_ROLE_NAME,
  evaluateAuthInfo,
  resolveCheckMode,
  verifyEventsRoleOnStartup,
  type ConnectionAuthInfo,
} from '../eventsRoleVerification';

describe('eventsRoleVerification (W1-S5b)', () => {
  // Snapshot env so each test can mutate freely without leaking state.
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.restoreAllMocks();
  });

  // ===== evaluateAuthInfo (pure) =====

  describe('evaluateAuthInfo', () => {
    it('returns hasExpectedRole=true when eventsAppendOnly is present', () => {
      const authInfo: ConnectionAuthInfo = {
        authenticatedUsers: [{ user: 'reanalyzr_events_writer', db: 'admin' }],
        authenticatedUserRoles: [{ role: EXPECTED_ROLE_NAME, db: 'admin' }],
      };
      const result = evaluateAuthInfo(authInfo);
      expect(result.hasExpectedRole).toBe(true);
      expect(result.observedRoles).toEqual([EXPECTED_ROLE_NAME]);
      expect(result.authenticatedUser).toBe('reanalyzr_events_writer@admin');
    });

    it('returns hasExpectedRole=false when only readWrite is present (Atlas M0 baseline)', () => {
      const authInfo: ConnectionAuthInfo = {
        authenticatedUsers: [{ user: 'reanalyzr_dev_user', db: 'admin' }],
        authenticatedUserRoles: [
          { role: 'readWrite', db: 'real-estate-analyzer-dev' },
          { role: 'dbAdmin', db: 'real-estate-analyzer-dev' },
        ],
      };
      const result = evaluateAuthInfo(authInfo);
      expect(result.hasExpectedRole).toBe(false);
      expect(result.observedRoles).toEqual(['readWrite', 'dbAdmin']);
    });

    it('handles unauthenticated connections (empty arrays)', () => {
      const authInfo: ConnectionAuthInfo = {
        authenticatedUsers: [],
        authenticatedUserRoles: [],
      };
      const result = evaluateAuthInfo(authInfo);
      expect(result.hasExpectedRole).toBe(false);
      expect(result.authenticatedUser).toBeNull();
    });

    it('handles a null authInfo (e.g., command failed)', () => {
      const result = evaluateAuthInfo(null);
      expect(result.hasExpectedRole).toBe(false);
      expect(result.observedRoles).toEqual([]);
      expect(result.authenticatedUser).toBeNull();
    });
  });

  // ===== resolveCheckMode =====

  describe('resolveCheckMode', () => {
    it("defaults to 'warn' when env var is unset", () => {
      delete process.env.EVENTS_ROLE_CHECK_MODE;
      expect(resolveCheckMode()).toBe('warn');
    });

    it("accepts 'strict' / 'warn' / 'skip' case-insensitively", () => {
      process.env.EVENTS_ROLE_CHECK_MODE = 'STRICT';
      expect(resolveCheckMode()).toBe('strict');
      process.env.EVENTS_ROLE_CHECK_MODE = 'Skip';
      expect(resolveCheckMode()).toBe('skip');
    });

    it("falls back to 'warn' on unknown values (prevents accidental skip)", () => {
      process.env.EVENTS_ROLE_CHECK_MODE = 'ignore';
      expect(resolveCheckMode()).toBe('warn');
    });
  });

  // ===== verifyEventsRoleOnStartup (mode branching) =====

  describe('verifyEventsRoleOnStartup', () => {
    /**
     * Helper: stub mongoose.connection.db.admin().command() to return a
     * caller-supplied authInfo (or throw a caller-supplied error). Returns
     * a teardown fn the test must call (or use the afterEach restore).
     */
    const originalDbDescriptor = Object.getOwnPropertyDescriptor(
      mongoose.connection,
      'db'
    );

    function stubConnectionStatus(
      payload: { authInfo?: ConnectionAuthInfo } | Error
    ): jest.Mock {
      const command = jest.fn().mockImplementation(() => {
        if (payload instanceof Error) return Promise.reject(payload);
        return Promise.resolve(payload);
      });
      const adminMock = { command };
      // `connection.db` is a writable property (not a getter) on disconnected
      // connections. Use defineProperty to make it stub-friendly across versions.
      Object.defineProperty(mongoose.connection, 'db', {
        configurable: true,
        get: () => ({ admin: () => adminMock }),
      });
      return command;
    }

    afterEach(() => {
      if (originalDbDescriptor) {
        Object.defineProperty(mongoose.connection, 'db', originalDbDescriptor);
      } else {
        // No descriptor existed originally; remove our stub.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (mongoose.connection as any).db;
      }
    });

    it("returns silently in 'skip' mode without reading authInfo", async () => {
      process.env.EVENTS_ROLE_CHECK_MODE = 'skip';
      const command = stubConnectionStatus({
        authInfo: { authenticatedUsers: [], authenticatedUserRoles: [] },
      });
      await expect(verifyEventsRoleOnStartup()).resolves.toBeUndefined();
      // connectionStatus shouldn't even be invoked in skip mode
      expect(command).not.toHaveBeenCalled();
    });

    it("passes in 'strict' mode when the role IS present", async () => {
      process.env.EVENTS_ROLE_CHECK_MODE = 'strict';
      stubConnectionStatus({
        authInfo: {
          authenticatedUsers: [{ user: 'reanalyzr_events_writer', db: 'admin' }],
          authenticatedUserRoles: [{ role: EXPECTED_ROLE_NAME, db: 'admin' }],
        },
      });
      await expect(verifyEventsRoleOnStartup()).resolves.toBeUndefined();
    });

    it("throws in 'strict' mode when the role is NOT present", async () => {
      process.env.EVENTS_ROLE_CHECK_MODE = 'strict';
      stubConnectionStatus({
        authInfo: {
          authenticatedUsers: [{ user: 'reanalyzr_dev_user', db: 'admin' }],
          authenticatedUserRoles: [{ role: 'readWrite', db: 'real-estate-analyzer-dev' }],
        },
      });
      await expect(verifyEventsRoleOnStartup()).rejects.toThrow(
        /Events role check \(strict\):/
      );
    });

    it("logs a warning but DOES NOT throw in 'warn' mode when the role is missing", async () => {
      process.env.EVENTS_ROLE_CHECK_MODE = 'warn';
      stubConnectionStatus({
        authInfo: {
          authenticatedUsers: [{ user: 'reanalyzr_dev_user', db: 'admin' }],
          authenticatedUserRoles: [{ role: 'readWrite', db: 'real-estate-analyzer-dev' }],
        },
      });
      await expect(verifyEventsRoleOnStartup()).resolves.toBeUndefined();
    });

    it("throws in 'strict' mode when the connectionStatus command itself fails", async () => {
      process.env.EVENTS_ROLE_CHECK_MODE = 'strict';
      stubConnectionStatus(new Error('not authorized'));
      await expect(verifyEventsRoleOnStartup()).rejects.toThrow(
        /Events role check \(strict\): unable to read connectionStatus/
      );
    });

    it("does NOT throw in 'warn' mode when the connectionStatus command fails", async () => {
      process.env.EVENTS_ROLE_CHECK_MODE = 'warn';
      stubConnectionStatus(new Error('not authorized'));
      await expect(verifyEventsRoleOnStartup()).resolves.toBeUndefined();
    });
  });
});
