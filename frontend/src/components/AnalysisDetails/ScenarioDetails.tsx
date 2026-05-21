/**
 * ScenarioDetails — per-scenario depth for the workspace (Task #8).
 *
 * Renders the SELECTED scenario's financials + long-term analysis from the
 * scenario-detail endpoint (AnalysisEvent payload). This is the depth that
 * replaces the legacy 11-tab "Deep Dive" — scoped to the selected scenario,
 * so switching scenarios re-points these numbers too (the whole point of
 * the scenario-scoped page).
 *
 * Collapsible sections (Apple progressive disclosure). Defensive field
 * access — substrate analysis payloads are loose Record shapes; missing
 * values render "–" rather than crashing.
 */

import { useState } from 'react';
import { Box, Typography, Collapse } from '@mui/material';
import type { ScenarioDetailWire } from '../../services/api';

export interface ScenarioDetailsProps {
  detail: ScenarioDetailWire | null;
}

const fmtCurrency = (v: unknown): string =>
  typeof v === 'number' && !Number.isNaN(v)
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v)
    : '–';

const fmtPct = (v: unknown): string =>
  typeof v === 'number' && !Number.isNaN(v) ? `${parseFloat(v.toFixed(2))}%` : '–';

const fmtRatio = (v: unknown): string =>
  typeof v === 'number' && !Number.isNaN(v) ? v.toFixed(2) : '–';

// IRR is stored as a decimal (e.g. 0.0608) — display as a percent.
const fmtIrr = (v: unknown): string =>
  typeof v === 'number' && !Number.isNaN(v)
    ? `${parseFloat((v * 100).toFixed(2))}%`
    : '–';

function num(o: Record<string, unknown> | undefined, k: string): unknown {
  return o ? o[k] : undefined;
}

export function ScenarioDetails({ detail }: ScenarioDetailsProps): React.JSX.Element | null {
  const [openSection, setOpenSection] = useState<string | null>('financials');

  if (!detail) return null;

  const m = (detail.metrics ?? {}) as Record<string, unknown>;
  const ma = (detail.monthlyAnalysis ?? {}) as Record<string, unknown>;
  const lt = (detail.longTermAnalysis ?? {}) as Record<string, unknown>;
  const returns = (lt.returns ?? {}) as Record<string, unknown>;
  const exit = (lt.exitAnalysis ?? {}) as Record<string, unknown>;

  const financials: Array<[string, string]> = [
    ['Monthly cash flow', fmtCurrency(num(ma, 'cashFlow'))],
    ['Cap rate', fmtPct(num(m, 'capRate'))],
    ['Cash-on-cash', fmtPct(num(m, 'cashOnCashReturn'))],
    ['DSCR', fmtRatio(num(m, 'dscr'))],
    ['Annual NOI', fmtCurrency(num(m, 'noi') ?? num(m, 'annualNOI'))],
  ];

  const longTerm: Array<[string, string]> = [
    ['Hold period', typeof lt.projectionYears === 'number' ? `${lt.projectionYears} yr` : '–'],
    ['IRR', fmtIrr(num(returns, 'irr'))],
    ['Total return', fmtCurrency(num(returns, 'totalReturn'))],
    ['Projected sale price', fmtCurrency(num(exit, 'projectedSalePrice'))],
    ['Net proceeds at exit', fmtCurrency(num(exit, 'netProceedsFromSale'))],
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 600,
          color: 'text.secondary',
          fontSize: 11,
          mb: 1,
        }}
      >
        Details · selected scenario
      </Typography>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Section
          title="Financials"
          open={openSection === 'financials'}
          onToggle={() => setOpenSection((s) => (s === 'financials' ? null : 'financials'))}
          rows={financials}
        />
        <Section
          title="Long-term"
          open={openSection === 'longterm'}
          onToggle={() => setOpenSection((s) => (s === 'longterm' ? null : 'longterm'))}
          rows={longTerm}
          borderTop
        />
      </Box>
    </Box>
  );
}

function Section({
  title,
  open,
  onToggle,
  rows,
  borderTop,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  rows: Array<[string, string]>;
  borderTop?: boolean;
}): React.JSX.Element {
  return (
    <Box sx={{ borderTop: borderTop ? '1px solid' : 'none', borderColor: 'divider' }}>
      <Box
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onToggle();
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{title}</Typography>
        <Box
          sx={{
            color: 'text.secondary',
            fontSize: 12,
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        >
          ▸
        </Box>
      </Box>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 2, pb: 1.5 }}>
          {rows.map(([label, value]) => (
            <Box
              key={label}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 0.5,
                borderTop: '1px solid',
                borderColor: 'grey.100',
              }}
            >
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
