#!/usr/bin/env ts-node

/**
 * Documentation Validation Script
 * 
 * This script validates that documentation matches the actual implementation
 * to prevent drift between docs and code.
 * 
 * Run: npx ts-node scripts/validate-docs.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string[];
}

class DocumentationValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Validate that TypeScript interfaces mentioned in docs exist in code
   */
  async validateInterfaces(): Promise<ValidationResult> {
    console.log(`${colors.blue}Validating TypeScript interfaces...${colors.reset}`);
    
    const docsPath = path.join(__dirname, '../../docs');
    const srcPath = path.join(__dirname, '../src');
    
    // Read API.md to find documented interfaces
    const apiDoc = fs.readFileSync(path.join(docsPath, 'API.md'), 'utf-8');
    // Only match interface declarations in TypeScript code blocks
    const codeBlockRegex = /```typescript\n([\s\S]*?)\n```/g;
    const documentedInterfaces: string[] = [];
    
    let match;
    while ((match = codeBlockRegex.exec(apiDoc)) !== null) {
      const codeBlock = match[1];
      const interfaceMatches = codeBlock.match(/^\s*interface\s+(\w+)/gm) || [];
      interfaceMatches.forEach(interfaceMatch => {
        const name = interfaceMatch.match(/interface\s+(\w+)/)?.[1];
        if (name) documentedInterfaces.push(name);
      });
    }
    
    // Find actual TypeScript interfaces
    const actualInterfaces = new Set<string>();
    const findInterfaces = (dir: string) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.includes('node_modules')) {
          findInterfaces(filePath);
        } else if (file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const matches = content.match(/(?:export\s+)?interface\s+(\w+)/g) || [];
          matches.forEach(match => {
            const name = match.match(/interface\s+(\w+)/)?.[1];
            if (name) actualInterfaces.add(name);
          });
        }
      });
    };
    
    findInterfaces(srcPath);
    
    // Check for mismatches
    const missingInCode = documentedInterfaces.filter(name => !actualInterfaces.has(name));
    
    if (missingInCode.length > 0) {
      return {
        passed: false,
        message: 'Some documented interfaces not found in code',
        details: missingInCode
      };
    }
    
    return {
      passed: true,
      message: 'All documented interfaces exist in code'
    };
  }

  /**
   * Validate that API response examples match actual TypeScript types
   */
  async validateAPIResponses(): Promise<ValidationResult> {
    console.log(`${colors.blue}Validating API response schemas...${colors.reset}`);
    
    // Check keyMetrics structure
    const analysisTypePath = path.join(__dirname, '../src/types/analysis.ts');
    const analysisTypes = fs.readFileSync(analysisTypePath, 'utf-8');
    
    // Extract CommonMetrics fields
    const commonMetricsMatch = analysisTypes.match(/export interface CommonMetrics\s*{([^}]+)}/s);
    if (!commonMetricsMatch) {
      return {
        passed: false,
        message: 'CommonMetrics interface not found in analysis.ts'
      };
    }
    
    const commonMetricsFields = commonMetricsMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .map(line => line.split(':')[0].trim());
    
    // Required fields that must be in CommonMetrics
    const requiredFields = ['noi', 'capRate', 'cashOnCashReturn', 'irr', 'dscr', 'operatingExpenseRatio', 'totalInvestment'];
    const missingFields = requiredFields.filter(field => !commonMetricsFields.includes(field));
    
    if (missingFields.length > 0) {
      return {
        passed: false,
        message: 'CommonMetrics missing required fields',
        details: missingFields
      };
    }
    
    return {
      passed: true,
      message: 'API response schemas match TypeScript types'
    };
  }

  /**
   * Validate that no legacy JavaScript files are referenced in docs
   */
  async validateNoLegacyReferences(): Promise<ValidationResult> {
    console.log(`${colors.blue}Checking for legacy JavaScript references...${colors.reset}`);
    
    const docsPath = path.join(__dirname, '../../docs');
    const legacyFiles = [
      'analysis.js',
      'analysisService.js',
      'aiController.js',
      'storage.js'
    ];
    
    let foundReferences = false;
    const references: string[] = [];
    
    // Skip audit and cleanup documents
    const skipFiles = ['ARCHITECTURE_AUDIT', 'CLEANUP_PLAN'];
    
    const checkDirectory = (dir: string) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (skipFiles.some(skip => file.includes(skip))) return;
        
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          checkDirectory(filePath);
        } else if (file.endsWith('.md')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          legacyFiles.forEach(legacyFile => {
            if (content.includes(legacyFile)) {
              foundReferences = true;
              references.push(`${file} references ${legacyFile}`);
            }
          });
        }
      });
    };
    
    checkDirectory(docsPath);
    
    if (foundReferences) {
      return {
        passed: false,
        message: 'Found references to legacy JavaScript files',
        details: references
      };
    }
    
    return {
      passed: true,
      message: 'No legacy JavaScript references found'
    };
  }

  /**
   * Validate that all files in backend/src are TypeScript
   */
  async validateTypeScriptOnly(): Promise<ValidationResult> {
    console.log(`${colors.blue}Validating TypeScript-only codebase...${colors.reset}`);
    
    const srcPath = path.join(__dirname, '../src');
    const jsFiles: string[] = [];
    
    const findJSFiles = (dir: string) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          findJSFiles(filePath);
        } else if (file.endsWith('.js')) {
          jsFiles.push(path.relative(srcPath, filePath));
        }
      });
    };
    
    findJSFiles(srcPath);
    
    if (jsFiles.length > 0) {
      return {
        passed: false,
        message: 'Found JavaScript files in src directory',
        details: jsFiles
      };
    }
    
    return {
      passed: true,
      message: 'All source files are TypeScript'
    };
  }

  /**
   * Run all validations
   */
  async runAll(): Promise<void> {
    console.log(`\n${colors.yellow}=== Documentation Validation ===${colors.reset}\n`);
    
    const validations = [
      this.validateInterfaces(),
      this.validateAPIResponses(),
      this.validateNoLegacyReferences(),
      this.validateTypeScriptOnly()
    ];
    
    const results = await Promise.all(validations);
    
    let allPassed = true;
    
    results.forEach(result => {
      if (result.passed) {
        console.log(`${colors.green}✓ ${result.message}${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ ${result.message}${colors.reset}`);
        if (result.details) {
          result.details.forEach(detail => {
            console.log(`  - ${detail}`);
          });
        }
        allPassed = false;
      }
    });
    
    console.log('\n' + '='.repeat(40) + '\n');
    
    if (allPassed) {
      console.log(`${colors.green}All documentation validations passed!${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.red}Documentation validation failed!${colors.reset}`);
      console.log('Please update documentation to match implementation.');
      process.exit(1);
    }
  }
}

// Run validation
const validator = new DocumentationValidator();
validator.runAll().catch(error => {
  console.error(`${colors.red}Validation error:${colors.reset}`, error);
  process.exit(1);
});