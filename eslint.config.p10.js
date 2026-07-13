/**
 * P10-only lint layer — do not add other rules; the point is that this
 * config can run clean in CI without being masked by unrelated legacy
 * noise (Issue #243 iteration-3 QE finding: full-suite lint has 492
 * pre-existing frontend errors that block --max-warnings=0 on any
 * combined config).
 *
 * Consumed by:
 *   - backend/package.json  `lint:p10` script
 *   - frontend/package.json `lint:p10` script
 *   - frontend/eslint.config.js (spread into the developer's default lint
 *     run so a plain `npm run lint` also fires the P10 rule)
 *   - .github/workflows/substrate-ci.yml `p10-lint` job (merge gate)
 *
 * This file's ONLY responsibility is the P10 `no-restricted-syntax`
 * tripwire from `/docs/ARCHITECTURE_PRINCIPLES.md` §P10 — the single
 * canonical strategy vocabulary rule. Adding baseline rules (no-console,
 * unused-vars, react/*) belongs in the FULL config (`eslint.config.js`).
 *
 * Selector regex + message text are byte-copied from the legacy
 * `.eslintrc.js` (iteration-2 shipped) so the migration is behavioral
 * no-op on the P10 rule itself.
 */

// Selector regex + message: verbatim from iteration-2's `.eslintrc.js`
// (see file header comment in `eslint.config.js` for the full context).
// Locked in as INV-6 by the iteration-3 design.
const STRATEGY_LITERAL_RESTRICTION = {
  selector:
    "Literal[value=/^(buy-hold|house-hack|BUY_HOLD|HOUSE_HACK|Buy & Hold|BRRR)$/]",
  message:
    "Issue #243 (P10) — use `normalizeStrategy` from `domain/strategy` " +
    'instead of raw strategy literals. `BRRR` (single R) is a misspelling; ' +
    'use `brrrr`. Kebab/SCREAMING/spaced values must land through the ' +
    'canonical normalizer.',
};

// Whitelist — byte-copied from iteration-2's `.eslintrc.js` overrides
// block. See that file's header comment (or the same block in
// `eslint.config.js`) for the per-path justification. Any change here
// MUST be mirrored in `eslint.config.js` to keep the two configs' P10
// surfaces identical.
//
// Each path is listed TWICE — once relative to the repo root (matches
// when eslint runs from `/` with e.g. `backend/src/models/Deal.ts`) and
// once relative to the subpackage (matches when the `lint:p10` scripts
// run from `backend/` or `frontend/` with `src/**/*.ts`). ESLint 9 flat
// config globs are matched against the resolved file path relative to
// the config's declared `basePath` (default: config file's directory),
// so a repo-root-anchored config only matches repo-root-anchored paths.
// The subpackage duplicates keep the P10 whitelist correct under either
// invocation without depending on ESLint internals.
// ADDITIONAL iteration-3 whitelist entries (over and above what
// iteration-2 shipped in `.eslintrc.js`):
//
//   - `frontend/src/types/pipeline.ts` — SCREAMING enum mirror of the
//     backend `models/PipelineDeal.ts` (already whitelisted). Same
//     separate persistence layer; iteration-2 whitelisted the backend
//     side but missed the frontend twin. INV-6 remediation.
//   - `frontend/src/pages/SFRAnalysis.tsx` — LEGACY wizard page (per
//     CANONICAL_SURFACES.yaml). Same category as `SFRAnalysis/**` which
//     iteration-2 already whitelisted; the top-level page file wasn't
//     covered by the `SFRAnalysis/**` glob.
//   - `frontend/src/pages/SampleAnalysisPage.tsx` — LEGACY sample-lookup
//     page (wizard-adjacent). Sunset with wizard.
//   - `frontend/src/pages/AnalysisDetails.tsx` — display-side page with
//     kebab→label mapping. Same category as `strategyHelpers.ts`.
//   - `frontend/src/components/AnalysisDetails/**` — display-variant
//     detectors keyed on the legacy kebab wire. Same category as
//     `strategyHelpers.ts`.
//   - `frontend/src/components/common/StrategyCard/**` — display card
//     with a kebab-typed `InvestmentStrategy` union. Same category as
//     `types/property.ts` / `components/common/StrategyBadge.tsx`.
//
// These were hidden by iteration-2's ESLint 9 config bug (see file
// header). Iteration-3 surfaces + whitelists them. Refactoring each to
// call `normalizeStrategy` is scope creep for iteration-3 and belongs
// in the frontend lint-debt sweep (issue #258).
const WHITELIST = [
  // Repo-root-relative (eslint run from repo root).
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
  'frontend/src/types/pipeline.ts',
  'frontend/src/utils/strategyHelpers.ts',
  'frontend/src/components/common/StrategyBadge.tsx',
  'frontend/src/components/common/StrategyCard/**',
  'frontend/src/components/Chat/DealScoreCard.tsx',
  'frontend/src/components/SFRAnalysis/**',
  'frontend/src/components/AnalysisDetails/**',
  'frontend/src/components/Calculator/**',
  'frontend/src/pages/SFRAnalysis.tsx',
  'frontend/src/pages/SampleAnalysisPage.tsx',
  'frontend/src/pages/AnalysisDetails.tsx',
  // Subpackage-relative (eslint run from backend/ or frontend/).
  'src/domain/strategy/**',
  'src/models/PipelineDeal.ts',
  'src/controllers/pipelineController.ts',
  'src/tests/tier3/fixtures/**',
  'src/models/Deal.ts',
  'src/models/Analytics.ts',
  'src/types/pdf.types.ts',
  'src/services/pdfService.ts',
  'src/controllers/pdfController.ts',
  'src/models/SharedAnalysis.ts',
  'src/models/AnonymousPdfRequest.ts',
  'src/services/dealMaterializationService.ts',
  'src/types/property.ts',
  'src/types/analysis.ts',
  'src/types/pipeline.ts',
  'src/utils/strategyHelpers.ts',
  'src/components/common/StrategyBadge.tsx',
  'src/components/common/StrategyCard/**',
  'src/components/Chat/DealScoreCard.tsx',
  'src/components/SFRAnalysis/**',
  'src/components/AnalysisDetails/**',
  'src/components/Calculator/**',
  'src/pages/SFRAnalysis.tsx',
  'src/pages/SampleAnalysisPage.tsx',
  'src/pages/AnalysisDetails.tsx',
  // Universal (path-agnostic — tests are recognized by suffix everywhere).
  '**/__tests__/**',
  '**/*.test.ts',
  '**/*.test.tsx',
];

// TypeScript parser — required so `.ts`/`.tsx` files parse into an AST
// that `no-restricted-syntax` can walk. Resolved via node module
// resolution from this file's location (repo root); must be installed
// as a devDependency of whichever package.json this config sees.
const tsParser = require('@typescript-eslint/parser');
// Registering the @typescript-eslint plugin (without enabling any of
// its rules) makes the codebase's existing
// `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
// comments valid — otherwise ESLint 9 flags them as "Definition for
// rule not found" errors under the p10-only config and defeats the
// point of a scoped lint. All rules stay OFF; the plugin is loaded
// solely so the rule NAMES are known.
const tsPlugin = require('@typescript-eslint/eslint-plugin');

// Stub plugin for `import/*` rules — the codebase uses
// `// eslint-disable-next-line import/first` in a handful of test files
// but `eslint-plugin-import` is not installed at the repo root (the
// P10-only config's whole point is to run WITHOUT the full lint stack).
// Registering the plugin with no-op rules stops ESLint 9 from flagging
// the disable comments as "Definition for rule not found" errors.
// Add new stub entries below only if new pre-existing disable comments
// appear in the tree — do NOT stub P10-adjacent rules.
const importStubPlugin = {
  rules: {
    first: { create: () => ({}) },
    order: { create: () => ({}) },
    'no-duplicates': { create: () => ({}) },
  },
};
const reactHooksStubPlugin = {
  rules: {
    'exhaustive-deps': { create: () => ({}) },
    'rules-of-hooks': { create: () => ({}) },
  },
};
const reactStubPlugin = {
  rules: {
    'no-unescaped-entities': { create: () => ({}) },
    'display-name': { create: () => ({}) },
  },
};

// ===== Two exported shapes =====
//
//   module.exports (the default) — full standalone config used by
//     `backend lint:p10` and `frontend lint:p10`. Includes parser +
//     plugin stubs so eslint runs correctly under `--config
//     eslint.config.p10.js` without a sibling config bringing plugins.
//
//   module.exports.p10RuleOnly — SLIM variant exposing ONLY the rule
//     definition + whitelist override (no plugin registrations, no
//     parser). Consumed by `frontend/eslint.config.js` because that
//     config's `tseslint.configs.recommended` extension already
//     declares `@typescript-eslint` (ESLint 9 forbids re-declaring the
//     same plugin key across sibling configs). Spreading the slim
//     variant avoids the ConfigError while still firing the P10 rule
//     when a developer runs plain `npm run lint` in frontend.

const P10_RULE_ENTRY = {
  files: ['**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': ['error', STRATEGY_LITERAL_RESTRICTION],
  },
};
const P10_WHITELIST_ENTRY = {
  // Whitelisted paths — legacy strategy literals persist by design
  // (Deal.ts wire, PipelineDeal, PDF pipeline enums, tier3 fixtures,
  // display helpers, tests). Turning off the rule per-file rather
  // than adding a blanket exception preserves the P10 gate everywhere
  // else in one atomic override block.
  files: WHITELIST,
  rules: {
    'no-restricted-syntax': 'off',
  },
};

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      // Pre-existing broken syntax — outside iteration-3 scope. Filed
      // as issue #258 (frontend lint debt cleanup). Do NOT extend this
      // ignore list; the P10 rule must apply to ALL live TS.
      'backend/src/tests/integration/issue76-ai-directive-validation.test.ts',
      'src/tests/integration/issue76-ai-directive-validation.test.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    linterOptions: {
      // Iteration-3 (P10-only scope): DO NOT flag unused eslint-disable
      // directives. Legacy code disables rules that live in the full
      // config (`eslint.config.js`); those directives are correct there
      // and irrelevant here. Flagging them would defeat the whole point
      // of a scoped lint (per iteration-2 QE finding).
      reportUnusedDisableDirectives: 'off',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importStubPlugin,
      'react-hooks': reactHooksStubPlugin,
      react: reactStubPlugin,
    },
  },
  P10_RULE_ENTRY,
  P10_WHITELIST_ENTRY,
];

// Slim variant: JUST the rule + whitelist, no plugins/parser. Safe to
// spread into a config that already declares `@typescript-eslint`.
module.exports.p10RuleOnly = [P10_RULE_ENTRY, P10_WHITELIST_ENTRY];
