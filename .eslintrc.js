// Issue #243 (2026-07-12): the `no-restricted-syntax` block below
// enforces P10 — the single canonical strategy vocabulary. Raw kebab /
// SCREAMING / spaced / misspelled strategy literals are forbidden
// outside `backend/src/domain/strategy/**` and
// `frontend/src/domain/strategy/**`. Per-directory overrides whitelist
// legacy shapes that persist by design (Deal.ts wire, PipelineDeal, PDF
// pipeline enums, tier3 fixtures).
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
    // Issue #243 (P10) — canonical strategy vocabulary enforcement.
    'no-restricted-syntax': ['warn', STRATEGY_LITERAL_RESTRICTION],
  },
  overrides: [
    {
      // Whitelisted paths where legacy strategy literals persist by design.
      files: [
        'backend/src/domain/strategy/**',
        'frontend/src/domain/strategy/**',
        'backend/src/models/PipelineDeal.ts',
        'backend/src/controllers/pipelineController.ts',
        'backend/src/tests/tier3/fixtures/**',
        'backend/src/models/Deal.ts',
        'backend/src/types/pdf.types.ts',
        'backend/src/services/pdfService.ts',
        'backend/src/controllers/pdfController.ts',
        'backend/src/models/SharedAnalysis.ts',
        'backend/src/models/AnonymousPdfRequest.ts',
        'backend/src/services/dealMaterializationService.ts',
        'frontend/src/types/property.ts',
        'frontend/src/types/analysis.ts',
        'frontend/src/utils/analytics.ts',
        'frontend/src/utils/strategyHelpers.ts',
        'frontend/src/components/common/StrategyBadge.tsx',
        'frontend/src/components/Chat/DealScoreCard.tsx',
        'frontend/src/constants/sfrPropertyDefaults.ts',
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
