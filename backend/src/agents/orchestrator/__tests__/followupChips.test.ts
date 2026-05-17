/**
 * followupChips — unit tests.
 *
 * The generator is a deterministic pure function; tests assert:
 *   1. Each routing branch returns its curated chip pool
 *   2. Chip count is 3-4 (the UX contract — Day 4 frontend assumes this)
 *   3. dealScoreCardEmitted toggles deal-scoring branch correctly
 *   4. No chip is empty / whitespace-only (would render a blank button)
 *   5. No chip embeds beginner-level copy (regression guard against
 *      the kind of "What's a cap rate?" copy the user explicitly
 *      rejected — see CLAUDE.md target-customer notes)
 *
 * The "no beginner copy" check is a substring blacklist — fragile vs
 * a model-graded eval, but cheap + deterministic, and big enough to
 * catch the obvious misses. If a chip legitimately needs to mention
 * a beginner term, expand the allowlist below.
 */

import { generateFollowupChips } from '../followupChips';
import type { RoutingTarget } from '../router';

// Substrings we never want to see in chip copy. The target user is
// experienced (3-30 deals/year per PRODUCT_CONTEXT.md); these phrases
// would insult them.
const BEGINNER_BLACKLIST = [
  "what's a cap rate",
  "what's a dscr",
  "what is cap rate",
  "what is an irr",
  'explain rental property',
  'beginner',
  "i'm new",
];

// Features we have not shipped yet — chips MUST NOT reference them or
// the user taps into a dead-end agent response.
//   - Strategy comparison: backlogged (Issue #101)
//   - Property-to-property comparison: Phase 4b (Issue #102)
// Restore these phrasings to the allowlist when the features ship.
const UNSHIPPED_FEATURE_BLACKLIST: Array<{ phrase: string; reason: string }> = [
  { phrase: 'buy-and-hold vs brrrr', reason: 'strategy comparison (Issue #101) backlogged' },
  { phrase: 'brrrr vs buy-and-hold', reason: 'strategy comparison (Issue #101) backlogged' },
  { phrase: 'compare two properties', reason: 'property comparison (Issue #102) not yet shipped' },
  { phrase: 'compare against my saved', reason: 'property comparison (Issue #102) not yet shipped' },
  { phrase: 'side-by-side', reason: 'property comparison (Issue #102) not yet shipped' },
  { phrase: 'alternative strategies', reason: 'strategy comparison (Issue #101) backlogged' },
];

function hasUnshippedFeatureCopy(chip: string): string | null {
  const lower = chip.toLowerCase();
  for (const { phrase, reason } of UNSHIPPED_FEATURE_BLACKLIST) {
    if (lower.includes(phrase)) return reason;
  }
  return null;
}

function isUsableChip(chip: string): boolean {
  return typeof chip === 'string' && chip.trim().length > 0;
}

function hasBeginnerCopy(chip: string): boolean {
  const lower = chip.toLowerCase();
  return BEGINNER_BLACKLIST.some((bad) => lower.includes(bad));
}

describe('generateFollowupChips', () => {
  describe('chip-pool contract (every branch)', () => {
    const branches: Array<{
      label: string;
      input: Parameters<typeof generateFollowupChips>[0];
    }> = [
      {
        label: 'agent:deal_scoring with card',
        input: {
          routingTarget: 'agent:deal_scoring' as RoutingTarget,
          dealScoreCardEmitted: true,
        },
      },
      {
        label: 'agent:deal_scoring without card',
        input: {
          routingTarget: 'agent:deal_scoring' as RoutingTarget,
          dealScoreCardEmitted: false,
        },
      },
      {
        label: 'agent:qa',
        input: {
          routingTarget: 'agent:qa' as RoutingTarget,
          dealScoreCardEmitted: false,
        },
      },
      {
        label: 'agent:adversarial_critic',
        input: {
          routingTarget: 'agent:adversarial_critic' as RoutingTarget,
          dealScoreCardEmitted: false,
        },
      },
      {
        label: 'deflection:off_topic',
        input: {
          routingTarget: 'deflection:off_topic' as RoutingTarget,
          dealScoreCardEmitted: false,
        },
      },
      {
        label: 'tool:resolve_property_inputs',
        input: {
          routingTarget: 'tool:resolve_property_inputs' as RoutingTarget,
          dealScoreCardEmitted: false,
        },
      },
      {
        label: 'fallback',
        input: {
          routingTarget: 'fallback' as RoutingTarget,
          dealScoreCardEmitted: false,
        },
      },
    ];

    branches.forEach(({ label, input }) => {
      it(`${label}: returns 3-4 usable chips, none beginner-grade, none unshipped`, () => {
        const { chips } = generateFollowupChips(input);
        expect(Array.isArray(chips)).toBe(true);
        expect(chips.length).toBeGreaterThanOrEqual(3);
        expect(chips.length).toBeLessThanOrEqual(4);
        for (const c of chips) {
          expect(isUsableChip(c)).toBe(true);
          expect(hasBeginnerCopy(c)).toBe(false);
          // Unshipped-feature guard — see UNSHIPPED_FEATURE_BLACKLIST.
          const unshipped = hasUnshippedFeatureCopy(c);
          if (unshipped !== null) {
            throw new Error(
              `Chip "${c}" references unshipped feature: ${unshipped}`
            );
          }
        }
      });
    });
  });

  describe('deal-scoring branch is card-aware', () => {
    it('returns different chips when card emitted vs not', () => {
      const withCard = generateFollowupChips({
        routingTarget: 'agent:deal_scoring',
        dealScoreCardEmitted: true,
      }).chips;
      const withoutCard = generateFollowupChips({
        routingTarget: 'agent:deal_scoring',
        dealScoreCardEmitted: false,
      }).chips;
      expect(withCard).not.toEqual(withoutCard);
    });

    it('after-card chip set surfaces depth (stress-test, projection, audit)', () => {
      const { chips } = generateFollowupChips({
        routingTarget: 'agent:deal_scoring',
        dealScoreCardEmitted: true,
      });
      const joined = chips.join(' ').toLowerCase();
      // Sanity: the platform-window-display capabilities are reflected.
      expect(joined).toMatch(/stress|7%|projection|audit|hold/);
    });
  });

  describe('off-topic deflection routes user back on-topic', () => {
    it('every chip references a real estate / platform action', () => {
      const { chips } = generateFollowupChips({
        routingTarget: 'deflection:off_topic',
        dealScoreCardEmitted: false,
      });
      const onTopicCues = [
        'property',
        'rental',
        'deal',
        'underwriting',
        'platform',
        'analy',
      ];
      for (const c of chips) {
        const lower = c.toLowerCase();
        const hit = onTopicCues.some((cue) => lower.includes(cue));
        expect(hit).toBe(true);
      }
    });
  });

  describe('tool routes', () => {
    it('matches tool:* prefix not just specific tool name', () => {
      // The chip generator should treat any `tool:*` route uniformly —
      // we don't curate per-tool chip pools yet (Phase 3 scope).
      const a = generateFollowupChips({
        routingTarget: 'tool:resolve_property_inputs' as RoutingTarget,
        dealScoreCardEmitted: false,
      }).chips;
      const b = generateFollowupChips({
        routingTarget: 'tool:profile_extraction' as RoutingTarget,
        dealScoreCardEmitted: false,
      }).chips;
      expect(a).toEqual(b);
    });
  });
});
