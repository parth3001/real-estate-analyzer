// Issue #243 (2026-07-12): the `no-restricted-syntax` block below
// enforces P10 — the single canonical strategy vocabulary. Raw kebab /
// SCREAMING / spaced / misspelled strategy literals are forbidden
// outside `backend/src/domain/strategy/**` and
// `frontend/src/domain/strategy/**`. Per-directory overrides whitelist
// legacy shapes that persist by design (Deal.ts wire, PipelineDeal, PDF
// pipeline enums, tier3 fixtures).
//
// Whitelist justifications (kept minimal per iteration-2 design):
//   - `backend/src/domain/strategy/**` / `frontend/src/domain/strategy/**`
//     — canonical modules; the alias tables live here.
//   - `backend/src/models/PipelineDeal.ts` /
//     `backend/src/controllers/pipelineController.ts` — separate
//     persistence layer with SCREAMING_SNAKE enum by design.
//   - `backend/src/tests/tier3/fixtures/**` — legacy fixture strings.
//   - `backend/src/models/Deal.ts` — legacy wire (kebab); projected
//     via `toLegacyDealStrategy`.
//   - `backend/src/types/pdf.types.ts` / `backend/src/services/pdfService.ts`
//     / `backend/src/controllers/pdfController.ts` — PDF pipeline enums;
//     sunset with wizard.
//   - `backend/src/models/SharedAnalysis.ts` /
//     `backend/src/models/AnonymousPdfRequest.ts` — persisted wire.
//   - `backend/src/services/dealMaterializationService.ts` — adapter
//     that writes to the legacy Deal shape via `toLegacyDealStrategy`.
//   - `backend/src/models/Analytics.ts` — persisted analytics wire
//     (kebab enum on Mongoose schema, LEGACY_WIRE tier).
//   - `frontend/src/types/property.ts` / `frontend/src/types/analysis.ts`
//     — legacy frontend types; sunset with wizard.
//   - `frontend/src/utils/strategyHelpers.ts` /
//     `frontend/src/components/common/StrategyBadge.tsx` — display
//     helpers keyed by kebab.
//   - `frontend/src/components/Chat/DealScoreCard.tsx` — mirrors wire
//     shape.
//   - `frontend/src/components/SFRAnalysis/**` /
//     `frontend/src/components/Calculator/**` — LEGACY wizard +
//     calculator UI, sunset with wizard.
//   - `**/__tests__/**` / `**/*.test.ts` / `**/*.test.tsx` — tests
//     assert on legacy shapes.
const STRATEGY_LITERAL_RESTRICTION = {
  selector:
    "Literal[value=/^(buy-hold|house-hack|BUY_HOLD|HOUSE_HACK|Buy & Hold|BRRR)$/]",
  message:
    "Issue #243 (P10) — use `normalizeStrategy` from `domain/strategy` " +
    'instead of raw strategy literals. `BRRR` (single R) is a misspelling; ' +
    'use `brrrr`. Kebab/SCREAMING/spaced values must land through the ' +
    'canonical normalizer.',
};

module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['react', '@typescript-eslint'],
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // Issue #243 (P10, iteration-2) — canonical strategy vocabulary
    // enforcement. Severity is `error` (not `warn`) so CI blocks on
    // any surviving kebab/SCREAMING/spaced literal in non-whitelisted
    // code. Package `lint` scripts also pass `--max-warnings=0` for
    // defense in depth.
    'no-restricted-syntax': ['error', STRATEGY_LITERAL_RESTRICTION],
  },
  overrides: [
    {
      // Whitelisted paths where legacy strategy literals persist by design.
      // Iteration-2 tightening (Issue #243 QE finding):
      //   - REMOVED `frontend/src/constants/sfrPropertyDefaults.ts`
      //     (refactored to canonical snake).
      //   - REMOVED `frontend/src/utils/analytics.ts` (refactored to
      //     route through toAnalyticsStrategyDimension).
      //   - ADDED `backend/src/models/Analytics.ts` (LEGACY_WIRE —
      //     persisted kebab enum, projected via toLegacyDealStrategy
      //     at write; read via normalizeStrategy at consumer).
      files: [
        'backend/src/domain/strategy/**',
        'frontend/src/domain/strategy/**',
        'backend/src/models/PipelineDeal.ts',
        'backend/src/controllers/pipelineController.ts',
        'backend/src/tests/tier3/fixtures/**',
        'backend/src/models/Deal.ts',
        'backend/src/models/Analytics.ts',
        'backend/src/types/pdf.types.ts',
        'backend/src/services/pdfService.ts',
        'backend/src/controllers/pdfController.ts',
        'backend/src/models/SharedAnalysis.ts',
        'backend/src/models/AnonymousPdfRequest.ts',
        'backend/src/services/dealMaterializationService.ts',
        'frontend/src/types/property.ts',
        'frontend/src/types/analysis.ts',
        'frontend/src/utils/strategyHelpers.ts',
        'frontend/src/components/common/StrategyBadge.tsx',
        'frontend/src/components/Chat/DealScoreCard.tsx',
        'frontend/src/components/SFRAnalysis/**',
        'frontend/src/components/Calculator/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
};
