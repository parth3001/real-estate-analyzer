/**
 * SavedDealHero — smoke tests covering the polymorphic-rendering contract.
 *
 * The variant config is tested separately in savedDealVariants.test.ts.
 * This file covers integration:
 *   1. Component mounts for each of the 4 variants without crashing
 *   2. Caption + score render from the deal data
 *   3. Action chips render with the right copy for each variant
 *   4. Chip tap navigates to /app with the chip text + property context
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SavedDealHero } from '../SavedDealHero';
import type { SavedDealShape } from '../savedDealVariants';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function makeDeal(overrides: Partial<SavedDealShape> = {}): SavedDealShape {
  return {
    propertyType: 'SFR',
    investmentStrategy: 'buy-hold',
    propertyAddress: {
      street: '336 Highland Ridge Drive',
      city: 'Wylie',
      state: 'TX',
      zipCode: '75098',
    },
    purchasePrice: 223000,
    investmentDecision: {
      score: 82,
      primaryReason: 'Strong cash flow + market fundamentals',
      professionalAssessment: {
        dealQuality: 82,
        cashFlowScore: 75,
        irrScore: 100,
        marketStrengthScore: 85,
        debtStructureScore: 83,
      },
    },
    ...overrides,
  };
}

function renderHero(deal: SavedDealShape) {
  return render(
    <MemoryRouter>
      <SavedDealHero deal={deal} />
    </MemoryRouter>
  );
}

describe('SavedDealHero', () => {
  it('renders the SFR Buy & Hold variant', () => {
    renderHero(makeDeal());
    // Score number + qualityLabel come from DealScoreCard
    expect(screen.getByTestId('deal-score-card-score')).toHaveTextContent('82');
    expect(screen.getByTestId('deal-score-card-caption')).toHaveTextContent(
      /BUY & HOLD ANALYSIS · 336 Highland Ridge Drive, Wylie TX/i
    );
    // Chips render
    expect(screen.getByTestId('saved-deal-hero-chips')).toBeInTheDocument();
    expect(screen.getByTestId('saved-deal-hero-chip-0')).toBeInTheDocument();
  });

  it('renders the BRRRR variant with the right caption + chips', () => {
    renderHero(
      makeDeal({
        investmentStrategy: 'brrrr',
        brrrr: {
          rehabBudget: 40000,
          afterRepairValue: 300000,
          refinanceLTV: 75,
        },
      })
    );
    expect(screen.getByTestId('deal-score-card-caption')).toHaveTextContent(
      /BRRRR ANALYSIS/i
    );
    // BRRRR chips reference ARV
    const chipTexts = Array.from(
      document.querySelectorAll('[data-testid^="saved-deal-hero-chip-"]')
    )
      .map((el) => el.textContent)
      .join(' ')
      .toLowerCase();
    expect(chipTexts).toContain('arv');
  });

  it('renders the Multi-Family variant with unit count in caption', () => {
    renderHero(
      makeDeal({
        propertyType: 'MF',
        totalUnits: 4,
      })
    );
    expect(screen.getByTestId('deal-score-card-caption')).toHaveTextContent(
      /MULTI-FAMILY ANALYSIS · 4 units/i
    );
    // MF chips reference occupancy or per-unit
    const chipTexts = Array.from(
      document.querySelectorAll('[data-testid^="saved-deal-hero-chip-"]')
    )
      .map((el) => el.textContent)
      .join(' ')
      .toLowerCase();
    expect(
      chipTexts.includes('occupancy') || chipTexts.includes('per-unit')
    ).toBe(true);
  });

  it('renders the House Hack variant with the right caption', () => {
    renderHero(makeDeal({ investmentStrategy: 'house-hack' }));
    expect(screen.getByTestId('deal-score-card-caption')).toHaveTextContent(
      /HOUSE HACK ANALYSIS/i
    );
  });

  it('chip tap navigates to /app with the chip text + property context', async () => {
    mockNavigate.mockReset();
    renderHero(makeDeal());
    const user = userEvent.setup();
    await user.click(screen.getByTestId('saved-deal-hero-chip-0'));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const [path, options] = mockNavigate.mock.calls[0];
    expect(path).toBe('/app');
    expect(options.state.initialUserInput).toMatch(
      /336 Highland Ridge Drive/
    );
    // The chip's own text is preserved
    expect(options.state.initialUserInput).toMatch(/Stress-test|projection|score|hold/);
  });

  it('renders 0 score gracefully when deal has no investmentDecision (legacy/older deals)', () => {
    renderHero(
      makeDeal({
        investmentDecision: undefined,
        analysis: undefined,
      })
    );
    // No crash; score renders as 0 (DealScoreCard tolerates 0)
    expect(screen.getByTestId('deal-score-card-score')).toHaveTextContent('0');
  });

  it('reads professionalAssessment from nested analysis.investmentDecision when top-level missing (Issue #109 follow-through)', () => {
    renderHero(
      makeDeal({
        investmentDecision: undefined,
        analysis: {
          investmentDecision: {
            professionalAssessment: {
              dealQuality: 67,
              cashFlowScore: 60,
              irrScore: 80,
              marketStrengthScore: 70,
            },
          },
        },
      })
    );
    expect(screen.getByTestId('deal-score-card-score')).toHaveTextContent('67');
  });
});
