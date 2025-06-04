#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Simple colored console output
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`
};

// Configuration
const CONFIG = {
  srcDir: './frontend/src',
  typesDir: './frontend/src/types',
  excludeDirs: ['node_modules', 'build', 'dist'],
  rules: {
    noAny: true,
    noExplicitAny: true,
    noUnusedVars: true,
    strictNullChecks: true
  }
};

function log(message, type = 'info') {
  switch (type) {
    case 'info':
      console.log(colors.blue(message));
      break;
    case 'success':
      console.log(colors.green(message));
      break;
    case 'error':
      console.log(colors.red(message));
      break;
    case 'warning':
      console.log(colors.yellow(message));
      break;
    default:
      console.log(message);
  }
}

function runCommand(command, errorMessage) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(errorMessage, 'error');
    return false;
  }
}

function main() {
  log('🚀 Starting TypeScript Validation', 'info');
  let success = true;

  // Run ESLint
  log('\n📝 Running ESLint...', 'info');
  success = runCommand(
    'cd frontend && npx eslint --max-warnings 0 "src/**/*.{ts,tsx}"',
    '⚠️  ESLint found issues that need to be fixed.'
  ) && success;

  // Run TypeScript compilation check
  log('\n🔍 Running TypeScript compilation check...', 'info');
  success = runCommand(
    'cd frontend && npx tsc --noEmit',
    '⚠️  TypeScript compilation failed.'
  ) && success;

  // Check for proper imports
  log('\n📦 Checking imports...', 'info');
  success = runCommand(
    'cd frontend && npx madge --circular src',
    '⚠️  Circular dependencies detected.'
  ) && success;

  if (success) {
    log('\n✅ All checks passed successfully!', 'success');
    process.exit(0);
  } else {
    log('\n❌ Some checks failed. Please fix the issues above.', 'error');
    process.exit(1);
  }
}

main(); 