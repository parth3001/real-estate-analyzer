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
  sendChatEmailSummary: vi.fn(),
}));

// Mock react-router so ChatOverlay's useNavigate() works without
// wrapping every test render in a MemoryRouter.
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { streamChatTurn, sendChatEmailSummary } from '../../../services/chatApi';
import { PENDING_CHAT_CLAIM_KEY } from '../../../services/pendingChatClaim';
const mockStreamChatTurn = streamChatTurn as ReturnType<typeof vi.fn>;
const mockSendChatEmailSummary = sendChatEmailSummary as ReturnType<typeof vi.fn>;

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

function dealScoreStructuredEvent(): ChatStreamEvent {
  return {
    type: 'structured_output',
    kind: 'deal_score_card',
    data: {
      strategy: 'buy_hold',
      address: { street: '1837 Walnut Way', city: 'Anna', state: 'TX' },
      dealQuality: 87,
      topFactors: [
        { label: 'Cash flow', score: 92 },
        { label: 'Property risk', score: 30 },
        { label: 'Market strength', score: 70 },
      ],
      walkAwayPrice: 385000,
      purchasePrice: 425000,
      nextStep: 'Make an offer at $385,000 with a 14-day inspection.',
      assumptions: [{ label: '25% down', value: '$106,250' }],
    },
  };
}

describe('ChatOverlay (W6-S3 streaming)', () => {
  beforeEach(() => {
    mockStreamChatTurn.mockReset();
    mockSendChatEmailSummary.mockReset();
    mockNavigate.mockReset();
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(PENDING_CHAT_CLAIM_KEY);
    // Day 5 — threadStore drives the empty-state chip set. Clear it
    // between tests so the "brand new user" empty state is the default
    // unless a test seeds otherwise.
    localStorage.removeItem('reanalyzr.chat.threads');
  });

  it('renders empty-state hero + chips when thread is empty (Day 5)', () => {
    render(<ChatOverlay />);
    expect(screen.getByTestId('chat-empty-state')).toBeInTheDocument();
    // New empty state ships a platform-positioning headline and a chip
    // set generated by emptyStateChips.ts. Test asserts the headline +
    // at least one chip — full chip-pool coverage lives in
    // emptyStateChips.test.ts.
    expect(
      screen.getByTestId('chat-empty-state-headline')
    ).toHaveTextContent(/institutional-grade/i);
    expect(screen.getByTestId('chat-followup-chips')).toBeInTheDocument();
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

  // ===== W6-S4 — structured outputs + CTAs =====

  describe('structured outputs (W6-S4)', () => {
    it('renders DealScoreCard inline when a deal_score_card event arrives', async () => {
      mockStreamChatTurn.mockImplementation(
        scriptedStream([
          routingEvent(),
          { type: 'text_delta', text: "Here's the analysis." },
          dealScoreStructuredEvent(),
          doneEvent(),
        ])
      );
      const user = userEvent.setup();
      render(<ChatOverlay />);

      await user.type(screen.getByTestId('chat-input'), 'analyze it');
      await user.click(screen.getByTestId('chat-send'));

      // The card mounts; we identify it by its data-testid from DealScoreCard.
      const card = await screen.findByTestId('deal-score-card');
      expect(card).toBeInTheDocument();
      // Score should be rendered
      expect(screen.getByTestId('deal-score-card-score')).toHaveTextContent('87');
    });

    it('shows both CTAs (Email + Portfolio) on the inline card', async () => {
      mockStreamChatTurn.mockImplementation(
        scriptedStream([
          routingEvent(),
          dealScoreStructuredEvent(),
          doneEvent(),
        ])
      );
      const user = userEvent.setup();
      render(<ChatOverlay />);

      await user.type(screen.getByTestId('chat-input'), 'go');
      await user.click(screen.getByTestId('chat-send'));

      expect(await screen.findByTestId('chat-cta-email')).toBeInTheDocument();
      expect(screen.getByTestId('chat-cta-portfolio')).toBeInTheDocument();
    });

    it('email CTA opens the modal with the deal context', async () => {
      mockStreamChatTurn.mockImplementation(
        scriptedStream([
          routingEvent(),
          dealScoreStructuredEvent(),
          doneEvent(),
        ])
      );
      const user = userEvent.setup();
      render(<ChatOverlay />);

      await user.type(screen.getByTestId('chat-input'), 'go');
      await user.click(screen.getByTestId('chat-send'));

      await user.click(await screen.findByTestId('chat-cta-email'));

      const modal = await screen.findByTestId('email-cta-modal');
      expect(modal).toBeInTheDocument();
      // Address snippet should appear in the modal (scoped, since the
      // address also renders in the card caption above).
      const within = await import('@testing-library/react');
      expect(
        within.within(modal).getByText(/1837 Walnut Way/)
      ).toBeInTheDocument();
    });

    it('email modal Send fires sendChatEmailSummary with sessionId + conversationEventId', async () => {
      mockStreamChatTurn.mockImplementation(
        scriptedStream([
          routingEvent(),
          dealScoreStructuredEvent(),
          doneEvent(),
        ])
      );
      mockSendChatEmailSummary.mockResolvedValueOnce({ sent: true });
      const user = userEvent.setup();
      render(<ChatOverlay />);

      await user.type(screen.getByTestId('chat-input'), 'go');
      await user.click(screen.getByTestId('chat-send'));

      await user.click(await screen.findByTestId('chat-cta-email'));
      await user.type(
        screen.getByTestId('email-cta-input'),
        'investor@example.com'
      );
      await user.click(screen.getByTestId('email-cta-send'));

      await waitFor(() =>
        expect(mockSendChatEmailSummary).toHaveBeenCalledTimes(1)
      );
      const payload = mockSendChatEmailSummary.mock.calls[0]?.[0];
      expect(payload.email).toBe('investor@example.com');
      expect(payload.sessionId).toBe(sessionStorage.getItem(SESSION_STORAGE_KEY));
      expect(payload.conversationEventId).toBeTruthy();

      // Success state replaces the form
      expect(await screen.findByTestId('email-cta-success')).toHaveTextContent(
        /investor@example.com/
      );
    });

    it('email modal Send button is disabled until a valid-looking email is entered', async () => {
      mockStreamChatTurn.mockImplementation(
        scriptedStream([
          routingEvent(),
          dealScoreStructuredEvent(),
          doneEvent(),
        ])
      );
      const user = userEvent.setup();
      render(<ChatOverlay />);

      await user.type(screen.getByTestId('chat-input'), 'go');
      await user.click(screen.getByTestId('chat-send'));
      await user.click(await screen.findByTestId('chat-cta-email'));

      const sendBtn = screen.getByTestId('email-cta-send');
      expect(sendBtn).toBeDisabled();

      await user.type(screen.getByTestId('email-cta-input'), 'not-an-email');
      expect(sendBtn).toBeDisabled();

      await user.clear(screen.getByTestId('email-cta-input'));
      await user.type(screen.getByTestId('email-cta-input'), 'a@b.co');
      expect(sendBtn).not.toBeDisabled();
    });

    it('portfolio CTA navigates to /login?returnTo=/app with pendingConversationId', async () => {
      mockStreamChatTurn.mockImplementation(
        scriptedStream([
          routingEvent(),
          dealScoreStructuredEvent(),
          doneEvent(),
        ])
      );
      const user = userEvent.setup();
      render(<ChatOverlay />);

      await user.type(screen.getByTestId('chat-input'), 'go');
      await user.click(screen.getByTestId('chat-send'));

      await user.click(await screen.findByTestId('chat-cta-portfolio'));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      const target = mockNavigate.mock.calls[0]?.[0] as string;
      expect(target).toContain('/login?');
      expect(target).toContain('returnTo=%2Fapp');
      expect(target).toContain('pendingConversationId=');
    });

    it('renders suggested_followups chips after stream done — Day 4', async () => {
      const chipsEvent: ChatStreamEvent = {
        type: 'structured_output',
        kind: 'suggested_followups',
        data: {
          chips: [
            'Stress-test at 7% mortgage rates',
            'Show the 10-year projection',
            'Compare to my saved properties',
          ],
        },
      };
      mockStreamChatTurn.mockImplementation(
        scriptedStream([
          routingEvent(),
          { type: 'text_delta', text: 'Sure.' },
          chipsEvent,
          doneEvent(),
        ])
      );
      const user = userEvent.setup();
      render(<ChatOverlay />);

      await user.type(screen.getByTestId('chat-input'), 'analyze something');
      await user.click(screen.getByTestId('chat-send'));

      // All three chips render below the assistant message.
      await screen.findByTestId('chat-followup-chips');
      expect(
        screen.getByTestId('chat-followup-chip-0')
      ).toHaveTextContent('Stress-test at 7% mortgage rates');
      expect(
        screen.getByTestId('chat-followup-chip-1')
      ).toHaveTextContent('Show the 10-year projection');
      expect(
        screen.getByTestId('chat-followup-chip-2')
      ).toHaveTextContent('Compare to my saved properties');
    });

    it('chip tap prefills input but does NOT auto-send — Day 4', async () => {
      const chipsEvent: ChatStreamEvent = {
        type: 'structured_output',
        kind: 'suggested_followups',
        data: { chips: ['Show the 10-year projection'] },
      };
      mockStreamChatTurn.mockImplementation(
        scriptedStream([
          routingEvent(),
          { type: 'text_delta', text: 'OK.' },
          chipsEvent,
          doneEvent(),
        ])
      );
      const user = userEvent.setup();
      render(<ChatOverlay />);

      const input = screen.getByTestId('chat-input') as HTMLTextAreaElement;
      await user.type(input, 'first turn');
      await user.click(screen.getByTestId('chat-send'));

      // Reset the stream mock so a chip-driven send would be visible.
      mockStreamChatTurn.mockClear();

      // Click the chip — input should fill, but no new stream should fire.
      const chip = await screen.findByTestId('chat-followup-chip-0');
      await user.click(chip);

      await waitFor(() =>
        expect(input.value).toBe('Show the 10-year projection')
      );
      expect(mockStreamChatTurn).not.toHaveBeenCalled();
    });

    it('chips disappear under historical turns (only show under the latest) — Day 4', async () => {
      const chipsTurn1: ChatStreamEvent = {
        type: 'structured_output',
        kind: 'suggested_followups',
        data: { chips: ['First-turn chip'] },
      };
      const chipsTurn2: ChatStreamEvent = {
        type: 'structured_output',
        kind: 'suggested_followups',
        data: { chips: ['Second-turn chip'] },
      };
      // Two sequential streams. Each yields its own chip set.
      mockStreamChatTurn
        .mockImplementationOnce(
          scriptedStream([
            routingEvent(),
            { type: 'text_delta', text: 'A' },
            chipsTurn1,
            doneEvent(),
          ])
        )
        .mockImplementationOnce(
          scriptedStream([
            routingEvent(),
            { type: 'text_delta', text: 'B' },
            chipsTurn2,
            doneEvent(),
          ])
        );

      const user = userEvent.setup();
      render(<ChatOverlay />);

      const input = screen.getByTestId('chat-input');
      await user.type(input, 'one');
      await user.click(screen.getByTestId('chat-send'));
      await screen.findByText('First-turn chip');

      await user.type(input, 'two');
      await user.click(screen.getByTestId('chat-send'));
      await screen.findByText('Second-turn chip');

      // First-turn chip is no longer rendered — only the latest set
      // hangs under the most-recent assistant bubble.
      expect(screen.queryByText('First-turn chip')).not.toBeInTheDocument();
    });

    it('portfolio CTA stashes a pendingChatClaim in localStorage (W6-S5)', async () => {
      mockStreamChatTurn.mockImplementation(
        scriptedStream([
          routingEvent(),
          dealScoreStructuredEvent(),
          doneEvent(),
        ])
      );
      const user = userEvent.setup();
      render(<ChatOverlay />);

      await user.type(screen.getByTestId('chat-input'), 'go');
      await user.click(screen.getByTestId('chat-send'));
      await user.click(await screen.findByTestId('chat-cta-portfolio'));

      const raw = localStorage.getItem(PENDING_CHAT_CLAIM_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.returnTo).toBe('/app');
      expect(parsed.sessionId).toBe(
        sessionStorage.getItem(SESSION_STORAGE_KEY)
      );
      expect(typeof parsed.stashedAt).toBe('number');
      // conversationEventId comes from the `done` event; threaded through
      // the assistant message and into the stashed claim.
      expect(parsed.conversationEventId).toBeTruthy();
    });
  });
});
