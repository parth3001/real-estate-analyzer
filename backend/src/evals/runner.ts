/**
 * Eval harness — shared runner contract used by every eval surface.
 *
 * Per /docs/PRODUCT_2.0_EVALS.md.
 *
 * Three eval surfaces ship in wave-1 scaffolding:
 *
 *   eval-schema      Zod schema invariants across the 11 substrate
 *                    event types + the cost-events schema. Catches
 *                    schema regressions (someone makes a field required
 *                    or changes an enum) before they corrupt substrate.
 *
 *   eval-substrate   Tool chain → substrate roundtrip with a small
 *                    calibration regression set. Each fixture is a
 *                    (propertyData, expected dealQuality) pair. CI
 *                    rejects PRs that drift any fixture's score.
 *
 *   eval-extraction  profile_extraction golden set: (userInput,
 *                    expected extracted fields). Uses the stub
 *                    AnthropicAdapter — no live API in CI.
 *
 * Each runner script imports this module's helpers, defines a list of
 * cases, then calls runEvalSuite. The runner reports PASS/FAIL per case
 * with structured output, exits 0 on all-pass, 1 on any failure.
 *
 * INTENDED USE
 * ------------
 *
 * Wave-1 scaffolding intentionally ships with TINY fixture sets:
 *   - eval-schema:     ~3 fixtures per schema (positive + 2 negatives)
 *   - eval-substrate:  3 hand-built calibration fixtures
 *   - eval-extraction: 4 golden cases mirroring the manual test
 *
 * The 500-deal calibration regression set + 100-scenario Q&A golden
 * set ship post-wave-1 once the founder-historical backfill happens.
 * The HARNESS is what we need today — adding fixtures later doesn't
 * change the harness contract.
 */

// ===== Eval case shape =====

export interface EvalCase<TResult = void> {
  /** Human-readable name. Surfaces in PASS/FAIL output. */
  name: string;
  /**
   * The actual eval. Returns void on pass, throws on fail. May
   * optionally return a result object for the runner to log on pass.
   */
  run: () => Promise<TResult> | TResult;
}

// ===== Run a single eval =====

export interface EvalResultEntry {
  name: string;
  ok: boolean;
  error?: string;
  detail?: string;
  durationMs: number;
}

async function runOne<TResult>(
  c: EvalCase<TResult>
): Promise<EvalResultEntry> {
  const start = Date.now();
  try {
    const result = await c.run();
    return {
      name: c.name,
      ok: true,
      detail: result !== undefined ? String(result) : undefined,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name: c.name,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}

// ===== Suite runner =====

export interface EvalSuiteOptions {
  /** Suite name surfaced in the report header. */
  suiteName: string;
  /** Cases to run. */
  cases: EvalCase<unknown>[];
  /** Optional setup hook before any case runs. */
  setup?: () => Promise<void>;
  /** Optional teardown hook after all cases run. Always invoked. */
  teardown?: () => Promise<void>;
}

/**
 * Run a suite of eval cases sequentially. Prints a structured report
 * and returns the aggregate result. Caller decides on exit code.
 *
 * Cases run sequentially (not parallel) because most eval cases
 * touch shared state (mongodb-memory-server, module-level adapter
 * slots). Parallelism would be flake-prone for marginal speed gain
 * at wave-1 fixture sizes.
 */
export async function runEvalSuite(
  options: EvalSuiteOptions
): Promise<{ allPassed: boolean; results: EvalResultEntry[] }> {
  // Use process.stdout.write directly so callers that mute console.log
  // (e.g., to silence noisy legacy services) still see eval output.
  const out = (s: string): void => {
    process.stdout.write(s);
  };
  out(`\n===== EVAL: ${options.suiteName} =====\n`);

  try {
    if (options.setup) await options.setup();

    const results: EvalResultEntry[] = [];
    for (const c of options.cases) {
      const r = await runOne(c);
      results.push(r);
      const icon = r.ok ? '✅' : '❌';
      const dur = `${r.durationMs}ms`.padStart(7);
      out(`${icon}  ${dur}  ${r.name}\n`);
      if (!r.ok && r.error) out(`           ↳ ${r.error}\n`);
      if (r.ok && r.detail) out(`           ↳ ${r.detail}\n`);
    }

    const passed = results.filter((r) => r.ok).length;
    const total = results.length;
    const allPassed = passed === total;
    out(`\n${allPassed ? '✅' : '❌'}  ${passed}/${total} cases passed.\n`);
    out('='.repeat(46 + options.suiteName.length) + '\n');

    return { allPassed, results };
  } finally {
    if (options.teardown) {
      try {
        await options.teardown();
      } catch (err) {
        console.error(
          `Teardown error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }
}

// ===== Assertion helpers (no Jest dependency) =====

/** Throws if the supplied predicate is false. Used inside case `run`. */
export function evalAssert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/** Throws if a and b are not strictly equal. */
export function evalAssertEq<T>(a: T, b: T, message: string): void {
  if (a !== b) {
    throw new Error(`${message} — expected ${String(b)}, got ${String(a)}`);
  }
}

/**
 * Asserts that the supplied function THROWS. Optionally checks the
 * error message contains a substring.
 */
export async function evalAssertThrows(
  fn: () => unknown | Promise<unknown>,
  messageContains?: string
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (messageContains) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes(messageContains)) {
        throw new Error(
          `Expected error to contain "${messageContains}", got "${msg}"`
        );
      }
    }
    return; // Threw as expected
  }
  throw new Error('Expected function to throw, but it returned normally');
}
