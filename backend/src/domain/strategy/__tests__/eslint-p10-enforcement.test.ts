/**
 * ESLint P10 enforcement — red-team test (Issue #243 iteration-3, INV-6).
 *
 * @issue #243 (iteration-3, 2026-07-12) — DO NOT DELETE.
 *
 * The QE finding that reopened iteration-2 was: INV-6 shipped the
 * `no-restricted-syntax` rule but nothing proved it actually catches a
 * regression. This suite is that proof.
 *
 * Positive case: seed a fixture with a raw kebab literal in a
 *   NON-whitelisted path and assert eslint exits non-zero AND the
 *   output contains the P10 message substring.
 * Negative case: seed the same literal in a WHITELISTED path
 *   (`backend/src/models/Deal.ts`) and assert eslint exits zero — the
 *   whitelist is honored.
 * Misspelling case: `'BRRR'` (single R) — the specific alias the
 *   selector regex targets. Prove the tripwire fires on it.
 *
 * Fixtures are written to `os.tmpdir()` (positive) or as
 * `.eslint-fixture-<pid>.ts` files inside the target repo path
 * (negative — needed so the glob matches). Every fixture is unlinked
 * in `afterEach` via try/finally so a failed assertion never leaves
 * stragglers.
 *
 * The spawn uses `npx eslint --config <repo-root>/eslint.config.p10.js`
 * with `cwd: backend/`, mirroring the CI `p10-lint` job.
 */

import { execSync, execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const BACKEND_DIR = path.resolve(__dirname, '..', '..', '..', '..');
const P10_CONFIG = path.join(REPO_ROOT, 'eslint.config.p10.js');
const P10_MESSAGE_SUBSTRING = 'use `normalizeStrategy` from `domain/strategy`';

// Spawn eslint via the repo root's local install (walks up from
// backend/ via npm resolution). Returns { stdout, stderr, status } so
// each assertion can inspect the full output.
function runEslint(
  fixtureAbsPath: string
): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(
      'npx',
      [
        '--no-install',
        'eslint',
        '--config',
        P10_CONFIG,
        '--max-warnings=0',
        fixtureAbsPath,
      ],
      {
        cwd: BACKEND_DIR,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    const e = err as { status?: number; stdout?: string | Buffer; stderr?: string | Buffer };
    return {
      status: typeof e.status === 'number' ? e.status : -1,
      stdout: e.stdout ? e.stdout.toString() : '',
      stderr: e.stderr ? e.stderr.toString() : '',
    };
  }
}

// Detect eslint availability up front. If the developer runs this test
// on a fresh clone before `npm install` has hydrated the CLI, `npx`
// will fail with "npm ERR!" — surface that as a skip rather than a
// misleading failure. In CI (post `npm install`) this branch never
// runs.
let ESLINT_AVAILABLE = false;
try {
  execSync('npx --no-install eslint --version', {
    cwd: BACKEND_DIR,
    stdio: 'ignore',
  });
  ESLINT_AVAILABLE = true;
} catch {
  ESLINT_AVAILABLE = false;
}

const maybeDescribe = ESLINT_AVAILABLE ? describe : describe.skip;

maybeDescribe('ESLint P10 enforcement (Issue #243 INV-6, iteration-3)', () => {
  const createdFiles: string[] = [];

  afterEach(() => {
    for (const f of createdFiles) {
      try {
        fs.unlinkSync(f);
      } catch {
        /* fixture may already be unlinked; ignore */
      }
    }
    createdFiles.length = 0;
  });

  // ===== POSITIVE — non-whitelisted path with raw literal =====
  it('POSITIVE: raw kebab literal in a non-whitelisted path — exit non-zero + P10 message', () => {
    // Place fixture inside `backend/src/services/` (a non-whitelisted
    // directory per iteration-2's design). The `os.tmpdir()`
    // alternative would land outside eslint's base path and get
    // ignored — see iteration-3 design's fixture-placement note.
    const fixturePath = path.join(
      BACKEND_DIR,
      'src',
      'services',
      `__eslint_p10_positive_fixture_${process.pid}__.ts`
    );
    createdFiles.push(fixturePath);
    fs.writeFileSync(fixturePath, "const s = 'buy-hold';\nconsole.log(s);\n", 'utf8');

    const { status, stdout, stderr } = runEslint(fixturePath);
    const output = stdout + stderr;
    expect(status).not.toBe(0);
    expect(output).toContain(P10_MESSAGE_SUBSTRING);
  });

  // ===== POSITIVE — misspelling `'BRRR'` (single R) =====
  it('POSITIVE: misspelled `BRRR` literal (the specific alias the regex targets) — exit non-zero', () => {
    const fixturePath = path.join(
      BACKEND_DIR,
      'src',
      'services',
      `__eslint_p10_brrr_fixture_${process.pid}__.ts`
    );
    createdFiles.push(fixturePath);
    fs.writeFileSync(fixturePath, "const s = 'BRRR';\nconsole.log(s);\n", 'utf8');

    const { status, stdout, stderr } = runEslint(fixturePath);
    const output = stdout + stderr;
    expect(status).not.toBe(0);
    expect(output).toContain(P10_MESSAGE_SUBSTRING);
  });

  // ===== NEGATIVE — whitelisted path, same literal =====
  it('NEGATIVE: raw kebab literal INSIDE a whitelisted path (backend/src/models/Deal.ts) — exit zero', () => {
    // Deal.ts already contains kebab literals by design (legacy wire).
    // Rather than tamper with the real file, run eslint on it as-is
    // and assert the whitelist covers it — the file's existing content
    // is the assertion payload.
    const dealTs = path.join(BACKEND_DIR, 'src', 'models', 'Deal.ts');
    // Sanity: the file exists (defensive against a future rename).
    expect(fs.existsSync(dealTs)).toBe(true);

    const { status } = runEslint(dealTs);
    expect(status).toBe(0);
  });
});
