/**
 * Issue #243 iteration-3 (2026-07-12): the `no-restricted-syntax` block
 * below enforces P10 — the single canonical strategy vocabulary. Raw
 * kebab / SCREAMING / spaced / misspelled strategy literals are forbidden
 * outside `backend/src/domain/strategy/**` and
 * `frontend/src/domain/strategy/**`. Per-directory overrides whitelist
 * legacy shapes that persist by design (Deal.ts wire, PipelineDeal, PDF
 * pipeline enums, tier3 fixtures).
 *
 * WHY WE MIGRATED FROM `.eslintrc.js` TO FLAT CONFIG
 * ---------------------------------------------------
 * iteration-2 shipped `.eslintrc.js` (ESLint v8 legacy format), but
 * `frontend/package.json` had already been upgraded to eslint ^9.25.0
 * before this issue existed. ESLint 9 refuses to read `.eslintrc.*`
 * files and emits "ESLint couldn't find an eslint.config.(js|mjs|cjs)
 * file" — which meant the P10 gate was silently unenforced. This flat
 * config restores enforcement.
 *
 * The `.eslintrc.js` file is DELETED in the same commit (iteration-3);
 * leaving it behind would be dead confusion for future readers about
 * which config is authoritative.
 *
 * WHY WE ALSO SHIP `eslint.config.p10.js`
 * ---------------------------------------
 * `frontend/npm run lint` currently fails on 492 pre-existing errors
 * unrelated to P10 (see follow-up issue #258 for the cleanup work).
 * With `--max-warnings=0`, those errors would mask a new P10 regression.
 * The sibling `eslint.config.p10.js` contains ONLY the P10 rule, and
 * both packages' `lint:p10` scripts consume it — making the P10 CI
 * gate independent of the pre-existing lint debt.
 *
 * Whitelist justifications (kept minimal per iteration-2 design):
 *   - `backend/src/domain/strategy/**` / `frontend/src/domain/strategy/**`
 *     — canonical modules; the alias tables live here.
 *   - `backend/src/models/PipelineDeal.ts` /
 *     `backend/src/controllers/pipelineController.ts` — separate
 *     persistence layer with SCREAMING_SNAKE enum by design.
 *   - `backend/src/tests/tier3/fixtures/**` — legacy fixture strings.
 *   - `backend/src/models/Deal.ts` — legacy wire (kebab); projected
 *     via `toLegacyDealStrategy`.
 *   - `backend/src/types/pdf.types.ts` / `backend/src/services/pdfService.ts`
 *     / `backend/src/controllers/pdfController.ts` — PDF pipeline enums;
 *     sunset with wizard.
 *   - `backend/src/models/SharedAnalysis.ts` /
 *     `backend/src/models/AnonymousPdfRequest.ts` — persisted wire.
 *   - `backend/src/services/dealMaterializationService.ts` — adapter
 *     that writes to the legacy Deal shape via `toLegacyDealStrategy`.
 *   - `backend/src/models/Analytics.ts` — persisted analytics wire
 *     (kebab enum on Mongoose schema, LEGACY_WIRE tier).
 *   - `frontend/src/types/property.ts` / `frontend/src/types/analysis.ts`
 *     — legacy frontend types; sunset with wizard.
 *   - `frontend/src/utils/strategyHelpers.ts` /
 *     `frontend/src/components/common/StrategyBadge.tsx` — display
 *     helpers keyed by kebab.
 *   - `frontend/src/components/Chat/DealScoreCard.tsx` — mirrors wire
 *     shape.
 *   - `frontend/src/components/SFRAnalysis/**` /
 *     `frontend/src/components/Calculator/**` — LEGACY wizard +
 *     calculator UI, sunset with wizard.
 *   - `**\/__tests__/**` / `**\/*.test.ts` / `**\/*.test.tsx` — tests
 *     assert on legacy shapes.
 */

const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const globals = require('globals');
const p10 = require('./eslint.config.p10.js');

// STRATEGY_LITERAL_RESTRICTION is defined in eslint.config.p10.js and
// re-exported through the spread below. Keeping it in ONE place prevents
// selector/message drift between the two configs.

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/.cache/**',
      // The frontend has a colocated flat config already; leaving those
      // files to it avoids double-linting inside its Vite/React ruleset.
      // Their P10 rule is applied via the p10 spread there.
    ],
  },
  // Baseline JavaScript recommended rules — matches iteration-2's
  // `extends: ['eslint:recommended']`.
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Iteration-2's non-P10 baseline rules, ported one-for-one. We
      // deliberately keep this thin — the point of iteration-3 is P10
      // enforcement + red-team test, not a linter overhaul (see design
      // non-goals). Additional rule hardening is a separate backlog item.
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-unused-vars': 'off',
    },
  },
  // P10 rule + whitelist — spread from the shared p10 module so the two
  // configs stay in lock-step. If the whitelist or selector needs to
  // change, change it in `eslint.config.p10.js` only.
  ...p10,
];
