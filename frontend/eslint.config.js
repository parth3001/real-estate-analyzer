import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
// Issue #243 iteration-3 (2026-07-12): pull in the SLIM P10 rule +
// whitelist from the shared repo-root config so `npm run lint` in
// frontend also fires the P10 tripwire. This is belt-and-suspenders —
// CI gates on the scoped `lint:p10` script (which uses
// `eslint.config.p10.js`'s full default export directly), but
// developers running the default `npm run lint` here should also see
// P10 violations even when the 492 pre-existing errors (issue #258)
// are still present.
//
// NOTE: We import the SLIM `p10RuleOnly` variant, NOT the full config,
// because the surrounding `tseslint.configs.recommended` extension in
// this file already declares the `@typescript-eslint` plugin — ESLint
// 9 forbids two sibling configs declaring the same plugin key. The
// slim variant is JUST the rule + whitelist, no plugin registrations.
import p10Config from '../eslint.config.p10.js'
const p10RuleOnly = p10Config.p10RuleOnly

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // Spread the P10 layer at the END so its overrides (whitelist) win
  // over any earlier `no-restricted-syntax` config. `p10RuleOnly` is
  // an array of two config objects (rule + whitelist).
  ...p10RuleOnly,
)
