#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  srcDir: './frontend/src',
  fixableRules: {
    '@typescript-eslint/no-unused-vars': true,
    '@typescript-eslint/no-explicit-any': true,
    'no-console': true,
    'react/react-in-jsx-scope': true
  },
  typeCheckFiles: [
    'components/DealAnalysis/AnalysisResults.tsx',
    'components/DealAnalysis/DealForm.tsx',
    'pages/Dashboard.tsx'
  ]
};

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'error':
      console.error(`${colors.red}${prefix} ERROR: ${message}${colors.reset}`);
      break;
    case 'success':
      console.log(`${colors.green}${prefix} SUCCESS: ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}${prefix} WARNING: ${message}${colors.reset}`);
      break;
    default:
      console.log(`${colors.blue}${prefix} INFO: ${message}${colors.reset}`);
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

async function fixTypeScriptIssues() {
  log('Starting TypeScript fixes...');

  // 1. Fix ESLint auto-fixable issues
  log('Fixing ESLint issues...');
  runCommand(
    'cd frontend && npx eslint --fix "src/**/*.{ts,tsx}"',
    'Failed to fix ESLint issues'
  );

  // 2. Fix unused imports
  log('Fixing unused imports...');
  runCommand(
    'cd frontend && npx tsc --noEmit',
    'TypeScript compilation check failed'
  );

  // 3. Fix specific component issues
  for (const file of CONFIG.typeCheckFiles) {
    const filePath = path.join(CONFIG.srcDir, file);
    log(`Fixing ${file}...`);

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');

    // Apply fixes
    let newContent = content
      // Fix undefined checks
      .replace(/analysis\.aiInsights\./g, 'analysis.aiInsights?.')
      // Remove unused imports
      .replace(/import {[^}]+} from/g, (match) => {
        return match.split(',')
          .filter(imp => !imp.includes('unused'))
          .join(',');
      })
      // Fix type assertions
      .replace(/as any/g, '')
      // Add proper type annotations
      .replace(/function \w+\(/g, (match) => `${match}: void`);

    // Write back to file
    fs.writeFileSync(filePath, newContent);
  }

  // 4. Run type check again
  log('Running final type check...');
  const success = runCommand(
    'cd frontend && npx tsc --noEmit',
    'Final type check failed'
  );

  if (success) {
    log('All TypeScript issues fixed successfully!', 'success');
  } else {
    log('Some issues could not be fixed automatically. Manual review needed.', 'warning');
  }
}

// Add AI insights type guard
function addTypeGuards() {
  const filePath = path.join(CONFIG.srcDir, 'components/DealAnalysis/AnalysisResults.tsx');
  const content = fs.readFileSync(filePath, 'utf8');

  const typeGuards = `
  const isAIInsights = (insights: unknown): insights is AIInsights => {
    if (!insights || typeof insights !== 'object') return false;
    const i = insights as AIInsights;
    return (
      typeof i.investmentScore === 'number' &&
      Array.isArray(i.strengths) &&
      Array.isArray(i.weaknesses) &&
      Array.isArray(i.recommendations)
    );
  };

  const isMonthlyAnalysis = (analysis: unknown): analysis is MonthlyAnalysis => {
    if (!analysis || typeof analysis !== 'object') return false;
    const a = analysis as MonthlyAnalysis;
    return (
      a.income &&
      typeof a.income.gross === 'number' &&
      typeof a.income.effective === 'number' &&
      a.expenses &&
      typeof a.expenses.operating === 'number' &&
      typeof a.expenses.debt === 'number'
    );
  };
`;

  const newContent = content.replace(
    /interface AnalysisResultsProps/,
    `${typeGuards}\ninterface AnalysisResultsProps`
  );

  fs.writeFileSync(filePath, newContent);
}

// Main function
async function main() {
  log('🚀 Starting automatic TypeScript fixes');

  try {
    // 1. Add type guards
    log('Adding type guards...');
    addTypeGuards();

    // 2. Fix TypeScript issues
    await fixTypeScriptIssues();

    // 3. Run all checks
    log('Running final validation...');
    const success = runCommand(
      'cd frontend && node ../scripts/typecheck.js',
      'Final validation failed'
    );

    if (success) {
      log('✅ All fixes applied successfully!', 'success');
      process.exit(0);
    } else {
      log('⚠️ Some issues require manual review', 'warning');
      process.exit(1);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the script
main(); 