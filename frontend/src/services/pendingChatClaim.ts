/**
 * Pending chat-claim handoff — W6-S5.
 *
 * The shared persistence shim between:
 *   - ChatOverlay's "Add to my portfolio" CTA (writer)
 *   - MagicLinkVerifyPage post-auth handler (reader)
 *
 * Stored in `localStorage` (NOT sessionStorage) so the handoff survives
 * the user opening the magic link in a different tab — Gmail / Outlook
 * web previews typically do this.
 *
 * Single source of truth for the storage key + the record shape so both
 * sides can never drift out of sync.
 */

export const PENDING_CHAT_CLAIM_KEY = 'reanalyzr.chat.pendingClaim';

/**
 * 24-hour TTL on the pending claim — if the user opens the magic link
 * a week later, the chat sessionId has long since drifted away from
 * any useful context. We silently drop a stale claim.
 */
export const PENDING_CLAIM_TTL_MS = 24 * 60 * 60 * 1000;

export interface PendingChatClaim {
  /** The anonymous chat sessionId the ghost user is keyed by. */
  sessionId: string;
  /** Where to navigate AFTER claim succeeds. Defaults to /app. */
  returnTo: string;
  /** Optional — the ConversationEvent ID of the deal the user wanted to save. */
  conversationEventId?: string;
  /** epoch ms — used to age the record out (PENDING_CLAIM_TTL_MS). */
  stashedAt: number;
}

/**
 * Type guard for safe parsing of the localStorage payload. localStorage
 * is user-tamperable so we never assume the shape — verify it.
 */
function isPendingChatClaim(value: unknown): value is PendingChatClaim {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.sessionId === 'string' &&
    v.sessionId.length > 0 &&
    typeof v.returnTo === 'string' &&
    typeof v.stashedAt === 'number' &&
    (v.conversationEventId === undefined ||
      typeof v.conversationEventId === 'string')
  );
}

export function readPendingChatClaim(): PendingChatClaim | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(PENDING_CHAT_CLAIM_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPendingChatClaim(parsed)) {
      // Corrupted record — drop it so the next claim attempt starts clean.
      localStorage.removeItem(PENDING_CHAT_CLAIM_KEY);
      return null;
    }
    if (Date.now() - parsed.stashedAt > PENDING_CLAIM_TTL_MS) {
      // Stale — discard rather than route the user to a long-forgotten URL.
      localStorage.removeItem(PENDING_CHAT_CLAIM_KEY);
      return null;
    }
    return parsed;
  } catch {
    // Malformed JSON — clean up.
    localStorage.removeItem(PENDING_CHAT_CLAIM_KEY);
    return null;
  }
}

export function clearPendingChatClaim(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PENDING_CHAT_CLAIM_KEY);
}

export function writePendingChatClaim(
  claim: Omit<PendingChatClaim, 'stashedAt'>
): void {
  if (typeof localStorage === 'undefined') return;
  const payload: PendingChatClaim = { ...claim, stashedAt: Date.now() };
  localStorage.setItem(PENDING_CHAT_CLAIM_KEY, JSON.stringify(payload));
}
