module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jest/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module',
    project: 'tsconfig.json'
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'react-hooks',
    'jest'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    '@typescript-eslint/no-unused-expressions': ['error', {
      allowShortCircuit: true,
      allowTernary: true
    }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-console': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    'react/prop-types': 'off',
    '@typescript-eslint/no-inferrable-types': 'off'
  },
  globals: {
    window: true,
    document: true,
    localStorage: true,
    console: true,
    process: true,
    fetch: true,
    HTMLElement: true,
    HTMLInputElement: true,
    HTMLTextAreaElement: true,
    SVGElement: true,
    jest: true,
    expect: true,
    test: true,
    describe: true,
    beforeEach: true,
    afterEach: true,
    it: true,
    global: true
  },
  ignorePatterns: ['node_modules/', 'build/', 'dist/', 'coverage/']
}; 