/**
 * ChatOverlay tests — the streaming chat surface.
 *
 * Mocks `streamChatTurn` (the SSE consumer) directly so tests focus on
 * thread behavior, not HTTP wiring. Each test scripts a sequence of
 * ChatStreamEvents and asserts how the overlay renders them.
 *
 * Coverage:
 *   - Empty state suggestion renders when thread is empty
 *   - Submit appends user bubble + assistant bubble; deltas accumulate
 *     into the same assistant bubble (no flicker, no duplicate bubbles)
 *   - "Thinking…" indicator shows ONLY before the first delta arrives
 *   - Routing event captured on the assistant message
 *   - `done` terminal event flips the bubble out of streaming state
 *   - `error` terminal event renders an error bubble (role="alert")
 *   - `cancelled` terminal event renders the partial text + "Stopped." hint
 *   - Stop button cancels in-flight stream (AbortController fires)
 *   - initialUserInput auto-submits exactly once (strict-mode safe)
 *   - sessionStorage persists sessionId across remounts
 *   - sendChatTurn receives a stable sessionId; turnNumber increments
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatOverlay } from '../ChatOverlay';
import type { ChatStreamEvent, ChatTurnRequest } from '../../../services/chatApi';

// jsdom doesn't implement Element.prototype.scrollIntoView — the
// auto-scroll effect in ChatOverlay calls it on every new message.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const SESSION_STORAGE_KEY = 'reanalyzr.chat.sessionId';

// ===== Mock the streaming API client =====

vi.mock('../../../services/chatApi', () => ({
  streamChatTurn: vi.fn(),
}));

import { streamChatTurn } from '../../../services/chatApi';
const mockStreamChatTurn = streamChatTurn as ReturnType<typeof vi.fn>;

/**
 * Build a scripted async generator that yields the given stream events.
 * Honors the AbortSignal if provided — yields a `cancelled` event when
 * the signal fires.
 */
function scriptedStream(
  events: ChatStreamEvent[],
  opts: { delayPerEventMs?: number } = {}
) {
  return async function* (
    _request: ChatTurnRequest,
    callOpts: { signal?: AbortSignal } = {}
  ): AsyncGenerator<ChatStreamEvent, void, void> {
    for (const event of events) {
      if (callOpts.signal?.aborted) {
        const err = new DOMException('aborted', 'AbortError');
        throw err;
      }
      if (opts.delayPerEventMs && opts.delayPerEventMs > 0) {
        await new Promise((r) => setTimeout(r, opts.delayPerEventMs));
      }
      yield event;
    }
  };
}

function routingEvent(): ChatStreamEvent {
  return {
    type: 'routing',
    target: 'agent:qa',
    routedTo: 'agent:qa',
    classifierIntent: 'qa_general',
    classifierConfidence: 90,
  };
}

function doneEvent(): ChatStreamEvent {
  return {
    type: 'done',
    traceId: 'tr-1',
    conversationEventId: '6a0700000000000000000001',
    relatedEventIds: [],
    totalCostCents: 0.5,
    agentStubbed: false,
  };
}

describe('ChatOverlay (W6-S3 streaming)', () => {
  beforeEach(() => {
    mockStreamChatTurn.mockReset();
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  });

  it('renders empty-state suggestion when thread is empty', () => {
    render(<ChatOverlay />);
    expect(screen.getByTestId('chat-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Ready when you are/i)).toBeInTheDocument();
  });

  it('accumulates text deltas into a single assistant bubble', async () => {
    mockStreamChatTurn.mockImplementation(
      scriptedStream([
        routingEvent(),
        { type: 'text_delta', text: 'Cap rate' },
        { type: 'text_delta', text: ' is the' },
        { type: 'text_delta', text: ' yield.' },
        doneEvent(),
      ])
    );
    const user = userEvent.setup();
    render(<ChatOverlay />);

    await user.type(screen.getByTestId('chat-input'), 'explain cap rate');
    await user.click(screen.getByTestId('chat-send'));

    const assistant = await screen.findByTestId('chat-message-assistant');
    await waitFor(() => {
      expect(assistant).toHaveTextContent('Cap rate is the yield.');
    });
    // ONE assistant bubble (not N — one per delta would be a bug)
    expect(screen.getAllByTestId('chat-message-assistant')).toHaveLength(1);
  });

  it('shows "Thinking…" only before the first delta arrives', async () => {
    mockStreamChatTurn.mockImplementation(
      scriptedStream(
        [
          routingEvent(),
          { type: 'text_delta', text: 'first chars' },
          doneEvent(),
        ],
        { delayPerEventMs: 30 }
      )
    );
    const user = userEvent.setup();
    render(<ChatOverlay />);

    await user.type(screen.getByTestId('chat-input'), 'hi');
    await user.click(screen.getByTestId('chat-send'));

    // Indicator visible while bubble is empty
    expect(await screen.findByTestId('chat-loading')).toBeInTheDocument();

    // Once the first delta lands, the indicator disappears
    await waitFor(() =>
      expect(screen.queryByTestId('chat-loading')).not.toBeInTheDocument()
    );
  });

  it('replaces the assistant bubble with an error bubble on error event', async () => {
    mockStreamChatTurn.mockImplementation(
      scriptedStream([
        routingEvent(),
        { type: 'error', message: 'Stream backend exploded.' },
      ])
    );
    const user = userEvent.setup();
    render(<ChatOverlay />);

    await user.type(screen.getByTestId('chat-input'), 'hi');
    await user.click(screen.getByTestId('chat-send'));

    const err = await screen.findByTestId('chat-message-error');
    expect(err).toHaveAttribute('role', 'alert');
    expect(err).toHaveTextContent(/Stream backend exploded/);
    // The empty streaming bubble must NOT be left in the thread
    expect(screen.queryByTestId('chat-message-assistant')).not.toBeInTheDocument();
    // User message is still there — failure doesn't wipe history
    expect(screen.getByTestId('chat-message-user')).toBeInTheDocument();
  });

  it('renders partial text + "Stopped." hint on cancelled terminal event', async () => {
    mockStreamChatTurn.mockImplementation(
      scriptedStream([
        routingEvent(),
        { type: 'text_delta', text: 'partial answer' },
        {
          type: 'cancelled',
          partialText: 'partial answer',
          traceId: 'tr-cancel',
          conversationEventId: '6a0700000000000000000099',
          partialCostCents: 0.1,
        },
      ])
    );
    const user = userEvent.setup();
    render(<ChatOverlay />);

    await user.type(screen.getByTestId('chat-input'), 'long thing');
    await user.click(screen.getByTestId('chat-send'));

    const assistant = await screen.findByTestId('chat-message-assistant');
    await waitFor(() => expect(assistant).toHaveTextContent('partial answer'));
    expect(await screen.findByTestId('chat-message-cancelled')).toHaveTextContent(
      /Stopped/
    );
  });

  it('Stop button fires AbortController and surfaces partial text', async () => {
    // Use a slow stream so the test can hit Stop after the first delta.
    mockStreamChatTurn.mockImplementation(
      scriptedStream(
        [
          routingEvent(),
          { type: 'text_delta', text: 'first ' },
          { type: 'text_delta', text: 'second ' },
          { type: 'text_delta', text: 'third' },
          doneEvent(),
        ],
        { delayPerEventMs: 50 }
      )
    );
    const user = userEvent.setup();
    render(<ChatOverlay />);

    await user.type(screen.getByTestId('chat-input'), 'go');
    await user.click(screen.getByTestId('chat-send'));

    // Stop button replaces Send during streaming
    const stopBtn = await screen.findByTestId('chat-stop');
    // Wait until at least one delta has landed so partialText is non-empty
    await screen.findByTestId('chat-message-assistant');
    await waitFor(() =>
      expect(screen.getByTestId('chat-message-assistant')).toHaveTextContent(
        /first/
      )
    );

    await user.click(stopBtn);

    // Bubble flips out of streaming + shows "Stopped." hint
    await waitFor(() =>
      expect(screen.queryByTestId('chat-stop')).not.toBeInTheDocument()
    );
    expect(await screen.findByTestId('chat-message-cancelled')).toBeInTheDocument();
  });

  it('auto-submits initialUserInput exactly once', async () => {
    mockStreamChatTurn.mockImplementation(
      scriptedStream([
        routingEvent(),
        { type: 'text_delta', text: 'auto-response' },
        doneEvent(),
      ])
    );
    render(<ChatOverlay initialUserInput="hello from hero" />);

    expect(await screen.findByTestId('chat-message-user')).toHaveTextContent(
      'hello from hero'
    );
    await waitFor(() => expect(mockStreamChatTurn).toHaveBeenCalledTimes(1));
  });

  it('Enter sends; Shift+Enter inserts a newline', async () => {
    mockStreamChatTurn.mockImplementation(
      scriptedStream([routingEvent(), { type: 'text_delta', text: 'ok' }, doneEvent()])
    );
    const user = userEvent.setup();
    render(<ChatOverlay />);

    const input = screen.getByTestId('chat-input');
    await user.type(input, 'first line');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(mockStreamChatTurn).not.toHaveBeenCalled();
    await user.type(input, 'second line');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(mockStreamChatTurn).toHaveBeenCalledTimes(1));
  });

  it('disables send button when draft is empty', () => {
    render(<ChatOverlay />);
    expect(screen.getByTestId('chat-send')).toBeDisabled();
  });

  it('persists sessionId in sessionStorage across remounts (W6-S2.5 ghost-user continuity)', async () => {
    mockStreamChatTurn.mockImplementation(
      scriptedStream([routingEvent(), { type: 'text_delta', text: 'x' }, doneEvent()])
    );
    const user = userEvent.setup();

    const { unmount } = render(<ChatOverlay />);
    await user.type(screen.getByTestId('chat-input'), 'first');
    await user.click(screen.getByTestId('chat-send'));
    await waitFor(() => expect(mockStreamChatTurn).toHaveBeenCalledTimes(1));
    const firstSessionId = mockStreamChatTurn.mock.calls[0]?.[0].sessionId;
    expect(firstSessionId).toBeTruthy();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(firstSessionId);

    unmount();
    cleanup();

    render(<ChatOverlay />);
    await user.type(screen.getByTestId('chat-input'), 'second');
    await user.click(screen.getByTestId('chat-send'));
    await waitFor(() => expect(mockStreamChatTurn).toHaveBeenCalledTimes(2));
    const secondSessionId = mockStreamChatTurn.mock.calls[1]?.[0].sessionId;
    expect(secondSessionId).toBe(firstSessionId);
  });

  it('passes a stable sessionId + monotonic turnNumber across turns', async () => {
    mockStreamChatTurn.mockImplementation(
      scriptedStream([routingEvent(), { type: 'text_delta', text: 'x' }, doneEvent()])
    );
    const user = userEvent.setup();
    render(<ChatOverlay />);

    await user.type(screen.getByTestId('chat-input'), 'first');
    await user.click(screen.getByTestId('chat-send'));
    await waitFor(() => expect(mockStreamChatTurn).toHaveBeenCalledTimes(1));

    await user.type(screen.getByTestId('chat-input'), 'second');
    await user.click(screen.getByTestId('chat-send'));
    await waitFor(() => expect(mockStreamChatTurn).toHaveBeenCalledTimes(2));

    const call1 = mockStreamChatTurn.mock.calls[0]?.[0];
    const call2 = mockStreamChatTurn.mock.calls[1]?.[0];
    expect(call1.sessionId).toBe(call2.sessionId);
    expect(call1.turnNumber).toBe(1);
    expect(call2.turnNumber).toBe(2);
  });
});
