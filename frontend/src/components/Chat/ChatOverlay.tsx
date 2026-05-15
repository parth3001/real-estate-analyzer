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
import { chatTheme } from '../../theme/chatTheme';
import { sendChatTurn, type ChatTurnResponse } from '../../services/chatApi';

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
  /** Full server response — kept for future use (structured outputs in W6-S4). */
  raw: ChatTurnResponse;
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

  const threadEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setMessages((m) => [...m, userMsg]);
    setDraft('');
    setIsSending(true);

    try {
      const response = await sendChatTurn({
        userInput: trimmed,
        sessionId,
        turnNumber: userTurn,
      });
      const assistantMsg: AssistantMessage = {
        id: newId(),
        role: 'assistant',
        text: response.responseText,
        turnNumber: userTurn,
        raw: response,
      };
      setMessages((m) => [...m, assistantMsg]);
      setTurnNumber((n) => n + 1);
    } catch (err) {
      const errorMsg: ErrorMessage = {
        id: newId(),
        role: 'error',
        text:
          err instanceof Error && err.message
            ? `Couldn't reach the assistant: ${err.message}`
            : "Couldn't reach the assistant. Please try again.",
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
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

          {isSending && (
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
          <IconButton
            type="submit"
            disabled={isSending || draft.trim().length === 0}
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
    </Box>
  );
}
