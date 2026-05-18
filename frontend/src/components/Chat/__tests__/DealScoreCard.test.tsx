/**
 * DealScoreCard tests — visual contract for the inline score card.
 *
 * We test the things that matter for product correctness:
 *   - All 4 score bands render the correct contextual label
 *     (the architecture §1.5 mapping — no "BUY"/"PASS" text)
 *   - Top factors render (capped at 3 even if more passed)
 *   - Walk-away delta math is correct (% above / below / at)
 *   - Assumptions collapse expands on click + keyboard, fires
 *     the change-assumptions callback when present
 *   - Tinted CTA hides when no callback wired
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { DealScoreCard, type DealScoreCardProps } from '../DealScoreCard';
import { chatTheme } from '../../../theme/chatTheme';

function renderCard(overrides: Partial<DealScoreCardProps> = {}) {
  const props: DealScoreCardProps = {
    strategy: 'buy_hold',
    address: { street: '1837 Walnut Way', city: 'Anna', state: 'TX' },
    dealQuality: 78,
    topFactors: [
      { label: 'Cash flow', score: 88 },
      { label: 'Debt structure', score: 72 },
      { label: 'Market', score: 65 },
    ],
    walkAwayPrice: 385000,
    purchasePrice: 425000,
    nextStep: 'Make an offer at $385,000 with a 14-day inspection.',
    assumptions: [
      { label: '25% down', value: '$106,250' },
      { label: 'Mortgage rate', value: '6.95%', source: 'FRED 30yr avg' },
    ],
    ...overrides,
  };
  return {
    ...render(
      <ThemeProvider theme={chatTheme}>
        <DealScoreCard {...props} />
      </ThemeProvider>
    ),
    props,
  };
}

describe('DealScoreCard', () => {
  describe('score band → contextual label', () => {
    it('shows "Above professional standards" for 80+', () => {
      renderCard({ dealQuality: 87 });
      expect(screen.getByTestId('deal-score-card-score')).toHaveTextContent('87');
      expect(screen.getByTestId('deal-score-card-label')).toHaveTextContent(
        /above professional standards/i
      );
    });

    it('shows "Meets professional standards" for 65-79', () => {
      renderCard({ dealQuality: 72 });
      expect(screen.getByTestId('deal-score-card-label')).toHaveTextContent(
        /meets professional standards/i
      );
    });

    it('shows "Requires optimization" for 50-64', () => {
      renderCard({ dealQuality: 58 });
      expect(screen.getByTestId('deal-score-card-label')).toHaveTextContent(
        /requires optimization/i
      );
    });

    it('shows "Below professional standards" for <50', () => {
      renderCard({ dealQuality: 32 });
      expect(screen.getByTestId('deal-score-card-label')).toHaveTextContent(
        /below professional standards/i
      );
    });

    it('does NOT display directive verdict language in the quality label', () => {
      // Architecture §1.5 — the score band's qualityLabel must never be
      // a directive verdict (BUY / PASS / NEGOTIATE / CAUTION). We scope
      // the assertion to the label element so the legitimate "BUY-AND-HOLD"
      // strategy caption isn't a false-positive match.
      renderCard({ dealQuality: 32 });
      const labelText = screen.getByTestId('deal-score-card-label').textContent ?? '';
      expect(labelText).not.toMatch(/\bBUY\b/);
      expect(labelText).not.toMatch(/\bPASS\b/);
      expect(labelText).not.toMatch(/\bNEGOTIATE\b/);
      expect(labelText).not.toMatch(/\bCAUTION\b/);
    });
  });

  describe('caption — strategy + address', () => {
    it('shows BUY-AND-HOLD caption for buy_hold', () => {
      renderCard({ strategy: 'buy_hold' });
      expect(screen.getByTestId('deal-score-card-caption')).toHaveTextContent(
        /BUY-AND-HOLD ANALYSIS · 1837 Walnut Way, Anna TX/
      );
    });

    it('shows BRRRR caption for brrrr', () => {
      renderCard({ strategy: 'brrrr' });
      expect(screen.getByTestId('deal-score-card-caption')).toHaveTextContent(
        /BRRRR ANALYSIS/
      );
    });
  });

  describe('top factors', () => {
    it('renders all 3 factors with labels and scores', () => {
      renderCard();
      const factors = screen.getAllByTestId('deal-score-card-factor');
      expect(factors).toHaveLength(3);
      expect(factors[0]).toHaveTextContent('Cash flow');
      expect(factors[0]).toHaveTextContent('88/100');
    });

    it('caps at 3 even when more are passed', () => {
      renderCard({
        topFactors: [
          { label: 'A', score: 90 },
          { label: 'B', score: 80 },
          { label: 'C', score: 70 },
          { label: 'D', score: 60 },
          { label: 'E', score: 50 },
        ],
      });
      expect(screen.getAllByTestId('deal-score-card-factor')).toHaveLength(3);
      expect(screen.queryByText('D')).not.toBeInTheDocument();
    });
  });

  describe('walk-away delta', () => {
    it('shows "% above" when purchase > walk-away', () => {
      renderCard({ purchasePrice: 425000, walkAwayPrice: 385000 });
      // 40000 / 385000 = 10.39% → "10% above"
      expect(screen.getByTestId('deal-score-card-delta')).toHaveTextContent(
        /10% above/
      );
    });

    it('shows "% below" when purchase < walk-away', () => {
      renderCard({ purchasePrice: 360000, walkAwayPrice: 385000 });
      // 25000 / 385000 = 6.49% → "6% below"
      expect(screen.getByTestId('deal-score-card-delta')).toHaveTextContent(
        /6% below/
      );
    });

    it('shows "at walk-away" when equal', () => {
      renderCard({ purchasePrice: 385000, walkAwayPrice: 385000 });
      expect(screen.getByTestId('deal-score-card-delta')).toHaveTextContent(
        /at walk-away/
      );
    });

    it('formats currency without decimals', () => {
      renderCard({ walkAwayPrice: 385000 });
      expect(screen.getByText('$385,000')).toBeInTheDocument();
    });
  });

  describe('next step', () => {
    it('renders the one-sentence next step verbatim', () => {
      renderCard();
      expect(screen.getByTestId('deal-score-card-next-step')).toHaveTextContent(
        'Make an offer at $385,000 with a 14-day inspection.'
      );
    });
  });

  describe('assumptions disclose-after', () => {
    it('is collapsed by default — assumption rows not visible', () => {
      renderCard();
      const toggle = screen.getByTestId('deal-score-card-assumptions-toggle');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('expands on click + reveals assumption rows', async () => {
      const user = userEvent.setup();
      renderCard();
      const toggle = screen.getByTestId('deal-score-card-assumptions-toggle');
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('25% down')).toBeInTheDocument();
      expect(screen.getByText('$106,250')).toBeInTheDocument();
    });

    it('expands on Enter / Space keyboard (a11y)', () => {
      renderCard();
      const toggle = screen.getByTestId('deal-score-card-assumptions-toggle');
      fireEvent.keyDown(toggle, { key: 'Enter' });
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      fireEvent.keyDown(toggle, { key: ' ' });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows assumption source provenance when provided', async () => {
      const user = userEvent.setup();
      renderCard();
      await user.click(screen.getByTestId('deal-score-card-assumptions-toggle'));
      expect(screen.getByText(/FRED 30yr avg/)).toBeInTheDocument();
    });

    it('renders "Change any of these" tinted CTA + fires callback', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderCard({ onChangeAssumptions: onChange });
      await user.click(screen.getByTestId('deal-score-card-assumptions-toggle'));
      const cta = screen.getByTestId('deal-score-card-change-assumptions');
      await user.click(cta);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('hides the "Change any of these" CTA when no callback wired', async () => {
      const user = userEvent.setup();
      renderCard({ onChangeAssumptions: undefined });
      await user.click(screen.getByTestId('deal-score-card-assumptions-toggle'));
      expect(
        screen.queryByTestId('deal-score-card-change-assumptions')
      ).not.toBeInTheDocument();
    });
  });

  // ===== Issue #112: 10-year projection =====

  describe('10-year projection section', () => {
    const sampleProjection: NonNullable<DealScoreCardProps['projection']> = [
      { year: 1, cashFlow: 3000, propertyValue: 440000, equity: 85000 },
      { year: 3, cashFlow: 3200, propertyValue: 472000, equity: 105000 },
      { year: 5, cashFlow: 3400, propertyValue: 506000, equity: 128000 },
      { year: 7, cashFlow: 3600, propertyValue: 542000, equity: 154000 },
      { year: 10, cashFlow: 4000, propertyValue: 601000, equity: 195000 },
    ];

    it('does NOT render the section when projection prop is absent', () => {
      renderCard();
      expect(
        screen.queryByTestId('deal-score-card-projection-toggle')
      ).not.toBeInTheDocument();
    });

    it('does NOT render the section when projection is an empty array', () => {
      renderCard({ projection: [] });
      expect(
        screen.queryByTestId('deal-score-card-projection-toggle')
      ).not.toBeInTheDocument();
    });

    it('renders the toggle when projection has rows', () => {
      renderCard({ projection: sampleProjection });
      expect(
        screen.getByTestId('deal-score-card-projection-toggle')
      ).toBeInTheDocument();
    });

    it('expand reveals the 5 milestone rows with formatted dollar amounts', async () => {
      const user = userEvent.setup();
      renderCard({ projection: sampleProjection });
      await user.click(screen.getByTestId('deal-score-card-projection-toggle'));
      const table = screen.getByTestId('deal-score-card-projection-table');
      // All 5 years visible
      expect(table).toHaveTextContent('1');
      expect(table).toHaveTextContent('3');
      expect(table).toHaveTextContent('5');
      expect(table).toHaveTextContent('7');
      expect(table).toHaveTextContent('10');
      // Dollar formatting applied
      expect(table).toHaveTextContent('$3,000');
      expect(table).toHaveTextContent('$601,000');
      expect(table).toHaveTextContent('$195,000');
    });

    it('toggle is keyboard-accessible (Enter expands)', () => {
      renderCard({ projection: sampleProjection });
      const toggle = screen.getByTestId('deal-score-card-projection-toggle');
      // Toggle starts collapsed
      expect(
        screen.queryByTestId('deal-score-card-projection-table')
      ).not.toBeVisible();
      fireEvent.keyDown(toggle, { key: 'Enter' });
      // After Enter, table is in the DOM (Collapse animates open)
      expect(
        screen.getByTestId('deal-score-card-projection-table')
      ).toBeInTheDocument();
    });
  });
});
