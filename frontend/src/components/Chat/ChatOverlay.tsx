/**
 * ChatOverlay — the chat surface shell.
 *
 * Hosts a message thread + an input box. On submit, calls
 * POST /api/chat/turn (W6-S1), appends both the user message and the
 * agent response to the thread. Scoped in `<ThemeProvider theme={chatTheme}>`
 * so the chat-specific MUI overrides (tinted button variant, etc.)
 * apply only here.
 *
 * Wave-1 scope (this commit):
 *   - Request/response per turn (NO streaming — that's W6-S3)
 *   - Plain text rendering for assistant responses
 *   - DealScoreCard wires in W6-S4 (structured outputs in the stream)
 *
 * Apple HIG (UX Designer lens):
 *   - Bubble-style message rows, user bubble right-aligned in primary
 *     accent (system blue), assistant bubble left-aligned on neutral.
 *   - Generous line-height + spacing — content-forward.
 *   - Input row pinned to the bottom with a multi-line text field
 *     and a primary-action send button.
 *   - 44pt minimum touch targets on the send + any interactive elements.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Typography,
  ThemeProvider,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatTheme } from '../../theme/chatTheme';
import {
  streamChatTurn,
  loadChatHistory,
  type ChatStreamEvent,
} from '../../services/chatApi';
import { writePendingChatClaim } from '../../services/pendingChatClaim';
import {
  upsertThread,
  deriveTitle,
  getThreads,
  subscribe as subscribeThreads,
  type ThreadRecord,
} from '../../services/threadStore';
import {
  generateEmptyStateChips,
} from '../../services/emptyStateChips';
import { DealScoreCard, type DealScoreCardProps } from './DealScoreCard';
import { EmailCtaModal } from './EmailCtaModal';

// ===== Message thread types =====

interface UserMessage {
  id: string;
  role: 'user';
  text: string;
  turnNumber: number;
}

interface AssistantMessage {
  id: string;
  role: 'assistant';
  text: string;
  turnNumber: number;
  /**
   * True while tokens are still streaming in for this message. Drives
   * the typing-indicator UX and disables the Send button. Flips false
   * on the terminal `done` / `cancelled` / `error` stream event.
   */
  streaming: boolean;
  /**
   * Set when the stream ended via the `cancelled` terminal event
   * (user hit Stop, or the connection dropped). Surface a "cancelled"
   * hint in the bubble so the user knows what they're looking at.
   */
  cancelled?: boolean;
  /**
   * Routing snapshot captured at the start of the stream. Used by
   * W6-S4 to choose which structured-output renderer to mount when the
   * `structured_output` event arrives (e.g., DealScoreCard on
   * `agent:deal_scoring`).
   */
  routing?: {
    target: string;
    routedTo: string;
    classifierIntent: string;
  };
  /** Stream-level identifiers for downstream save / share actions. */
  traceId?: string;
  conversationEventId?: string;
  /**
   * Structured-output payloads emitted by the orchestrator (W6-S4).
   * Currently only `deal_score_card` is implemented; the array supports
   * future kinds (audit_trail, comparison_card, etc.) emitted on the
   * same turn.
   */
  structuredOutputs?: Array<
    | {
        kind: 'deal_score_card';
        data: Omit<DealScoreCardProps, 'onChangeAssumptions'>;
      }
    | { kind: string; data: Record<string, unknown> }
  >;
  /**
   * Tap-to-prefill follow-up chips for this turn (Phase 3+4, Day 3-4).
   * Sourced from the `suggested_followups` structured_output event the
   * orchestrator emits right before `done`. Stored as a sibling to
   * structuredOutputs because chips are NOT cards — they're affordances,
   * rendered as pill buttons below the bubble.
   */
  suggestedFollowups?: string[];
}

interface ErrorMessage {
  id: string;
  role: 'error';
  text: string;
}

type ThreadMessage = UserMessage | AssistantMessage | ErrorMessage;

// ===== Props =====

export interface ChatOverlayProps {
  /**
   * Optional initial user message — if provided, the overlay submits
   * it as turn 1 automatically on mount. Used by the hero-embed entry
   * shape (LandingPage forwards the hero input into /app, which mounts
   * the overlay with the user's first message pre-loaded).
   */
  initialUserInput?: string;
  /** Optional override for the empty-state placeholder. */
  placeholder?: string;
  /**
   * Phase 3+4, Day 5 — optional user context for the empty-state chip
   * generator. Driven from AppPage (which has useAuth in scope).
   * Test-friendly: when omitted, the empty state falls back to the
   * generic-anon chip set + headline.
   */
  currentUserFirstName?: string;
  currentUserIsAuthed?: boolean;
  /**
   * Day 9b (2026-05-18) — optional Deal id the chat is operating against.
   * When set, every turn request includes it so the backend can resolve
   * the user's active license and apply the per-license cost cap
   * (Issue #106 Phase B). Threaded down from AppPage location state,
   * which is in turn populated by deal-scoped entry points (SavedDealHero
   * chips, /analysis/:id "Continue in chat" actions).
   *
   * Omit when the chat isn't tied to a specific property — session +
   * daily caps still apply.
   */
  dealId?: string;
}

// ===== Helpers =====

function newId(): string {
  // Browser-side UUID v4.
  //
  // `crypto.randomUUID()` is the obvious choice BUT it's a
  // SECURE-CONTEXT-ONLY API. Browsers expose it only on:
  //   - https://*
  //   - http://localhost / http://127.0.0.1 (privileged origins)
  //
  // On plain-HTTP LAN dev (http://192.168.x.x:3000, common when
  // testing from a phone on the same Wi-Fi), `crypto.randomUUID` is
  // undefined and a call throws — silently breaking ChatOverlay mount.
  //
  // Defense: use crypto.randomUUID when available, otherwise build a
  // v4 from crypto.getRandomValues (which IS exposed everywhere modern
  // and works in insecure contexts). Math.random would be a third
  // fallback but every browser shipped getRandomValues by 2015 — no
  // realistic env reaches that path.
  const c =
    typeof crypto !== 'undefined'
      ? (crypto as Crypto & { randomUUID?: () => string })
      : undefined;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    // RFC 4122 v4 bit-twiddling: byte 6 high nibble = 4 (version),
    // byte 8 high two bits = 10 (variant).
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) =>
      b.toString(16).padStart(2, '0')
    ).join('');
    return (
      hex.slice(0, 8) +
      '-' +
      hex.slice(8, 12) +
      '-' +
      hex.slice(12, 16) +
      '-' +
      hex.slice(16, 20) +
      '-' +
      hex.slice(20, 32)
    );
  }
  // Hard-fallback — Math.random is NOT cryptographically secure but
  // for a chat sessionId on a dev box without crypto.* it's good enough
  // to keep the surface functional.
  const rnd = (): string =>
    Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, '0');
  return `${rnd()}${rnd()}-${rnd()}-4${rnd().slice(1)}-${(
    (Math.floor(Math.random() * 4) + 8).toString(16) + rnd().slice(1)
  )}-${rnd()}${rnd()}${rnd()}`;
}

/**
 * Session identity. Persisted in `sessionStorage` (W6-S2.5) so a page
 * refresh on /app keeps the same session — important because:
 *
 *   1. The backend's ghost-user record is keyed by sessionId. Losing the
 *      sessionId on refresh would orphan the ghost (and the deals
 *      already persisted under it).
 *   2. The session-scoped rate limit (10 turns / 24h) is keyed on
 *      sessionId too. Regenerating per mount would let anon users dodge
 *      the cap with a refresh.
 *
 * `sessionStorage` (not `localStorage`) so closing the tab does end the
 * session — a fresh tab gets a fresh session, which matches user
 * intuition about chat threads.
 */
const SESSION_STORAGE_KEY = 'reanalyzr.chat.sessionId';

function resolveSessionId(): string {
  // SSR safety — in browser, sessionStorage exists.
  if (typeof sessionStorage === 'undefined') return newId();
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const fresh = newId();
  sessionStorage.setItem(SESSION_STORAGE_KEY, fresh);
  return fresh;
}

/**
 * Apply a single stream event to the running thread state. Factored out
 * so the `send()` flow stays readable and tests can target the reducer
 * directly. Returns nothing — mutates via the setter.
 */
function applyStreamEvent(
  event: ChatStreamEvent,
  assistantId: string,
  setMessages: React.Dispatch<React.SetStateAction<ThreadMessage[]>>
): void {
  if (event.type === 'routing') {
    setMessages((m) =>
      m.map((msg) =>
        msg.id === assistantId && msg.role === 'assistant'
          ? {
              ...msg,
              routing: {
                target: event.target,
                routedTo: event.routedTo,
                classifierIntent: event.classifierIntent,
              },
            }
          : msg
      )
    );
    return;
  }
  if (event.type === 'text_delta') {
    setMessages((m) =>
      m.map((msg) =>
        msg.id === assistantId && msg.role === 'assistant'
          ? { ...msg, text: msg.text + event.text }
          : msg
      )
    );
    return;
  }
  if (event.type === 'done') {
    setMessages((m) =>
      m.map((msg) =>
        msg.id === assistantId && msg.role === 'assistant'
          ? {
              ...msg,
              streaming: false,
              traceId: event.traceId,
              conversationEventId: event.conversationEventId,
            }
          : msg
      )
    );
    return;
  }
  if (event.type === 'cancelled') {
    setMessages((m) =>
      m.map((msg) =>
        msg.id === assistantId && msg.role === 'assistant'
          ? {
              ...msg,
              text: msg.text || event.partialText,
              streaming: false,
              cancelled: true,
              traceId: event.traceId,
              conversationEventId: event.conversationEventId,
            }
          : msg
      )
    );
    return;
  }
  if (event.type === 'structured_output') {
    // W6-S4 — attach the structured payload to the live assistant
    // message. The renderer (DealScoreCard for kind='deal_score_card')
    // mounts inline below the streamed text.
    //
    // Phase 3+4 Day 4 split: `suggested_followups` is rendered as
    // tap-to-prefill chips below the bubble (pill buttons, not a card),
    // so it lives on a dedicated field rather than the cards array.
    if (event.kind === 'suggested_followups') {
      const rawChips = (event.data as { chips?: unknown }).chips;
      const chips = Array.isArray(rawChips)
        ? rawChips.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
        : [];
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId && msg.role === 'assistant'
            ? { ...msg, suggestedFollowups: chips }
            : msg
        )
      );
      return;
    }
    setMessages((m) =>
      m.map((msg) => {
        if (msg.id !== assistantId || msg.role !== 'assistant') return msg;
        const existing = msg.structuredOutputs ?? [];
        return {
          ...msg,
          structuredOutputs: [
            ...existing,
            { kind: event.kind, data: event.data },
          ],
        };
      })
    );
    return;
  }
  // tool_call: noop for now (W6-S4 reserves the channel; UX hint pill
  // can mount on it later without protocol changes).
}

/**
 * True when the last message in the thread is a streaming assistant
 * bubble with no text yet — used to gate the "Thinking…" indicator so
 * it shows ONLY before the first token arrives.
 */
function lastMessageIsEmptyStreamingBubble(messages: ThreadMessage[]): boolean {
  const last = messages[messages.length - 1];
  return Boolean(
    last &&
      last.role === 'assistant' &&
      last.streaming === true &&
      last.text.length === 0
  );
}

// ===== Component =====

export function ChatOverlay(props: ChatOverlayProps): React.JSX.Element {
  const placeholder =
    props.placeholder ?? 'Ask about a property, a metric, or paste a listing...';

  const navigate = useNavigate();

  // Session identity — persisted in sessionStorage so refresh keeps the
  // same ghost-user identity + rate-limit quota on the backend.
  const [sessionId] = useState(() => resolveSessionId());
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [turnNumber, setTurnNumber] = useState(1);

  // Phase 3+4, Day 5 — read threadStore for the empty-state chip
  // personalization. Subscribe so chips re-derive if a new thread
  // lands while the user is sitting on the empty state (rare but
  // cheap to wire).
  const [threadIndex, setThreadIndex] = useState<ThreadRecord[]>(() =>
    getThreads()
  );
  useEffect(() => {
    const unsub = subscribeThreads(() => setThreadIndex(getThreads()));
    return unsub;
  }, []);

  // W6-S4 — email-CTA modal state. The clicked assistant message
  // travels with the modal so we know which DealScoreCard to email.
  const [emailModalMessage, setEmailModalMessage] = useState<
    AssistantMessage | null
  >(null);

  // Track if we've already sent the initialUserInput so React strict-mode
  // double-mount doesn't double-send it.
  const initialSentRef = useRef(false);

  // AbortController for the in-flight stream. The Stop button calls
  // `.abort()` which closes the fetch, the backend detects via
  // `req.on('close')` and halts the LLM call (W6-S3).
  const abortControllerRef = useRef<AbortController | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);
  // Ref to the chat input — used by the chip tap-to-prefill handler so
  // we can focus + place the caret at the end of the prefilled text
  // (Phase 3+4, Day 4).
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * Chip tap handler — fills the input with the chip text and focuses
   * it. Per the design rendering, chips DO NOT auto-send; the user
   * reads, optionally edits, then sends. This gives the user agency
   * over what gets sent (and avoids accidental fires from a misclick
   * on a phone).
   */
  const handleChipTap = (text: string): void => {
    setDraft(text);
    // Defer focus to next frame so React has flushed the state update
    // and the input is enabled (Send → Stop swap clears between turns).
    setTimeout(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      // Place caret at end of prefilled text so the user can append.
      const end = text.length;
      el.setSelectionRange(end, end);
    }, 0);
  };

  // Auto-scroll to bottom on new message OR new delta during streaming.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const cancelInFlight = (): void => {
    abortControllerRef.current?.abort();
  };

  /**
   * Email-CTA handler — opens the modal scoped to the clicked card's
   * message. The modal POSTs to the backend with the conversationEventId
   * + sessionId so the server can resolve the underlying analysis.
   */
  const handleEmailCta = (msg: AssistantMessage): void => {
    setEmailModalMessage(msg);
  };

  /**
   * Portfolio-CTA handler — W6-S5.
   *
   * Stashes a "pendingClaim" record in localStorage so the magic-link
   * verify page (which may open in a different tab) can:
   *   1. Verify the token
   *   2. Read pendingClaim → call POST /api/chat/claim-session with the
   *      sessionId → server merges every event under the ghost user
   *      into the now-authenticated real user
   *   3. Navigate to `returnTo` (back to /app, deal claimed)
   *
   * Then navigates to /login. The login flow is unchanged otherwise —
   * existing users get magic-linked the same way. The claim handler is
   * additive at the magic-link consume step.
   */
  const handlePortfolioCta = (msg: AssistantMessage): void => {
    writePendingChatClaim({
      sessionId,
      returnTo: '/app',
      conversationEventId: msg.conversationEventId,
    });
    const params = new URLSearchParams({
      returnTo: '/app',
      ...(msg.conversationEventId
        ? { pendingConversationId: msg.conversationEventId }
        : {}),
    });
    navigate(`/login?${params.toString()}`);
  };

  async function send(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userTurn = turnNumber;
    const userMsg: UserMessage = {
      id: newId(),
      role: 'user',
      text: trimmed,
      turnNumber: userTurn,
    };
    // Seed the assistant message empty + streaming so the UI shows a
    // bubble immediately. Tokens append into this same message object
    // as the stream events arrive — no flicker, no late-mount.
    const assistantId = newId();
    const initialAssistant: AssistantMessage = {
      id: assistantId,
      role: 'assistant',
      text: '',
      turnNumber: userTurn,
      streaming: true,
    };
    setMessages((m) => [...m, userMsg, initialAssistant]);
    setDraft('');
    setIsSending(true);

    // Sidebar thread-index hook (Phase 3+4). On the first turn we seed
    // the row title from the user's prompt; later turns just bump
    // lastActivityAt. The preview/score are filled in by the stream
    // event handlers below.
    if (userTurn === 1) {
      upsertThread({ id: sessionId, title: deriveTitle(trimmed) });
    } else {
      upsertThread({ id: sessionId });
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let sawDoneOrCancelled = false;

    try {
      const stream = streamChatTurn(
        {
          userInput: trimmed,
          sessionId,
          turnNumber: userTurn,
          // Day 9b: include dealId when the chat is operating against a
          // specific deal so the backend can apply the per-license cap.
          // Omitted when undefined — backend treats absence gracefully.
          ...(props.dealId ? { dealId: props.dealId } : {}),
        },
        { signal: controller.signal }
      );
      let accumulatedText = '';
      for await (const event of stream) {
        applyStreamEvent(event, assistantId, setMessages);
        // Sidebar thread-index — surface deal-quality score the moment
        // the DealScoreCard structured output arrives, so the sidebar
        // dot recolors live (not waiting for `done`).
        if (event.type === 'structured_output' && event.kind === 'deal_score_card') {
          const data = event.data as { dealQualityScore?: number };
          if (typeof data.dealQualityScore === 'number') {
            upsertThread({ id: sessionId, dealQualityScore: data.dealQualityScore });
          }
        }
        if (event.type === 'text_delta') {
          accumulatedText += event.text;
        }
        if (event.type === 'done' || event.type === 'cancelled') {
          sawDoneOrCancelled = true;
          // Bump lastActivityAt + preview snippet for sidebar recency
          // sort. Preview is best-effort — first 80 chars of the final
          // assistant text.
          upsertThread({
            id: sessionId,
            preview: accumulatedText.trim().slice(0, 80) || undefined,
          });
        }
        if (event.type === 'error') {
          // Convert the assistant bubble into an error bubble — keeps
          // the message-order in the thread and surfaces the failure
          // clearly.
          setMessages((m) => {
            const errorMsg: ErrorMessage = {
              id: newId(),
              role: 'error',
              text: event.message,
            };
            return m
              .filter((msg) => msg.id !== assistantId)
              .concat(errorMsg);
          });
          sawDoneOrCancelled = true;
        }
      }
      if (!sawDoneOrCancelled) {
        // Stream ended without a terminal event — flip the bubble out
        // of streaming state so the user doesn't see a permanent
        // typing indicator.
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId && msg.role === 'assistant'
              ? { ...msg, streaming: false }
              : msg
          )
        );
      }
      setTurnNumber((n) => n + 1);
    } catch (err) {
      // AbortError fires when the user hits Stop. Mark the bubble
      // cancelled but keep its partial text.
      const isAbort =
        err instanceof DOMException && err.name === 'AbortError';
      if (isAbort) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId && msg.role === 'assistant'
              ? { ...msg, streaming: false, cancelled: true }
              : msg
          )
        );
      } else {
        const errorText =
          err instanceof Error && err.message
            ? `Couldn't reach the assistant: ${err.message}`
            : "Couldn't reach the assistant. Please try again.";
        setMessages((m) => {
          const errorMsg: ErrorMessage = {
            id: newId(),
            role: 'error',
            text: errorText,
          };
          // Replace the empty streaming bubble with the error bubble.
          return m
            .filter((msg) => msg.id !== assistantId)
            .concat(errorMsg);
        });
      }
    } finally {
      abortControllerRef.current = null;
      setIsSending(false);
    }
  }

  // Auto-submit initialUserInput on first mount (hero-embed entry path)
  useEffect(() => {
    if (props.initialUserInput && !initialSentRef.current) {
      initialSentRef.current = true;
      void send(props.initialUserInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Day 11f (Issue C) — restore prior conversation on mount.
  //
  // When the user selects a thread in the sidebar OR returns to /app
  // after auth, ChatOverlay remounts with a sessionId that already has
  // turns in substrate. Pre-Day-11f we ignored that history and showed
  // the empty welcome state — broke the chat-first IA promise.
  //
  // Logic:
  //   - Skip if `initialUserInput` is set — that path auto-sends turn 1,
  //     no prior history to restore (this is the LandingPage hero entry).
  //   - Skip if we've already loaded for this sessionId in this
  //     component lifecycle (initialSentRef doubles as the guard).
  //   - Otherwise fetch via loadChatHistory, project to ThreadMessage
  //     shape, replace the empty messages array.
  //
  // Fetch is silent-fail by design — failure means empty state, not
  // an error bubble. The user can still send a new message.
  const historyLoadedRef = useRef(false);
  useEffect(() => {
    if (props.initialUserInput) return; // hero-embed entry; skip history
    if (historyLoadedRef.current) return;
    if (!sessionId) return;
    historyLoadedRef.current = true;
    let cancelled = false;
    void (async () => {
      const history = await loadChatHistory(sessionId);
      if (cancelled || history.length === 0) return;
      // Project to ThreadMessage shape. Each history entry becomes
      // one ThreadMessage. Assistant entries are NOT marked
      // `streaming: true` — they're already-complete prior turns.
      const restored: ThreadMessage[] = history.map((h, idx) => {
        if (h.role === 'user') {
          return {
            id: `restored-user-${h.turnNumber}-${idx}`,
            role: 'user',
            text: h.text,
            turnNumber: h.turnNumber,
          };
        }
        return {
          id: `restored-assistant-${h.turnNumber}-${idx}`,
          role: 'assistant',
          text: h.text,
          turnNumber: h.turnNumber,
          streaming: false,
          traceId: h.traceId,
          conversationEventId: h.conversationEventId,
        };
      });
      setMessages(restored);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    void send(draft);
  };

  return (
    <ThemeProvider theme={chatTheme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          maxWidth: 760,
          mx: 'auto',
          width: '100%',
          bgcolor: 'background.default',
        }}
        data-testid="chat-overlay"
      >
        {/* Message thread */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: { xs: 2, sm: 3 },
          }}
          data-testid="chat-thread"
        >
          {messages.length === 0 && (() => {
            // Day 5 — empty-state surface. The chip generator returns
            // a different (headline, subhead, chips) tuple for brand-
            // new vs returning users. Tap-to-prefill semantics match
            // the in-thread chip row.
            const emptyState = generateEmptyStateChips({
              isAuthed: props.currentUserIsAuthed === true,
              threads: threadIndex,
              firstName: props.currentUserFirstName,
            });
            return (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  gap: 2,
                  px: { xs: 2, sm: 4 },
                  textAlign: 'center',
                }}
                data-testid="chat-empty-state"
              >
                <Box sx={{ maxWidth: 520 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: 22, sm: 26 },
                      fontWeight: 600,
                      color: 'text.primary',
                      letterSpacing: '-0.01em',
                      mb: 1,
                    }}
                    data-testid="chat-empty-state-headline"
                  >
                    {emptyState.headline}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 15,
                      color: 'text.secondary',
                      lineHeight: 1.5,
                    }}
                    data-testid="chat-empty-state-subhead"
                  >
                    {emptyState.subhead}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 640,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <FollowupChips
                    chips={emptyState.chips}
                    onTap={handleChipTap}
                  />
                </Box>
              </Box>
            );
          })()}

          {messages.map((msg, idx) => {
            // The "is last assistant" flag drives whether follow-up chips
            // render below the bubble. We only want chips under the
            // most-recent assistant message — historical chips would
            // crowd the thread and become stale on each new turn.
            const isLastAssistant =
              msg.role === 'assistant' && idx === messages.length - 1;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLastAssistant={isLastAssistant}
                onEmailCta={handleEmailCta}
                onPortfolioCta={handlePortfolioCta}
                onChipTap={handleChipTap}
              />
            );
          })}

          {/* Thinking indicator — only shown BEFORE the first token of
              the streaming assistant message arrives. Once tokens start
              flowing, the live assistant bubble is its own progress
              indicator (Apple Messages pattern: the bubble appears
              empty, then fills). */}
          {isSending && lastMessageIsEmptyStreamingBubble(messages) && (
            <Box
              sx={{ display: 'flex', gap: 1, alignItems: 'center', pl: 1 }}
              data-testid="chat-loading"
            >
              <CircularProgress size={14} thickness={5} />
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                Thinking…
              </Typography>
            </Box>
          )}

          <div ref={threadEndRef} />
        </Box>

        {/* Input — Day 6 mobile pass: respect iOS home-indicator
            safe-area so the input doesn't sit under the bottom bezel
            when the keyboard is dismissed. `env(safe-area-inset-bottom)`
            is 0 on devices without a home indicator, so this is a
            no-op on desktop / older phones. */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            p: { xs: 1.5, sm: 2 },
            pb: { xs: 'calc(12px + env(safe-area-inset-bottom))', sm: 2 },
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
          }}
        >
          <TextField
            multiline
            minRows={1}
            maxRows={6}
            fullWidth
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            disabled={isSending}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter inserts newline (chat-native)
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            inputProps={{
              'aria-label': 'Chat input',
              'data-testid': 'chat-input',
            }}
            inputRef={inputRef}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
          {/* Send → Stop swap pattern (Apple Messages). During streaming
              the button morphs into a Stop control that aborts the
              in-flight LLM call. The button keeps its position so
              focus + muscle memory stay consistent. */}
          {isSending ? (
            <IconButton
              type="button"
              onClick={cancelInFlight}
              aria-label="Stop generating"
              data-testid="chat-stop"
              sx={{
                width: 44,
                height: 44,
                bgcolor: 'text.primary',
                color: 'background.paper',
                '&:hover': { bgcolor: 'text.secondary' },
              }}
            >
              <StopIcon fontSize="small" />
            </IconButton>
          ) : (
            <IconButton
              type="submit"
              disabled={draft.trim().length === 0}
              aria-label="Send"
              data-testid="chat-send"
              sx={{
                width: 44,
                height: 44,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                },
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* W6-S4 — Email CTA modal. Renders inside the chat theme so its
          inputs / buttons inherit the same styling as the rest of /app. */}
      <EmailCtaModal
        open={emailModalMessage !== null}
        onClose={() => setEmailModalMessage(null)}
        sessionId={sessionId}
        conversationEventId={emailModalMessage?.conversationEventId}
        dealScoreCard={
          (emailModalMessage?.structuredOutputs?.find(
            (so) => so.kind === 'deal_score_card'
          )?.data as Omit<DealScoreCardProps, 'onChangeAssumptions'>) ?? null
        }
      />
    </ThemeProvider>
  );
}

// ===== Internal: MessageBubble =====

interface MessageBubbleProps {
  message: ThreadMessage;
  /**
   * Phase 3+4, Day 4 — true only for the most-recent assistant message
   * in the thread. Drives whether `suggestedFollowups` chips render
   * below the bubble. Historical chips would clutter older turns and
   * become stale, so we only ever show one chip row at a time.
   */
  isLastAssistant?: boolean;
  /** W6-S4 — fires when the user clicks the email CTA on a structured card. */
  onEmailCta?: (assistantMsg: AssistantMessage) => void;
  /** W6-S4 — fires when the user clicks the portfolio CTA on a structured card. */
  onPortfolioCta?: (assistantMsg: AssistantMessage) => void;
  /** Phase 3+4, Day 4 — chip tap-to-prefill (does NOT auto-send). */
  onChipTap?: (text: string) => void;
}

function MessageBubble({
  message,
  isLastAssistant,
  onEmailCta,
  onPortfolioCta,
  onChipTap,
}: MessageBubbleProps): React.JSX.Element {
  if (message.role === 'error') {
    return (
      <Box
        sx={{
          alignSelf: 'flex-start',
          maxWidth: '85%',
          bgcolor: 'error.light',
          color: 'error.dark',
          px: 2,
          py: 1.5,
          borderRadius: 3,
          fontSize: 14,
        }}
        role="alert"
        data-testid="chat-message-error"
      >
        {message.text}
      </Box>
    );
  }

  const isUser = message.role === 'user';
  const isCancelled =
    message.role === 'assistant' && message.cancelled === true;
  const structuredOutputs =
    message.role === 'assistant' ? message.structuredOutputs ?? [] : [];

  return (
    <Box
      sx={{
        alignSelf: isUser ? 'flex-end' : 'stretch',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        maxWidth: isUser ? '85%' : '100%',
      }}
    >
      {/* Text bubble — always rendered (may be empty during pre-token state).
          User messages render plain (preserves any literal `**` they typed);
          assistant messages render through MarkdownBubbleText so the
          agent's **bold** / *italic* / `---` formatting is honored. */}
      {(message.text.length > 0 || isCancelled) && (
        <Box
          sx={{
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            maxWidth: isUser ? '100%' : '85%',
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            border: isUser ? 'none' : 1,
            borderColor: 'divider',
            px: 2,
            py: 1.5,
            borderRadius: 3,
            fontSize: 15,
            lineHeight: 1.5,
            // Preserve newlines for user messages; assistant uses
            // markdown which has its own block structure.
            whiteSpace: isUser ? 'pre-wrap' : 'normal',
          }}
          data-testid={isUser ? 'chat-message-user' : 'chat-message-assistant'}
        >
          {isUser ? message.text : <MarkdownBubbleText text={message.text} />}
          {isCancelled && (
            <Box
              component="span"
              sx={{
                display: 'block',
                mt: 1,
                fontSize: 12,
                color: 'text.secondary',
                fontStyle: 'italic',
              }}
              data-testid="chat-message-cancelled"
            >
              Stopped.
            </Box>
          )}
        </Box>
      )}

      {/* Structured outputs render BELOW the text bubble, full-width-ish */}
      {message.role === 'assistant' &&
        structuredOutputs.map((so, idx) => {
          if (so.kind === 'deal_score_card') {
            const card = so.data as Omit<
              DealScoreCardProps,
              'onChangeAssumptions'
            >;
            return (
              <Box
                key={`${message.id}-card-${idx}`}
                sx={{ alignSelf: 'flex-start' }}
                data-testid="chat-message-structured-output"
              >
                <DealScoreCard {...card} />
                <ChatCardCtas
                  message={message}
                  onEmailCta={onEmailCta}
                  onPortfolioCta={onPortfolioCta}
                />
              </Box>
            );
          }
          return null;
        })}

      {/* Follow-up chips — render only under the LATEST assistant
          message, only once streaming is done, and only when the agent
          actually emitted any. Tap fills the input (does NOT submit). */}
      {message.role === 'assistant' &&
        isLastAssistant === true &&
        message.streaming === false &&
        (message.suggestedFollowups?.length ?? 0) > 0 && (
          <FollowupChips
            chips={message.suggestedFollowups!}
            onTap={onChipTap}
          />
        )}
    </Box>
  );
}

/**
 * MarkdownBubbleText — render assistant text with safe markdown.
 *
 * The deal-scoring + qa agents emit `**bold**`, `*italic*`, bulleted
 * lists, the occasional triple-dash divider, AND GitHub-flavored
 * markdown tables (e.g., the 10-year projection table from the
 * deal-scoring response). Rendering as raw text leaks the syntax
 * into the UI.
 *
 * Plugins: `remark-gfm` adds tables / strikethrough / autolinks /
 * task-lists. Added 2026-05-17 (Issue #115) after the 10-year
 * projection rendered as a pipe-delimited mess instead of a table.
 *
 * Restrictions: no images, no raw HTML. Each block element is style-
 * overridden so the rendered output fits flush in the bubble.
 */
function MarkdownBubbleText({ text }: { text: string }): React.JSX.Element {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <Box component="p" sx={{ m: 0, mb: 1, '&:last-child': { mb: 0 } }}>
            {children}
          </Box>
        ),
        strong: ({ children }) => (
          <Box component="strong" sx={{ fontWeight: 600 }}>
            {children}
          </Box>
        ),
        em: ({ children }) => (
          <Box component="em" sx={{ fontStyle: 'italic' }}>
            {children}
          </Box>
        ),
        ul: ({ children }) => (
          <Box component="ul" sx={{ m: 0, mb: 1, pl: 2.5 }}>
            {children}
          </Box>
        ),
        ol: ({ children }) => (
          <Box component="ol" sx={{ m: 0, mb: 1, pl: 2.5 }}>
            {children}
          </Box>
        ),
        li: ({ children }) => (
          <Box component="li" sx={{ mb: 0.25 }}>
            {children}
          </Box>
        ),
        // Triple-dash → hairline divider matching the bubble divider
        // style; the agent uses this to separate the score commentary
        // from the assumptions footnote.
        hr: () => (
          <Box
            component="hr"
            sx={{
              border: 0,
              borderTop: '1px solid',
              borderColor: 'divider',
              my: 1.25,
            }}
          />
        ),
        // Inline code — rare from the agent, but keep it readable
        // when it appears (e.g., metric names in monospace).
        code: ({ children }) => (
          <Box
            component="code"
            sx={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.9em',
              bgcolor: 'action.hover',
              px: 0.5,
              py: 0.125,
              borderRadius: 1,
            }}
          >
            {children}
          </Box>
        ),
        // ===== GFM table support (Issue #115) =====
        //
        // Tabular nums on cells so $-amounts line up vertically. Subtle
        // borders + header row tint match the rest of the chat bubble
        // surface (light, content-forward). overflow-x for mobile so
        // a wide projection table scrolls instead of overflowing the
        // bubble.
        table: ({ children }) => (
          <Box
            sx={{
              my: 1,
              overflowX: 'auto',
              maxWidth: '100%',
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'action.hover',
                borderRadius: 3,
              },
            }}
          >
            <Box
              component="table"
              sx={{
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
                width: '100%',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {children}
            </Box>
          </Box>
        ),
        thead: ({ children }) => (
          <Box component="thead" sx={{ bgcolor: 'action.hover' }}>
            {children}
          </Box>
        ),
        tbody: ({ children }) => (
          <Box component="tbody">{children}</Box>
        ),
        tr: ({ children }) => (
          <Box
            component="tr"
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            {children}
          </Box>
        ),
        th: ({ children }) => (
          <Box
            component="th"
            sx={{
              px: 1.25,
              py: 0.75,
              fontWeight: 600,
              textAlign: 'left',
              fontSize: '0.8125rem',
              color: 'text.secondary',
              letterSpacing: '0.02em',
            }}
          >
            {children}
          </Box>
        ),
        td: ({ children }) => (
          <Box
            component="td"
            sx={{
              px: 1.25,
              py: 0.75,
              verticalAlign: 'top',
            }}
          >
            {children}
          </Box>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

/**
 * FollowupChips — pill-button row rendered below the latest assistant
 * message and in the empty state.
 *
 * Layout (Day 6 mobile pass):
 *   - Mobile (xs):  horizontal scroll, single line, momentum scroll,
 *                   chips don't wrap. Native iOS/Android pattern —
 *                   feels like a "drawer of chips" the user swipes.
 *                   Hides the scrollbar (Apple) but keeps the gesture.
 *   - Desktop (sm+): wrap to multi-line so chips don't run off-screen
 *                   on a narrow window pinned next to other apps.
 *
 * Animation: fades in on mount via CSS keyframes — chips appearing
 * abruptly after a stream ends would feel jarring (Apple HIG: motion
 * should be purposeful, brief).
 *
 * Tap fires onTap(text) — host prefills the input + focuses. We do NOT
 * auto-send: chip text often needs context the user wants to add
 * ("Stress-test at 7%" → user might append "and 30% down").
 */
function FollowupChips({
  chips,
  onTap,
}: {
  chips: string[];
  onTap?: (text: string) => void;
}): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        // xs (<600): nowrap + horizontal scroll. sm+ (>=600): wrap.
        flexWrap: { xs: 'nowrap', sm: 'wrap' },
        overflowX: { xs: 'auto', sm: 'visible' },
        // Allow chips to overflow the parent's horizontal bounds on
        // mobile so the scroll actually has somewhere to go (the
        // parent .chat-thread has px padding; we negate it on mobile).
        mx: { xs: -2, sm: 0 },
        px: { xs: 2, sm: 0 },
        gap: 1,
        mt: 0.5,
        alignSelf: { xs: 'stretch', sm: 'flex-start' },
        maxWidth: '100%',
        // Hide the scrollbar but keep the gesture (Apple pattern).
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        // Smooth iOS momentum scroll on overflow.
        WebkitOverflowScrolling: 'touch',
        // Fade in on mount.
        '@keyframes chipsFadeIn': {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        animation: 'chipsFadeIn 180ms ease-out',
      }}
      data-testid="chat-followup-chips"
    >
      {chips.map((chip, idx) => (
        <Box
          key={`chip-${idx}`}
          role="button"
          tabIndex={0}
          onClick={() => onTap?.(chip)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTap?.(chip);
            }
          }}
          sx={{
            px: 1.75,
            py: 1,
            borderRadius: '999px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            color: 'text.primary',
            fontSize: 13,
            lineHeight: 1.3,
            cursor: 'pointer',
            userSelect: 'none',
            minHeight: 36,
            display: 'flex',
            alignItems: 'center',
            // Prevent chips from shrinking below their content width
            // on mobile horizontal scroll — otherwise long chip text
            // collapses awkwardly.
            flexShrink: 0,
            whiteSpace: 'nowrap',
            transition: 'background-color 120ms ease, border-color 120ms ease',
            '&:hover': {
              bgcolor: 'action.hover',
              borderColor: 'text.secondary',
            },
            '&:active': {
              bgcolor: 'action.selected',
            },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
          data-testid={`chat-followup-chip-${idx}`}
        >
          {chip}
        </Box>
      ))}
    </Box>
  );
}

/**
 * CTA row rendered below a DealScoreCard. Two buttons:
 *   📧 Email me this — opens a modal to capture email + send PDF summary
 *   🔖 Save this deal — adds the analyzed property to the user's Saved
 *      Properties (visible in the new sidebar's "Saved properties" route).
 *      For anonymous users, routes through magic-link signup first, then
 *      claims the deal on verify (W6-S5 + Phase 2 substrate→Deal
 *      materialization). The actual destination is Saved Properties —
 *      the CTA copy used to say "Add to my portfolio" but that was
 *      misleading (Portfolio is for properties the user OWNS; Saved
 *      Properties is the analysis archive). Renamed 2026-05-17.
 *
 * Apple HIG: secondary actions on the card, tinted style, comfortable
 * 44pt touch targets.
 */
function ChatCardCtas({
  message,
  onEmailCta,
  onPortfolioCta,
}: {
  message: AssistantMessage;
  onEmailCta?: (m: AssistantMessage) => void;
  onPortfolioCta?: (m: AssistantMessage) => void;
}): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        mt: 1.5,
        flexWrap: 'wrap',
      }}
      data-testid="chat-card-ctas"
    >
      <Button
        variant="outlined"
        startIcon={<EmailOutlinedIcon />}
        onClick={() => onEmailCta?.(message)}
        sx={{ minHeight: 44, textTransform: 'none', borderRadius: 2 }}
        data-testid="chat-cta-email"
      >
        Email me this
      </Button>
      <Button
        variant="contained"
        startIcon={<BookmarkBorderIcon />}
        onClick={() => onPortfolioCta?.(message)}
        sx={{ minHeight: 44, textTransform: 'none', borderRadius: 2 }}
        data-testid="chat-cta-portfolio"
      >
        Save this deal
      </Button>
    </Box>
  );
}
