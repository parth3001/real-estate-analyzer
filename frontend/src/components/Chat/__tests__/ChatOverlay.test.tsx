/**
 * ChatOverlay tests — the chat surface shell.
 *
 * We mock `sendChatTurn` directly (rather than going through MSW) because
 * the overlay only consumes that function — keeping the tests focused on
 * thread behavior, not HTTP wiring (which is covered separately in
 * chatApi-driven contract tests in W6-S5).
 *
 * Coverage:
 *   - Empty state suggestion renders when thread is empty
 *   - Submit appends user bubble + assistant bubble in order
 *   - Loading state shows during in-flight, hides on resolve
 *   - Failed request renders an error bubble (role="alert") and does
 *     NOT crash the thread
 *   - initialUserInput auto-submits exactly once (strict-mode safe)
 *   - Enter sends; Shift+Enter does NOT (kept in draft)
 *   - Send button disabled when draft is empty or while sending
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatOverlay } from '../ChatOverlay';
import type { ChatTurnResponse } from '../../../services/chatApi';

// jsdom doesn't implement Element.prototype.scrollIntoView — the
// auto-scroll effect in ChatOverlay calls it on every new message.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const SESSION_STORAGE_KEY = 'reanalyzr.chat.sessionId';

// ===== Mock the chat API client =====

vi.mock('../../../services/chatApi', () => ({
  sendChatTurn: vi.fn(),
}));

import { sendChatTurn } from '../../../services/chatApi';
const mockSendChatTurn = sendChatTurn as ReturnType<typeof vi.fn>;

function buildResponse(overrides: Partial<ChatTurnResponse> = {}): ChatTurnResponse {
  return {
    traceId: 'trace-abc',
    responseText: 'Sure, here is the analysis…',
    routing: {
      target: 'analyze_property',
      routedTo: 'analyze_property',
      classifierIntent: 'analyze_property',
      classifierConfidence: 0.92,
    },
    events: {
      conversationEventId: 'evt-1',
      related: [],
    },
    totalCostCents: 0,
    agentStubbed: false,
    ...overrides,
  };
}

describe('ChatOverlay', () => {
  beforeEach(() => {
    mockSendChatTurn.mockReset();
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  });

  it('renders empty-state suggestion when thread is empty', () => {
    render(<ChatOverlay />);
    expect(screen.getByTestId('chat-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Ready when you are/i)).toBeInTheDocument();
  });

  it('appends user + assistant bubbles on submit', async () => {
    mockSendChatTurn.mockResolvedValueOnce(
      buildResponse({ responseText: 'Got it — analyzing 1837 Walnut Way.' })
    );
    const user = userEvent.setup();
    render(<ChatOverlay />);

    const input = screen.getByTestId('chat-input');
    await user.type(input, 'analyze 1837 Walnut Way Anna TX');
    await user.click(screen.getByTestId('chat-send'));

    expect(await screen.findByTestId('chat-message-user')).toHaveTextContent(
      'analyze 1837 Walnut Way Anna TX'
    );
    expect(await screen.findByTestId('chat-message-assistant')).toHaveTextContent(
      'Got it — analyzing 1837 Walnut Way.'
    );
    // Empty state replaced
    expect(screen.queryByTestId('chat-empty-state')).not.toBeInTheDocument();
  });

  it('shows loading indicator during in-flight request', async () => {
    let resolveFn: (v: ChatTurnResponse) => void = () => undefined;
    mockSendChatTurn.mockImplementationOnce(
      () =>
        new Promise<ChatTurnResponse>((resolve) => {
          resolveFn = resolve;
        })
    );
    const user = userEvent.setup();
    render(<ChatOverlay />);

    await user.type(screen.getByTestId('chat-input'), 'hi');
    await user.click(screen.getByTestId('chat-send'));

    expect(await screen.findByTestId('chat-loading')).toBeInTheDocument();
    resolveFn(buildResponse());
    await waitFor(() =>
      expect(screen.queryByTestId('chat-loading')).not.toBeInTheDocument()
    );
  });

  it('renders an error bubble when sendChatTurn rejects', async () => {
    mockSendChatTurn.mockRejectedValueOnce(new Error('Network down'));
    const user = userEvent.setup();
    render(<ChatOverlay />);

    await user.type(screen.getByTestId('chat-input'), 'hi');
    await user.click(screen.getByTestId('chat-send'));

    const err = await screen.findByTestId('chat-message-error');
    expect(err).toHaveAttribute('role', 'alert');
    expect(err).toHaveTextContent(/Network down/);
    // User message still in thread — failure shouldn't wipe history
    expect(screen.getByTestId('chat-message-user')).toBeInTheDocument();
  });

  it('auto-submits initialUserInput exactly once', async () => {
    mockSendChatTurn.mockResolvedValue(
      buildResponse({ responseText: 'auto-response' })
    );
    render(<ChatOverlay initialUserInput="hello from hero" />);

    expect(await screen.findByTestId('chat-message-user')).toHaveTextContent(
      'hello from hero'
    );
    await waitFor(() => expect(mockSendChatTurn).toHaveBeenCalledTimes(1));
  });

  it('Enter sends; Shift+Enter inserts a newline', async () => {
    mockSendChatTurn.mockResolvedValueOnce(buildResponse());
    const user = userEvent.setup();
    render(<ChatOverlay />);

    const input = screen.getByTestId('chat-input');
    await user.type(input, 'first line');
    // Shift+Enter — should NOT send
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(mockSendChatTurn).not.toHaveBeenCalled();
    await user.type(input, 'second line');
    // Plain Enter — should send
    await user.keyboard('{Enter}');
    await waitFor(() => expect(mockSendChatTurn).toHaveBeenCalledTimes(1));
  });

  it('disables send button when draft is empty', () => {
    render(<ChatOverlay />);
    expect(screen.getByTestId('chat-send')).toBeDisabled();
  });

  it('disables send button while a request is in flight', async () => {
    let resolveFn: (v: ChatTurnResponse) => void = () => undefined;
    mockSendChatTurn.mockImplementationOnce(
      () =>
        new Promise<ChatTurnResponse>((resolve) => {
          resolveFn = resolve;
        })
    );
    const user = userEvent.setup();
    render(<ChatOverlay />);

    await user.type(screen.getByTestId('chat-input'), 'hi');
    await user.click(screen.getByTestId('chat-send'));

    expect(screen.getByTestId('chat-send')).toBeDisabled();
    resolveFn(buildResponse());
    await waitFor(() =>
      expect(screen.queryByTestId('chat-loading')).not.toBeInTheDocument()
    );
  });

  it('persists sessionId in sessionStorage across remounts (W6-S2.5 ghost-user continuity)', async () => {
    mockSendChatTurn.mockResolvedValue(buildResponse());
    const user = userEvent.setup();

    const { unmount } = render(<ChatOverlay />);
    await user.type(screen.getByTestId('chat-input'), 'first');
    await user.click(screen.getByTestId('chat-send'));
    await waitFor(() => expect(mockSendChatTurn).toHaveBeenCalledTimes(1));
    const firstSessionId = mockSendChatTurn.mock.calls[0]?.[0].sessionId;
    expect(firstSessionId).toBeTruthy();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(firstSessionId);

    // Simulate a page refresh by unmounting and remounting.
    unmount();
    cleanup();

    render(<ChatOverlay />);
    await user.type(screen.getByTestId('chat-input'), 'second');
    await user.click(screen.getByTestId('chat-send'));
    await waitFor(() => expect(mockSendChatTurn).toHaveBeenCalledTimes(2));
    const secondSessionId = mockSendChatTurn.mock.calls[1]?.[0].sessionId;
    expect(secondSessionId).toBe(firstSessionId);
  });

  it('renders 429 rate-limit message as a clean error bubble', async () => {
    mockSendChatTurn.mockRejectedValueOnce(
      new Error("You've reached the free analysis limit for this session. Sign up to keep going — no payment required during beta.")
    );
    const user = userEvent.setup();
    render(<ChatOverlay />);

    await user.type(screen.getByTestId('chat-input'), 'one more');
    await user.click(screen.getByTestId('chat-send'));

    const err = await screen.findByTestId('chat-message-error');
    expect(err).toHaveAttribute('role', 'alert');
    expect(err).toHaveTextContent(/free analysis limit/i);
    expect(err).toHaveTextContent(/sign up to keep going/i);
  });

  it('passes a stable sessionId for every turn in the same overlay', async () => {
    mockSendChatTurn.mockResolvedValue(buildResponse());
    const user = userEvent.setup();
    render(<ChatOverlay />);

    await user.type(screen.getByTestId('chat-input'), 'first');
    await user.click(screen.getByTestId('chat-send'));
    await waitFor(() => expect(mockSendChatTurn).toHaveBeenCalledTimes(1));

    await user.type(screen.getByTestId('chat-input'), 'second');
    await user.click(screen.getByTestId('chat-send'));
    await waitFor(() => expect(mockSendChatTurn).toHaveBeenCalledTimes(2));

    const call1 = mockSendChatTurn.mock.calls[0]?.[0];
    const call2 = mockSendChatTurn.mock.calls[1]?.[0];
    expect(call1.sessionId).toBe(call2.sessionId);
    expect(call1.turnNumber).toBe(1);
    expect(call2.turnNumber).toBe(2);
  });
});
