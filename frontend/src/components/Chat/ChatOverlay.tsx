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
import {
  Box,
  TextField,
  IconButton,
  Typography,
  ThemeProvider,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import { chatTheme } from '../../theme/chatTheme';
import { streamChatTurn, type ChatStreamEvent } from '../../services/chatApi';

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
}

// ===== Helpers =====

function newId(): string {
  // Browser-side UUID v4 — same generator as crypto.randomUUID
  return crypto.randomUUID();
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
  // tool_call + structured_output: noop in W6-S3. W6-S4 will mount
  // path-specific renderers on structured_output.
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

  // Session identity — persisted in sessionStorage so refresh keeps the
  // same ghost-user identity + rate-limit quota on the backend.
  const [sessionId] = useState(() => resolveSessionId());
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [turnNumber, setTurnNumber] = useState(1);

  // Track if we've already sent the initialUserInput so React strict-mode
  // double-mount doesn't double-send it.
  const initialSentRef = useRef(false);

  // AbortController for the in-flight stream. The Stop button calls
  // `.abort()` which closes the fetch, the backend detects via
  // `req.on('close')` and halts the LLM call (W6-S3).
  const abortControllerRef = useRef<AbortController | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message OR new delta during streaming.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const cancelInFlight = (): void => {
    abortControllerRef.current?.abort();
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

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let sawDoneOrCancelled = false;

    try {
      const stream = streamChatTurn(
        { userInput: trimmed, sessionId, turnNumber: userTurn },
        { signal: controller.signal }
      );
      for await (const event of stream) {
        applyStreamEvent(event, assistantId, setMessages);
        if (event.type === 'done' || event.type === 'cancelled') {
          sawDoneOrCancelled = true;
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
          {messages.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: 1,
                color: 'text.secondary',
              }}
              data-testid="chat-empty-state"
            >
              <Typography sx={{ fontSize: 17, fontWeight: 500 }}>
                Ready when you are.
              </Typography>
              <Typography sx={{ fontSize: 14 }}>
                Try: <em>analyze 1837 Walnut Way Anna TX 75409</em>
              </Typography>
            </Box>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

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

        {/* Input */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            p: { xs: 1.5, sm: 2 },
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
    </ThemeProvider>
  );
}

// ===== Internal: MessageBubble =====

function MessageBubble({ message }: { message: ThreadMessage }): React.JSX.Element {
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
  return (
    <Box
      sx={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        bgcolor: isUser ? 'primary.main' : 'background.paper',
        color: isUser ? 'primary.contrastText' : 'text.primary',
        border: isUser ? 'none' : 1,
        borderColor: 'divider',
        px: 2,
        py: 1.5,
        borderRadius: 3,
        fontSize: 15,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
      }}
      data-testid={isUser ? 'chat-message-user' : 'chat-message-assistant'}
    >
      {message.text}
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
  );
}
