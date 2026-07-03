/**
 * numericTraceability — Issue #226 Session 4 (2026-07-03).
 *
 * Post-generation validation for LLM narrative output. Enforces the
 * deterministic-numbers principle at code level, not just at prompt
 * level.
 *
 * THE GAP THIS CLOSES
 * ───────────────────
 *
 * Session 3 established the principle via the QA agent's system
 * prompt: "the LLM never produces a numeric value about a specific
 * deal from its own reasoning; always call a tool." Prompt discipline
 * is the belt.
 *
 * But prompts drift. Under long context, complex reasoning, or a
 * novel question shape, the LLM may still emit a fabricated number.
 * Prompt alone gives us "usually deterministic." That's not the
 * institutional-grade claim.
 *
 * This validator is the suspenders. It scans the LLM's final output
 * for numeric literals ($X, X%, DSCR X, etc.) and cross-references
 * each against the values returned by tool calls in the same turn.
 * Untraceable numbers become suspicious findings. Suspicious findings
 * trigger a retry with a corrective prompt ("You emitted '$253,815'
 * but no tool returned that value. Use only tool outputs.") or a
 * fail-closed message ("I couldn't answer that reliably. Try
 * rephrasing.").
 *
 * SCOPE (v1)
 * ──────────
 *
 * - Extract candidate numeric literals via regex.
 * - Classify each as deal-specific (must trace) vs. allowed
 *   Category 2/3 (market ranges, reference facts) via hedge-phrase
 *   detection ("typically", "usually", "generally", "IRS", etc.).
 * - Cross-reference deal-specific candidates against tool return
 *   values with fuzzy match tolerance (formatting differences like
 *   $158,000 vs $158000 vs "158k" all resolve to the same underlying
 *   number).
 * - Return a report: { candidates, violations, allowedFromTools }.
 *
 * NOT IN SCOPE HERE
 * ─────────────────
 *
 * - Actually retrying the LLM. That's the agent runner's job — this
 *   service returns the report; runner decides what to do (retry
 *   with correction, fail closed, or accept).
 * - Rewriting the LLM output. Validation reports issues; the fix
 *   is another turn, not a mutation.
 */

/**
 * A single numeric literal found in the LLM's output.
 * Only meaningful when it can be traced to a source (or explicitly
 * hedged as Category 2/3).
 */
export interface NumericCandidate {
  /** The raw string as it appeared in the text (e.g., "$158,000"). */
  raw: string;
  /** Character offset where it appeared. */
  index: number;
  /** The unit we parsed. */
  unit: 'dollars' | 'percent' | 'ratio' | 'count' | 'unknown';
  /** The numeric value. */
  value: number;
  /**
   * If true, this literal appeared in a hedged phrase — "typically",
   * "usually", "IRS says", "the 27.5-year depreciation". Category 2/3
   * numbers don't need tool provenance.
   */
  isHedged: boolean;
  /** The ~40 characters of context around it (for report readability). */
  context: string;
}

/**
 * Trace result for a single candidate.
 */
export interface TraceResult {
  candidate: NumericCandidate;
  /** True if we found a matching value in tool returns OR the literal is hedged. */
  isTraceable: boolean;
  /** The tool call name that provided the match, if any. */
  matchedTool?: string;
  /** The specific value in the tool return we matched against. */
  matchedValue?: number;
}

/**
 * Full validation report.
 */
export interface TraceabilityReport {
  totalCandidates: number;
  traced: number;
  hedged: number;
  violations: TraceResult[];
  /** All numeric values discoverable in tool returns (for debugging). */
  toolReturnValues: number[];
}

/**
 * Values that came back from tool calls this turn. Each tool call's
 * output is passed in as an object; the validator flattens it and
 * pulls out every numeric leaf.
 */
export interface ToolReturn {
  toolName: string;
  output: unknown;
}

// ===== Extraction =====

/**
 * Regex patterns for numeric literals.
 *
 * Ordered by priority — most specific patterns first so they win
 * on overlap.
 */
const NUMERIC_PATTERNS: Array<{
  regex: RegExp;
  unit: NumericCandidate['unit'];
  parse: (match: string) => number;
}> = [
  // Dollar amounts: $1,234 or $1,234.56 or $1M or $1.5B
  {
    regex: /\$\s*([\d,]+(?:\.\d+)?)(?:\s*([kKmMbB]))?/g,
    unit: 'dollars',
    parse: (m) => {
      const cleaned = m.replace(/\$/g, '').replace(/,/g, '').trim();
      const numberPart = cleaned.replace(/[kKmMbB]/g, '');
      const suffix = cleaned.match(/[kKmMbB]/)?.[0]?.toLowerCase();
      let value = parseFloat(numberPart);
      if (suffix === 'k') value *= 1000;
      if (suffix === 'm') value *= 1_000_000;
      if (suffix === 'b') value *= 1_000_000_000;
      return value;
    },
  },
  // Percentages: 8.43% or 93% (no space)
  {
    regex: /([\d,]+(?:\.\d+)?)\s*%/g,
    unit: 'percent',
    parse: (m) => parseFloat(m.replace(/[,%]/g, '').trim()),
  },
  // DSCR / ratio phrases: "DSCR 1.20", "DSCR of 0.61", "ratio 1.5"
  {
    regex:
      /(?:DSCR|ratio|debt[- ]service coverage)\s+(?:of\s+)?(\d+(?:\.\d+)?)/gi,
    unit: 'ratio',
    parse: (m) => {
      const numMatch = m.match(/(\d+(?:\.\d+)?)/);
      return numMatch ? parseFloat(numMatch[1]) : NaN;
    },
  },
];

/**
 * ATTRIBUTION HEDGES — the sentence attributes the number to a source
 * or frames it as illustrative. Scanned in a WIDE backward window so
 * phrases like "IRS depreciation is 27.5 years" hedge the "27.5"
 * even when the marker sits at the start of the sentence.
 *
 * These are safe wide because attribution phrases don't normally leak
 * into unrelated deal-specific numbers.
 */
const ATTRIBUTION_HEDGES = [
  // Category 2 — market ranges / illustrative
  'typically',
  'usually',
  'generally',
  'often',
  'roughly',
  'about',
  'around',
  'approximately',
  'somewhere',
  'in the range of',
  'in this market',
  'in this area',
  'depending on',
  // Category 3 — reference facts / IRS / lender norms
  'irs',
  'section',
  'lenders require',
  'lenders typically',
  'lender minimum',
  'standard',
  'convention',
  'recapture',
  'depreciation',
  'fannie',
  'freddie',
  'hud',
];

/**
 * CONCEPT-NAME HEDGES — the number is part of a fixed idiomatic
 * concept name where the token IMMEDIATELY adjacent (or nearly so)
 * to the number tells you it's a rule reference, not a deal-specific
 * claim.
 *
 * Scanned in a TIGHT symmetric window (~15 chars). Wider windows let
 * legitimate deal-specific numbers in the same sentence as a rule
 * reference get spuriously hedged — e.g., "The 70% rule ceiling is
 * $253,815" should NOT hedge $253,815 just because "70% rule" appears
 * earlier in the sentence.
 */
const CONCEPT_NAME_HEDGES = [
  'the rule',
  '% rule', // "70% rule", "50% rule", "1% rule"
  '/30 rule',
  '/70 rule',
  '27.5 year',
  '27.5-year',
];

const ATTRIBUTION_WINDOW_BEFORE = 120;
const CONCEPT_WINDOW_AFTER = 8;

function detectHedge(
  text: string,
  position: number,
  matchLength: number
): boolean {
  const lower = text.toLowerCase();

  // Attribution hedges: check the backward window only.
  const attribBefore = Math.max(0, position - ATTRIBUTION_WINDOW_BEFORE);
  const attribWindow = lower.slice(attribBefore, position);
  if (ATTRIBUTION_HEDGES.some((m) => attribWindow.includes(m))) return true;

  // Concept-name hedges: FORWARD-ONLY 8-char window. The concept
  // token must immediately follow the number ("70% rule",
  // "27.5-year period"). Backward scan would let a rule reference
  // earlier in the sentence hedge every downstream deal-specific
  // number in the same sentence.
  const conceptEnd = Math.min(
    text.length,
    position + matchLength + CONCEPT_WINDOW_AFTER
  );
  const conceptWindow = lower.slice(position, conceptEnd);
  if (CONCEPT_NAME_HEDGES.some((m) => conceptWindow.includes(m))) return true;

  return false;
}

export function extractNumericCandidates(text: string): NumericCandidate[] {
  const found: NumericCandidate[] = [];
  const claimed = new Set<number>(); // char indexes already covered

  for (const { regex, unit, parse } of NUMERIC_PATTERNS) {
    // Fresh regex per iteration to reset lastIndex.
    const re = new RegExp(regex.source, regex.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      // Skip if this position already covered by a more specific pattern.
      let overlaps = false;
      for (const c of claimed) if (c >= start && c < end) overlaps = true;
      if (overlaps) continue;

      const raw = match[0];
      const value = parse(raw);
      if (!Number.isFinite(value)) continue;

      for (let i = start; i < end; i++) claimed.add(i);

      const contextStart = Math.max(0, start - 30);
      const contextEnd = Math.min(text.length, end + 30);
      const context = text.slice(contextStart, contextEnd);
      const isHedged = detectHedge(text, start, end - start);

      found.push({
        raw: raw.trim(),
        index: start,
        unit,
        value,
        isHedged,
        context,
      });
    }
  }

  return found.sort((a, b) => a.index - b.index);
}

// ===== Tool return value extraction =====

/**
 * Recursively flatten a tool return object into a set of every numeric
 * leaf value. Used to build the "provenance-provable" set for
 * cross-referencing.
 */
export function collectNumericValues(obj: unknown): number[] {
  const out: number[] = [];
  const visit = (v: unknown): void => {
    if (typeof v === 'number' && Number.isFinite(v)) {
      out.push(v);
      return;
    }
    if (typeof v === 'string') {
      // Strings can contain formatted numbers ("$158,000") — try to parse.
      const dollarMatch = v.match(/\$\s*([\d,]+(?:\.\d+)?)/);
      if (dollarMatch) {
        const n = parseFloat(dollarMatch[1].replace(/,/g, ''));
        if (Number.isFinite(n)) out.push(n);
      }
      const pctMatch = v.match(/([\d,]+(?:\.\d+)?)\s*%/);
      if (pctMatch) {
        const n = parseFloat(pctMatch[1].replace(/,/g, ''));
        if (Number.isFinite(n)) out.push(n);
      }
      return;
    }
    if (Array.isArray(v)) {
      for (const item of v) visit(item);
      return;
    }
    if (v !== null && typeof v === 'object') {
      for (const value of Object.values(v)) visit(value);
    }
  };
  visit(obj);
  return out;
}

// ===== Matching =====

/**
 * Two numbers "match" if they're within a small relative tolerance.
 * Handles formatting differences like $158,000 vs $158,000.00 vs
 * 158k rounding, but rejects fundamentally different values.
 */
export function numericMatch(a: number, b: number, tolerance = 0.005): boolean {
  if (a === b) return true;
  if (a === 0 || b === 0) {
    // Both zero or one-is-zero: strict equality only.
    return a === b;
  }
  const rel = Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b));
  return rel <= tolerance;
}

// ===== The validator =====

export function validateNumericTraceability(
  llmText: string,
  toolReturns: ToolReturn[]
): TraceabilityReport {
  const candidates = extractNumericCandidates(llmText);

  // Build the pool of numeric values from ALL tool returns.
  const toolValues: Array<{ toolName: string; value: number }> = [];
  for (const t of toolReturns) {
    for (const v of collectNumericValues(t.output)) {
      toolValues.push({ toolName: t.toolName, value: v });
    }
  }
  const uniqueToolValues = Array.from(new Set(toolValues.map((t) => t.value)));

  const results: TraceResult[] = candidates.map((candidate) => {
    if (candidate.isHedged) {
      return { candidate, isTraceable: true };
    }
    const match = toolValues.find((t) =>
      numericMatch(t.value, candidate.value)
    );
    if (match) {
      return {
        candidate,
        isTraceable: true,
        matchedTool: match.toolName,
        matchedValue: match.value,
      };
    }
    return { candidate, isTraceable: false };
  });

  const violations = results.filter((r) => !r.isTraceable);
  const traced = results.filter((r) => r.isTraceable && !r.candidate.isHedged)
    .length;
  const hedged = results.filter((r) => r.candidate.isHedged).length;

  return {
    totalCandidates: candidates.length,
    traced,
    hedged,
    violations,
    toolReturnValues: uniqueToolValues,
  };
}
