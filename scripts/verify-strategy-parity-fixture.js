#!/usr/bin/env node
/**
 * verify-strategy-parity-fixture.js — Issue #243 iteration-2 (2026-07-12).
 *
 * The backend and frontend keep a byte-copy of the shared strategy
 * normalizer parity fixture (JSON). This script hashes the `cases`
 * array of each copy and exits non-zero if they differ — the two
 * files' `$schema_note` fields may legitimately differ, but the
 * cases table MUST stay identical.
 *
 * INV-5 (FE/BE parity) is the operational invariant. Wire this into
 * CI (or a `pretest` script) so drift fails loudly.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BACKEND = path.resolve(
  __dirname,
  '..',
  'backend/src/domain/strategy/__fixtures__/strategyNormalizerCases.json'
);
const FRONTEND = path.resolve(
  __dirname,
  '..',
  'frontend/src/domain/strategy/__fixtures__/strategyNormalizerCases.json'
);

function hashCases(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(contents);
  if (!Array.isArray(parsed.cases)) {
    throw new Error(`${filePath}: 'cases' is not an array`);
  }
  const canonical = JSON.stringify(parsed.cases);
  return {
    hash: crypto.createHash('sha256').update(canonical).digest('hex'),
    canonical,
  };
}

function main() {
  const backend = hashCases(BACKEND);
  const frontend = hashCases(FRONTEND);
  if (backend.hash === frontend.hash) {
    console.log('[verify-strategy-parity-fixture] OK — cases table hash matches');
    console.log(`  sha256 = ${backend.hash}`);
    process.exit(0);
  }
  console.error(
    '[verify-strategy-parity-fixture] DRIFT DETECTED — INV-5 (FE/BE parity) violated'
  );
  console.error(`  backend  = ${BACKEND}`);
  console.error(`    sha256 = ${backend.hash}`);
  console.error(`  frontend = ${FRONTEND}`);
  console.error(`    sha256 = ${frontend.hash}`);
  console.error(
    '\nDiff hint (JSON.stringify of `cases` arrays — first difference):'
  );
  const bLen = backend.canonical.length;
  const fLen = frontend.canonical.length;
  const minLen = Math.min(bLen, fLen);
  let firstDiff = -1;
  for (let i = 0; i < minLen; i++) {
    if (backend.canonical[i] !== frontend.canonical[i]) {
      firstDiff = i;
      break;
    }
  }
  if (firstDiff >= 0) {
    const start = Math.max(0, firstDiff - 40);
    const end = firstDiff + 40;
    console.error(`  offset ${firstDiff}:`);
    console.error(`    backend  … ${backend.canonical.slice(start, end)}`);
    console.error(`    frontend … ${frontend.canonical.slice(start, end)}`);
  } else {
    console.error(`  size differs: backend=${bLen} chars, frontend=${fLen} chars`);
  }
  process.exit(1);
}

main();
