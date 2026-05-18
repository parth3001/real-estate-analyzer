/**
 * CritiqueCard — state-rendering tests (T1 frontend, Issue #97).
 *
 * Three states it must handle correctly:
 *   1. Unavailable — pre-T1 deal / critique skipped → renders NOTHING
 *      (returns null so SavedDealHero collapses the slot cleanly)
 *   2. Loading or pending — placeholder copy, no big spinner
 *   3. Complete — both personas rendered with severity tags + reasons
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CritiqueCard } from '../CritiqueCard';
import type { CritiqueWire } from '../../../services/api';

function makeCritique(
  overrides: Partial<CritiqueWire> = {}
): CritiqueWire {
  return {
    persona: 'skeptical_cpa',
    agreementWithOriginal: false,
    severityScore: 60,
    divergenceReasons: ['DSCR margin too thin for rate-shock.'],
    alternativeAssumptions: [],
    triggerType: 'auto_on_save',
    timestamp: '2026-05-18T16:00:00.000Z',
    ...overrides,
  };
}

describe('CritiqueCard (T1 frontend)', () => {
  // ===== Unavailable state — render null =====

  it('renders nothing when not loading, not pending, and no critiques', () => {
    const { container } = render(
      <CritiqueCard critiques={[]} pending={false} loading={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  // ===== Loading state =====

  it('shows the loading placeholder while the fetch is in flight', () => {
    render(<CritiqueCard critiques={[]} pending={false} loading={true} />);
    expect(screen.getByTestId('critique-card')).toBeInTheDocument();
    expect(screen.getByText(/Loading review/i)).toBeInTheDocument();
  });

  // ===== Pending state =====

  it('shows the "review in progress" placeholder when backend pending=true', () => {
    render(<CritiqueCard critiques={[]} pending={true} loading={false} />);
    expect(screen.getByTestId('critique-card')).toBeInTheDocument();
    expect(screen.getByText(/Review in progress/i)).toBeInTheDocument();
  });

  // ===== Complete state — single persona =====

  it('renders a single persona column with divergence reasons', () => {
    const critique = makeCritique({
      persona: 'optimistic_flipper',
      severityScore: 15,
      agreementWithOriginal: true,
      divergenceReasons: [
        'Comps support a higher exit',
        'Renovation budget has slack',
      ],
    });
    render(
      <CritiqueCard
        critiques={[critique]}
        pending={false}
        loading={false}
      />
    );
    expect(screen.getByText('Optimistic Flipper')).toBeInTheDocument();
    expect(screen.getByText(/Mostly agrees/i)).toBeInTheDocument();
    expect(
      screen.getByText('Comps support a higher exit')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Renovation budget has slack')
    ).toBeInTheDocument();
  });

  // ===== Complete state — both personas =====

  it('renders both personas with optimistic_flipper LEFT, skeptical_cpa RIGHT', () => {
    const critiques: CritiqueWire[] = [
      // Pass in reverse order — component should sort them
      makeCritique({
        persona: 'skeptical_cpa',
        severityScore: 70,
        agreementWithOriginal: false,
        divergenceReasons: ['Vacancy under-modeled'],
      }),
      makeCritique({
        persona: 'optimistic_flipper',
        severityScore: 10,
        agreementWithOriginal: true,
        divergenceReasons: ['Comps support higher exit'],
      }),
    ];
    render(
      <CritiqueCard
        critiques={critiques}
        pending={false}
        loading={false}
      />
    );
    const personas = screen
      .getAllByText(/Optimistic Flipper|Skeptical CPA/);
    expect(personas).toHaveLength(2);
    // Optimistic Flipper should come first in the DOM (left column).
    expect(personas[0]).toHaveTextContent('Optimistic Flipper');
    expect(personas[1]).toHaveTextContent('Skeptical CPA');
  });

  // ===== Severity buckets =====

  it('labels severity 0-20 as "Mostly agrees" when agrees=true', () => {
    render(
      <CritiqueCard
        critiques={[
          makeCritique({ severityScore: 10, agreementWithOriginal: true }),
        ]}
        pending={false}
        loading={false}
      />
    );
    expect(screen.getByText(/Mostly agrees/i)).toBeInTheDocument();
  });

  it('labels severity 50-80 as "Significant concerns"', () => {
    render(
      <CritiqueCard
        critiques={[
          makeCritique({ severityScore: 65, agreementWithOriginal: false }),
        ]}
        pending={false}
        loading={false}
      />
    );
    expect(screen.getByText(/Significant concerns/i)).toBeInTheDocument();
  });

  it('labels severity 80+ as "Strong disagreement"', () => {
    render(
      <CritiqueCard
        critiques={[
          makeCritique({ severityScore: 90, agreementWithOriginal: false }),
        ]}
        pending={false}
        loading={false}
      />
    );
    expect(screen.getByText(/Strong disagreement/i)).toBeInTheDocument();
  });

  // ===== Alternative-assumption rendering =====

  it('renders alternative-assumption suggestions when present', () => {
    const critique = makeCritique({
      alternativeAssumptions: [
        {
          fieldPath: 'assumptions.vacancyRate',
          suggestedValue: 8,
          reasoning: '5-year submarket average is 8.1%, not 4%.',
        },
      ],
    });
    render(
      <CritiqueCard
        critiques={[critique]}
        pending={false}
        loading={false}
      />
    );
    expect(screen.getByText(/Suggested adjustments/i)).toBeInTheDocument();
    expect(screen.getByText('assumptions.vacancyRate')).toBeInTheDocument();
    expect(
      screen.getByText(/5-year submarket average is 8\.1%/)
    ).toBeInTheDocument();
  });
});
