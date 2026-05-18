/**
 * LicenseStatusBadge — state-rendering tests (Day 10).
 *
 * Four observable states the badge must render correctly:
 *   - loading         → skeleton, no badge text
 *   - none            → "Free analysis" chip
 *   - active          → green "Licensed" chip + budget bar + remaining days
 *   - expired/refunded → muted chip with re-license hint
 *
 * Dev-seed button visibility is env-gated; we don't unit-test that
 * vite env var here (would require module-level reset). Covered by
 * the manual founder test path in the implementation log.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LicenseStatusBadge } from '../LicenseStatusBadge';
import type { LicenseStatusWire } from '../../../services/api';

describe('LicenseStatusBadge (Day 10)', () => {
  // ===== Loading =====

  it('renders a skeleton when loading', () => {
    render(
      <LicenseStatusBadge dealId="x" license={null} loading={true} />
    );
    expect(screen.getByTestId('license-badge-loading')).toBeInTheDocument();
  });

  it('renders nothing when not loading and license is null', () => {
    // null != 'none' — null means we haven't fetched yet OR there was
    // a fetch error. Component returns null (no UI).
    const { container } = render(
      <LicenseStatusBadge dealId="x" license={null} loading={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  // ===== Status: none =====

  it('renders "Free analysis" chip when status=none', () => {
    render(
      <LicenseStatusBadge
        dealId="x"
        license={{ status: 'none' }}
        loading={false}
      />
    );
    expect(screen.getByTestId('license-badge-none')).toBeInTheDocument();
    expect(screen.getByText(/Free analysis/i)).toBeInTheDocument();
  });

  // ===== Status: active =====

  function makeActive(
    overrides: Partial<Extract<LicenseStatusWire, { status: 'active' }>> = {}
  ): LicenseStatusWire {
    const purchasedAt = new Date();
    const expiresAt = new Date(
      purchasedAt.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    return {
      status: 'active',
      licenseId: 'lic-1',
      expiresAt: expiresAt.toISOString(),
      purchasedAt: purchasedAt.toISOString(),
      costBudgetCentsStart: 200,
      costSpentCents: 40,
      pricePaidCents: 499,
      ...overrides,
    };
  }

  it('renders green active chip with days remaining and budget bar', () => {
    render(
      <LicenseStatusBadge
        dealId="x"
        license={makeActive()}
        loading={false}
      />
    );
    expect(screen.getByTestId('license-badge-active')).toBeInTheDocument();
    expect(screen.getByText(/Licensed/)).toBeInTheDocument();
    expect(
      screen.getByText(/days remaining|expires today/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('license-budget-bar')).toBeInTheDocument();
  });

  it('shows budget consumption in dollars (e.g. "$0.40 of $2.00")', () => {
    render(
      <LicenseStatusBadge
        dealId="x"
        license={makeActive({ costSpentCents: 40, costBudgetCentsStart: 200 })}
        loading={false}
      />
    );
    expect(
      screen.getByText(/\$0\.40 of \$2\.00 analytical budget used/i)
    ).toBeInTheDocument();
  });

  it('handles 100% budget consumed without crashing (cap is at the edge)', () => {
    render(
      <LicenseStatusBadge
        dealId="x"
        license={makeActive({ costSpentCents: 200, costBudgetCentsStart: 200 })}
        loading={false}
      />
    );
    expect(screen.getByTestId('license-badge-active')).toBeInTheDocument();
    expect(
      screen.getByText(/\$2\.00 of \$2\.00/i)
    ).toBeInTheDocument();
  });

  it('does not render dev-seed button when env flag is off (default)', () => {
    // We can't mutate import.meta.env at runtime; default in tests is
    // undefined → falsy → button hidden. This asserts the default path.
    render(
      <LicenseStatusBadge
        dealId="x"
        license={{ status: 'none' }}
        loading={false}
      />
    );
    expect(
      screen.queryByTestId('license-badge-dev-seed')
    ).not.toBeInTheDocument();
  });

  // ===== Status: expired =====

  it('renders muted chip when status=expired with re-license hint', () => {
    render(
      <LicenseStatusBadge
        dealId="x"
        license={{
          ...makeActive(),
          status: 'expired',
        } as LicenseStatusWire}
        loading={false}
      />
    );
    expect(screen.getByTestId('license-badge-expired')).toBeInTheDocument();
    expect(screen.getByText(/License expired/i)).toBeInTheDocument();
    expect(screen.getByText(/Re-license at \/pricing/i)).toBeInTheDocument();
  });

  it('renders muted chip when status=refunded', () => {
    render(
      <LicenseStatusBadge
        dealId="x"
        license={{
          ...makeActive(),
          status: 'refunded',
        } as LicenseStatusWire}
        loading={false}
      />
    );
    expect(screen.getByTestId('license-badge-refunded')).toBeInTheDocument();
    expect(screen.getByText(/License refunded/i)).toBeInTheDocument();
  });
});
