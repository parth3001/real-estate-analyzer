/**
 * pendingChatClaim helpers — W6-S5.
 *
 * Unit tests for the localStorage handoff between the chat surface and
 * the magic-link verify page.
 *
 * Coverage:
 *   - write → read round-trip preserves the record + stamps stashedAt
 *   - read returns null when nothing is stored
 *   - read drops malformed JSON
 *   - read drops a structurally-invalid record (wrong types)
 *   - read drops stale records older than the TTL
 *   - clear removes the record
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PENDING_CHAT_CLAIM_KEY,
  PENDING_CLAIM_TTL_MS,
  readPendingChatClaim,
  clearPendingChatClaim,
  writePendingChatClaim,
} from '../pendingChatClaim';

describe('pendingChatClaim helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('write → read round-trips the record + stamps stashedAt', () => {
    writePendingChatClaim({
      sessionId: '11111111-2222-4333-8444-555555555555',
      returnTo: '/app',
      conversationEventId: '6a0700000000000000000001',
    });
    const read = readPendingChatClaim();
    expect(read).toMatchObject({
      sessionId: '11111111-2222-4333-8444-555555555555',
      returnTo: '/app',
      conversationEventId: '6a0700000000000000000001',
    });
    expect(typeof read?.stashedAt).toBe('number');
    expect(read?.stashedAt).toBeLessThanOrEqual(Date.now());
  });

  it('read returns null when storage is empty', () => {
    expect(readPendingChatClaim()).toBeNull();
  });

  it('read drops + removes malformed JSON', () => {
    localStorage.setItem(PENDING_CHAT_CLAIM_KEY, '{ not valid json');
    expect(readPendingChatClaim()).toBeNull();
    expect(localStorage.getItem(PENDING_CHAT_CLAIM_KEY)).toBeNull();
  });

  it('read drops + removes a structurally-invalid record', () => {
    // Missing sessionId, missing stashedAt, etc.
    localStorage.setItem(
      PENDING_CHAT_CLAIM_KEY,
      JSON.stringify({ someOtherField: 'nope' })
    );
    expect(readPendingChatClaim()).toBeNull();
    expect(localStorage.getItem(PENDING_CHAT_CLAIM_KEY)).toBeNull();
  });

  it('read drops + removes records older than the TTL', () => {
    const stale = Date.now() - PENDING_CLAIM_TTL_MS - 1000;
    localStorage.setItem(
      PENDING_CHAT_CLAIM_KEY,
      JSON.stringify({
        sessionId: '11111111-2222-4333-8444-555555555555',
        returnTo: '/app',
        stashedAt: stale,
      })
    );
    expect(readPendingChatClaim()).toBeNull();
    expect(localStorage.getItem(PENDING_CHAT_CLAIM_KEY)).toBeNull();
  });

  it('clear removes any stored record', () => {
    writePendingChatClaim({
      sessionId: '11111111-2222-4333-8444-555555555555',
      returnTo: '/app',
    });
    clearPendingChatClaim();
    expect(readPendingChatClaim()).toBeNull();
  });

  it('handles a missing localStorage gracefully (SSR safety)', () => {
    // Simulate SSR by stubbing localStorage to undefined for one call.
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: vi.fn(() => undefined),
    });
    try {
      expect(readPendingChatClaim()).toBeNull();
      // write should be a no-op (no throw)
      expect(() =>
        writePendingChatClaim({
          sessionId: 's',
          returnTo: '/app',
        })
      ).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: original,
      });
    }
  });
});
