/**
 * CritiqueCard — the "second opinion" panel on /analysis/:id.
 *
 * T1 (Issue #97 frontend, 2026-05-18).
 *
 * Renders the adversarial-critic output for a saved deal: two
 * personas (optimistic_flipper + skeptical_cpa) with their structured
 * disagreement (severity, divergence reasons, alternative assumptions).
 *
 * STRATEGIC ROLE
 * ──────────────
 *
 * Mike (Business Expert) named this the operational realization of
 * the discipline-layer positioning:
 *   "Most retail investors don't lose their first deal because of bad
 *    math. They lose it because nobody told them no."
 *
 * The DealScoreCard tells the user what the deal scored. The
 * CritiqueCard tells the user what TWO opinionated reviewers think the
 * engine got wrong — in BOTH directions (optimistic AND skeptical, so
 * the user sees the case for AND against, rather than a one-sided
 * scolding).
 *
 * STATES
 * ──────
 *
 *   - `loading`      — fetch in flight; subtle skeleton (no big spinner)
 *   - `pending`      — backend says "critique was supposed to run but
 *                       hasn't completed yet." Show a "Review in
 *                       progress…" placeholder so the user knows the
 *                       section exists and will populate
 *   - `complete`     — both personas rendered side-by-side
 *   - `unavailable`  — pre-T1 deal OR a deal where critique was skipped
 *                       (cost cap). Render NOTHING (no error) — the
 *                       SavedDealHero just doesn't show the section
 *
 * DESIGN
 * ──────
 *
 * Two-column layout on desktop, stacked on mobile. Apple-design
 * principles per CLAUDE.md: content over chrome. Severity is rendered
 * as a single colored bar + a short tag ("Mostly agrees" / "Significant
 * concerns" / "Strong disagreement") — not a raw 0-100 number, which
 * isn't intuitive.
 */

import { Box, Typography, Stack, Divider, Chip } from '@mui/material';
import { type CritiqueWire } from '../../services/api';

export interface CritiqueCardProps {
  critiques: CritiqueWire[];
  pending: boolean;
  /** True when the fetch is still in flight. Distinct from `pending`. */
  loading: boolean;
}

// ===== Helpers =====

/**
 * Persona display labels. Internal keys are snake_case; user-facing
 * strings have a softer, more human shape (per UX Designer principles).
 */
const PERSONA_LABEL: Record<CritiqueWire['persona'], string> = {
  optimistic_flipper: 'Optimistic Flipper',
  skeptical_cpa: 'Skeptical CPA',
};

/**
 * Severity buckets — translate 0-100 into a human label + color.
 * Discrete buckets are easier to scan than a continuous number.
 *
 *   0–20   → "Mostly agrees"        — neutral green
 *   20–50  → "Some concerns"        — amber
 *   50–80  → "Significant concerns" — orange
 *   80+    → "Strong disagreement"  — red
 */
function severityBucket(score: number, agrees: boolean): {
  label: string;
  color: string;
} {
  if (score < 20) {
    return {
      label: agrees ? 'Mostly agrees' : 'Slight disagreement',
      color: '#1B8B3A',
    };
  }
  if (score < 50) {
    return { label: 'Some concerns', color: '#A66700' };
  }
  if (score < 80) {
    return { label: 'Significant concerns', color: '#C04A00' };
  }
  return { label: 'Strong disagreement', color: '#C7261C' };
}

/** Sort personas so optimistic_flipper appears LEFT, skeptical_cpa RIGHT. */
function personaSortKey(p: CritiqueWire['persona']): number {
  return p === 'optimistic_flipper' ? 0 : 1;
}

// ===== Single-persona column =====

function PersonaColumn({ critique }: { critique: CritiqueWire }) {
  const sev = severityBucket(
    critique.severityScore,
    critique.agreementWithOriginal
  );
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 1.5, flexWrap: 'wrap' }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, color: 'text.primary' }}
        >
          {PERSONA_LABEL[critique.persona]}
        </Typography>
        <Chip
          label={sev.label}
          size="small"
          sx={{
            bgcolor: 'transparent',
            border: '1px solid',
            borderColor: sev.color,
            color: sev.color,
            fontWeight: 600,
            fontSize: 11,
            height: 22,
          }}
        />
      </Stack>

      {/* Divergence reasons — the WHY. Bulleted; tight spacing. */}
      {critique.divergenceReasons.length > 0 ? (
        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          {critique.divergenceReasons.map((reason, idx) => (
            <Typography
              key={`reason-${idx}`}
              component="li"
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {reason}
            </Typography>
          ))}
        </Stack>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: 'text.disabled',
            fontStyle: 'italic',
            fontSize: 13,
          }}
        >
          No specific divergences flagged.
        </Typography>
      )}

      {/* Alternative-assumption suggestions — the HOW-TO-FIX, if any.
          Compact list. The fieldPath is technical; we surface the
          reasoning sentence as the main content. */}
      {critique.alternativeAssumptions.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
              color: 'text.secondary',
              fontSize: 10,
              mb: 0.75,
            }}
          >
            Suggested adjustments
          </Typography>
          <Stack spacing={0.75}>
            {critique.alternativeAssumptions.map((alt, idx) => (
              <Box key={`alt-${idx}`}>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.primary', fontSize: 13, lineHeight: 1.4 }}
                >
                  <Box
                    component="span"
                    sx={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, monospace',
                      bgcolor: 'action.hover',
                      px: 0.5,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: 11,
                    }}
                  >
                    {alt.fieldPath}
                  </Box>{' '}
                  → {String(alt.suggestedValue)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: 12,
                    fontStyle: 'italic',
                  }}
                >
                  {alt.reasoning}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

// ===== Main component =====

export function CritiqueCard(props: CritiqueCardProps): React.JSX.Element | null {
  const { critiques, pending, loading } = props;

  // Unavailable state — pre-T1 deal or critique was skipped. Render
  // nothing. The SavedDealHero just won't show the section.
  if (!loading && !pending && critiques.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2.5,
      }}
      data-testid="critique-card"
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="baseline"
        sx={{ mb: 2 }}
      >
        <Typography
          variant="caption"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: 11,
          }}
        >
          Adversarial review
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', fontSize: 12 }}
        >
          Two reviewers argue with the engine — one bull, one bear
        </Typography>
      </Stack>

      {(loading || pending) && critiques.length === 0 ? (
        // Loading / pending placeholder. We don't show a heavy spinner —
        // the section is "secondary" content and shouldn't compete with
        // the DealScoreCard for visual weight.
        <Typography
          variant="body2"
          sx={{
            color: 'text.disabled',
            fontStyle: 'italic',
            fontSize: 13,
            py: 1,
          }}
        >
          {loading ? 'Loading review…' : 'Review in progress — refresh in a moment.'}
        </Typography>
      ) : (
        // Sorted so optimistic flipper is LEFT, skeptical CPA is RIGHT.
        // Responsive: side-by-side on desktop, stacked on mobile.
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          divider={
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: 'none', md: 'block' },
                borderColor: 'divider',
              }}
            />
          }
          spacing={{ xs: 2.5, md: 3 }}
        >
          {[...critiques]
            .sort((a, b) => personaSortKey(a.persona) - personaSortKey(b.persona))
            .map((c) => (
              <PersonaColumn key={c.persona} critique={c} />
            ))}
        </Stack>
      )}
    </Box>
  );
}
