/**
 * fix-issue.js — Persona-orchestrated pipeline for ALL substantive work.
 *
 * As of 2026-07-08 this is the default process for features / changes /
 * bug fixes / arch work. Not just Task #50 issues.
 *
 * Base pipeline (always):
 *   Architect (design) → Engineer (code) → QE (validate) → Business Expert (signoff)
 *
 * Supplementary personas (opt-in per invocation via `personas: [...]`):
 *   ux · mobile · tax · marketing · strategic
 *
 * Each supplementary reviewer runs AFTER Business Expert signoff. Their
 * verdicts are BLOCKING — a REJECT sends work back to Architect same as
 * QE/BE. Use supplementary personas when the work touches their domain:
 *   - ux        : any user-facing UI change (workspace / chat / wizard)
 *   - mobile    : mobile-visible changes, bundle size, Core Web Vitals
 *   - tax       : depreciation / 1031 / compliance / tax narrative
 *   - marketing : landing / pricing / onboarding / conversion surfaces
 *   - strategic : pricing / GTM / AI moat / Track boundary decisions
 *
 * Loop policy: up to 3 iterations. Any failure loops back to Architect
 * (who decides whether to revise the design or tighten the spec for
 * Engineer). Business Expert AND every supplementary persona have hard
 * veto. After 3 failed iterations, workflow surfaces to the user.
 *
 * Invocations:
 *   Workflow({ name: 'fix-issue', args: '#243' })                              // base 4 personas
 *   Workflow({ name: 'fix-issue', args: { issue: '#243' } })                   // same, structured
 *   Workflow({ name: 'fix-issue', args: { issue: '#243', personas: ['ux'] } })  // + UX signoff
 *   Workflow({ name: 'fix-issue', args: { issue: '#280', personas: ['ux', 'mobile'] } })  // + both
 *
 * Requirement: every invocation MUST reference an existing issue entry in
 * docs/ISSUE_TRACKER.md. File the issue first with the required schema,
 * then invoke the pipeline. This preserves provenance (principle P21).
 *
 * Exemptions (pipeline NOT required):
 *   - docs-only changes (*.md files)
 *   - comment-only edits
 *   - typo fixes / single-line copy tweaks
 *   - lint/prettier autofixes
 *
 * If in doubt, invoke the pipeline. Overhead beats regression.
 */

export const meta = {
  name: 'fix-issue',
  description: '5-phase pipeline: Pre-flight audit → Architect → Engineer → QE → Business Expert. Pre-flight maps current-state so Architect designs against reality, not stale docs. BE has veto. Up to 3 iterations then escalates.',
  phases: [
    { title: 'Pre-flight · current-state audit' },
    { title: 'Architect · design' },
    { title: 'Engineer · implement' },
    { title: 'QE · validate' },
    { title: 'Business Expert · signoff' },
  ],
}

// ==================== SCHEMAS (structured tool outputs) ====================

const PREFLIGHT_SCHEMA = {
  type: 'object',
  required: [
    'summary',
    'existingPatterns',
    'relatedTests',
    'recentActivity',
    'relatedIssues',
    'gotchas',
  ],
  properties: {
    summary: {
      type: 'string',
      description: '3-5 sentence description of the current state around the issue',
    },
    existingPatterns: {
      type: 'array',
      description:
        'Similar patterns, normalizers, helpers, or projectors already in the code that Architect should reuse rather than reimplement',
      items: {
        type: 'object',
        required: ['path', 'description', 'reuseAdvice'],
        properties: {
          path: { type: 'string' },
          description: { type: 'string' },
          reuseAdvice: {
            type: 'string',
            description: 'How Architect should relate the new design to this existing pattern (reuse / extend / replace / ignore)',
          },
        },
      },
    },
    relatedTests: {
      type: 'array',
      description:
        'Existing tests that establish conventions (fixtures, mocks, structure) Engineer should match',
      items: {
        type: 'object',
        required: ['path', 'convention'],
        properties: {
          path: { type: 'string' },
          convention: {
            type: 'string',
            description: 'What pattern/convention this test demonstrates',
          },
        },
      },
    },
    recentActivity: {
      type: 'array',
      description:
        'Commits in the last 30 days touching the files referenced by the issue',
      items: {
        type: 'object',
        required: ['sha', 'message', 'filesTouched'],
        properties: {
          sha: { type: 'string' },
          message: { type: 'string' },
          filesTouched: { type: 'array', items: { type: 'string' } },
          relevance: {
            type: 'string',
            description: 'How this commit relates to the current issue',
          },
        },
      },
    },
    relatedIssues: {
      type: 'array',
      description:
        'Other filed issues in ISSUE_TRACKER.md that touch overlapping code',
      items: {
        type: 'object',
        required: ['number', 'title', 'howItRelates'],
        properties: {
          number: { type: 'string', description: 'e.g. "#250"' },
          title: { type: 'string' },
          howItRelates: {
            type: 'string',
            description:
              'Overlap in files / concepts / design decisions that should be coordinated',
          },
        },
      },
    },
    gotchas: {
      type: 'array',
      description:
        'Things Architect must NOT miss: load-bearing conventions, existing invariants, tests that could break, migration hazards',
      items: { type: 'string' },
    },
  },
}

const DESIGN_SCHEMA = {
  type: 'object',
  required: ['summary', 'filesToChange', 'invariants', 'migrationPath', 'nonGoals'],
  properties: {
    summary: {
      type: 'string',
      description: '2-3 sentence description of what changes and why',
    },
    filesToChange: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'change'],
        properties: {
          path: { type: 'string' },
          change: { type: 'string', description: 'Concrete description of what to change' },
        },
      },
    },
    invariants: {
      type: 'array',
      items: { type: 'string' },
      description: 'Assertions that MUST hold after the fix. Each will become a test.',
    },
    migrationPath: {
      type: 'string',
      description: 'Single commit or phased rollout',
    },
    nonGoals: {
      type: 'array',
      items: { type: 'string' },
      description: 'What this fix explicitly does NOT solve',
    },
    rejectPreviousWork: {
      type: 'boolean',
      description: 'True if previous iteration was fundamentally wrong (only meaningful iter 2+)',
    },
  },
}

const IMPL_SCHEMA = {
  type: 'object',
  required: [
    'summary',
    'filesModified',
    'testsAdded',
    'tscClean',
    'testsPassed',
    'commitSha',
  ],
  properties: {
    summary: { type: 'string' },
    filesModified: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'description'],
        properties: {
          path: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    testsAdded: {
      type: 'array',
      items: { type: 'string', description: 'Test file + test name' },
    },
    tscClean: { type: 'boolean' },
    testsPassed: { type: 'boolean' },
    commitSha: { type: 'string' },
    deviationsFromDesign: {
      type: 'string',
      description: 'Empty if none; otherwise describe why implementation deviated',
    },
  },
}

const QE_SCHEMA = {
  type: 'object',
  required: [
    'verdict',
    'addressesFailureMode',
    'regressionTestsPresent',
    'invariantsHold',
    'reasoning',
  ],
  properties: {
    verdict: { enum: ['PASS', 'FAIL'] },
    addressesFailureMode: {
      type: 'object',
      required: ['answer', 'evidence'],
      properties: {
        answer: { type: 'boolean' },
        evidence: { type: 'string', description: 'Cite specific code + line' },
      },
    },
    regressionTestsPresent: {
      type: 'object',
      required: ['answer', 'evidence'],
      properties: {
        answer: { type: 'boolean' },
        evidence: { type: 'string', description: 'Cite specific test that would fail if bug returns' },
      },
    },
    invariantsHold: {
      type: 'array',
      items: {
        type: 'object',
        required: ['invariant', 'holds'],
        properties: {
          invariant: { type: 'string' },
          holds: { type: 'boolean' },
        },
      },
    },
    brokenInvariants: {
      type: 'array',
      items: { type: 'string' },
      description: 'Existing invariants/tests the fix broke',
    },
    coverageGaps: {
      type: 'array',
      items: { type: 'string' },
    },
    reasoning: { type: 'string' },
  },
}

const BE_SCHEMA = {
  type: 'object',
  required: ['verdict', 'realUserScenarios', 'reasoning'],
  properties: {
    verdict: { enum: ['SIGNOFF', 'CONCERNS'] },
    realUserScenarios: {
      type: 'array',
      items: {
        type: 'object',
        required: ['scenario', 'outcome', 'businessCorrect'],
        properties: {
          scenario: { type: 'string' },
          outcome: { type: 'string' },
          businessCorrect: { type: 'boolean' },
        },
      },
    },
    marketingClaimAlignment: {
      type: 'string',
      description: 'Institutional-grade / deterministic / honest analysis — any drift?',
    },
    concerns: {
      type: 'array',
      items: { type: 'string' },
    },
    reasoning: { type: 'string' },
  },
}

// ==================== PROMPTS ====================

function preflightPrompt(issueNumber) {
  return `You are a read-only research agent. Your job is to map the CURRENT-STATE of the reanalyzr-2.0 codebase around issue ${issueNumber} so the Architect designs against reality, not stale docs.

Steps:

1. Read the issue.
   Run: grep -A 40 "^### Issue ${issueNumber}:" /Users/parthpatel/real-estate-analyzer/docs/ISSUE_TRACKER.md
   Note the Component + Description + Proposed Solution sections.

2. For every file / concept the issue mentions, find EXISTING PATTERNS.
   For each file:line in the Component section, read ±30 lines of context.
   Then grep the wider codebase for similar patterns already in use:
     - If the issue is about a normalizer / enum / adapter, grep for other normalizers (e.g., "canonicalAddressKey", "normalizeStrategy", "resolveDealIdentity")
     - If the issue is about a projector / view / read boundary, grep for existing projectors
     - If the issue is about a wire-shape / Zod schema, grep for existing schema conventions
   Report each existing pattern with a reuseAdvice: reuse / extend / replace / ignore.

3. Find RELATED TESTS.
   For each file the fix will likely touch, find at least one adjacent test that Engineer should mirror for conventions. Grep for test file names matching the file being modified (e.g., resolve_property_inputs.ts → resolve_property_inputs.test.ts). Report path + convention (mongodb-memory-server pattern, fixture pattern, mock style, etc.).

4. Check RECENT ACTIVITY.
   For each file the issue references, run: git log --oneline --since="30 days ago" -- <file>
   Report each commit's SHA + message + files-touched + relevance to the current issue. If a recent commit already partially addressed the concern OR made it worse, flag it.

5. Find RELATED ISSUES.
   grep the tracker for issues that touch overlapping files or concepts:
     Run: grep -E "^### Issue #[0-9]+" /Users/parthpatel/real-estate-analyzer/docs/ISSUE_TRACKER.md
     Then grep specific issue bodies for the file paths + key terms from ${issueNumber}
   Report at most 6 most-relevant open issues with howItRelates (overlap category: same files / same concepts / same design decision that must coordinate).

6. Identify GOTCHAS.
   Read CLAUDE.md's "Core Architectural Principles" section quickly. Read /docs/ARCHITECTURE_PRINCIPLES.md. What load-bearing conventions must the fix respect that aren't obvious from the issue alone? Examples: existing schema versioning, migration paths for legacy events, test conventions, edge cases that historically caused regressions.

Do NOT design the fix. Do NOT propose changes. This is pure current-state mapping.

Return via PREFLIGHT_SCHEMA. Length target: 600-1200 words in the JSON payload. Be specific — Architect will pattern-match on your exact citations.`
}

function architectPrompt(issueNumber, iteration, feedback, preflight) {
  const iterationBlock = iteration === 1 ? '' : `

⚠️  This is iteration ${iteration}. Previous iteration failed.

Previous feedback: ${feedback}

Revise the design. If the failure was in DESIGN, produce a fundamentally different approach (set rejectPreviousWork: true). If the failure was in IMPLEMENTATION (Engineer misinterpreted), tighten the design spec so misinterpretation is impossible.
`

  return `You are the Principal Software Architect defined in /Users/parthpatel/real-estate-analyzer/CLAUDE.md — 18 years experience, financial services + real estate.

Task: design a fix for issue ${issueNumber}.

Step 1 — Read YOUR persona checklist AND the system principles.
  Read /Users/parthpatel/real-estate-analyzer/docs/personas/architect.md IN FULL — this is your persona rulebook (ARCH-1 through ARCH-19).
  Then read /Users/parthpatel/real-estate-analyzer/docs/ARCHITECTURE_PRINCIPLES.md IN FULL — system-level principles P1-P25.
  Every design decision must be defensible against BOTH lists.

Step 2 — Absorb the pre-flight audit.
  The pre-flight agent has already surveyed the current-state of the codebase around this issue. READ IT CAREFULLY before designing anything. Especially:
    - existingPatterns[] — DO NOT reimplement patterns that already exist. Extend or reuse per each item's reuseAdvice.
    - relatedTests[] — mirror these conventions in what you tell Engineer to build
    - recentActivity[] — recent commits may have changed the picture since the issue was filed
    - relatedIssues[] — flag any design decision that MUST coordinate with those issues (as non-goals or design invariants)
    - gotchas[] — every one must be addressed or listed as a non-goal
  If the pre-flight surfaces a pattern that fully addresses the issue already, your design might just be "wire consumers to the existing pattern" — no new abstractions.

Pre-flight audit:
${JSON.stringify(preflight, null, 2)}

Step 3 — Read the issue.
  Run: grep -A 30 "^### Issue ${issueNumber}:" /Users/parthpatel/real-estate-analyzer/docs/ISSUE_TRACKER.md
  Read the full entry including its "Component", "Description", "Business Impact", "Proposed Solution", and "Related" sections.

Step 4 — Read the code.
  For every file:line-range mentioned in Component + Description, read that file (at least ±20 lines around the referenced line).
  For every existingPattern the pre-flight identified, read that pattern's file so you understand its shape.
  Read related callers/consumers if the issue is about drift or wire-shape.

Step 5 — Design the fix.
  Verify the design against every APPLICABLE principle in ARCHITECTURE_PRINCIPLES.md. Cite the principle numbers in your reasoning (e.g., "per P1 Single Source of Truth, this consolidates the three computation sites into one projector call").
  For any principle you consciously chose NOT to apply, list it as a non-goal WITH REASONING.
  Do not scope-creep — the fix must match the issue.
  Coordinate with pre-flight relatedIssues[] — if your design touches code #N will also touch, note the coordination boundary as an invariant or non-goal.

Return via the DESIGN_SCHEMA structured output. Be specific: filesToChange must name files that exist and describe changes concretely. Invariants must be testable assertions. NonGoals must call out what an over-eager engineer might otherwise attempt AND every principle intentionally skipped AND every pre-flight gotcha you consciously deferred.
${iterationBlock}
Do NOT modify code. Design only.`
}

function engineerPrompt(issueNumber, design) {
  return `You are the Senior Full-Stack Engineer defined in /Users/parthpatel/real-estate-analyzer/CLAUDE.md — 15 years, React/Node.js, financial calculations.

Step 1 — Read YOUR persona checklist.
  Read /Users/parthpatel/real-estate-analyzer/docs/personas/engineer.md IN FULL — ENG-1 through ENG-21 are your rules. Also skim /Users/parthpatel/real-estate-analyzer/docs/ARCHITECTURE_PRINCIPLES.md for the system principles you must uphold in implementation (especially P2 Financial Precision, P22 no auto-server, P23 no git add -A).

Task: implement the Architect's design for issue ${issueNumber}.

Architect's design:
${JSON.stringify(design, null, 2)}

Constraints:
  - Implement EXACTLY per design. No scope creep. No refactoring beyond design.
  - Follow CLAUDE.md's Single Source of Truth principle
  - NO Math.round / toFixed / Math.floor in analyzer code (Financial Precision Principle)
  - Add tests as design's invariants require — each invariant becomes at least one test
  - Working directory: /Users/parthpatel/real-estate-analyzer
  - Branch: reanalyzr-2.0 (main is frozen)

Steps:
  1. Make code changes per design
  2. Add tests per invariants
  3. Run: cd backend && npx tsc --noEmit  (must exit 0)
  4. Run: cd frontend && npx tsc --noEmit  (must exit 0 if frontend files touched)
  5. Run: cd backend && npx jest <affected test paths> --silent  (must all pass)
  6. Stage the specific files (git add <path> — never git add -A)
  7. Commit with message: "fix(${issueNumber}): <one-line summary>"
     Include design summary in commit body. Co-authored by Claude.

Return via IMPL_SCHEMA. Include the commit SHA (from git log --oneline -1). Set deviationsFromDesign to a non-empty string ONLY if you deviated and explain why — otherwise leave empty.`
}

function qePrompt(issueNumber, design, impl) {
  return `You are the Senior QE Engineer defined in /Users/parthpatel/real-estate-analyzer/CLAUDE.md — 20 years, financial testing, Amazon AWS + Zillow.

Step 1 — Read YOUR persona checklist AND system principles.
  Read /Users/parthpatel/real-estate-analyzer/docs/personas/qe-engineer.md IN FULL — QE-1 through QE-15 are your rules.
  Then read /Users/parthpatel/real-estate-analyzer/docs/ARCHITECTURE_PRINCIPLES.md IN FULL — you validate against every applicable principle P1-P25.

Task: adversarially validate Engineer's fix for issue ${issueNumber}. Your job is to FIND GAPS, not to sign off.

Issue: ${issueNumber} (read full entry from /Users/parthpatel/real-estate-analyzer/docs/ISSUE_TRACKER.md via grep as Architect did).

Architect's design:
${JSON.stringify(design, null, 2)}

Engineer's implementation:
${JSON.stringify(impl, null, 2)}

Read every file in impl.filesModified. Read the commit at impl.commitSha (git show).

Also read /Users/parthpatel/real-estate-analyzer/docs/ARCHITECTURE_PRINCIPLES.md IN FULL — you validate against every applicable principle, not just the invariants Architect enumerated.

Verify:
  1. addressesFailureMode: does the code actually prevent the SPECIFIC failure mode described in the issue's Description section? Cite the specific line + explain how it prevents the failure.
  2. regressionTestsPresent: is there a test that would FAIL if this bug returned? Cite the specific test (file + test name). Not just related tests — this exact bug.
  3. invariantsHold: for EACH invariant Architect specified, verify it's actually enforced by the implementation. If it's supposed to be a test, verify the test exists and passes.
  4. brokenInvariants: does the fix break any existing tests or documented invariants? Run cd backend && npx jest --silent + cd frontend && npx tsc --noEmit and check.
  5. principlesUpheld: for EACH principle P1-P25 that applies to this fix, verify the implementation upholds it. Any violation that Architect did NOT explicitly call out as a non-goal = FAIL. Add violated principles to brokenInvariants with "PRINCIPLE Pn: <name>".
  6. coverageGaps: is there a variant of the failure mode that isn't covered?

Verdict: PASS only if (addressesFailureMode.answer && regressionTestsPresent.answer && all invariantsHold && brokenInvariants is empty). FAIL otherwise.

Bias toward FAIL. It's cheaper to loop than to ship a fix that misses.

Return via QE_SCHEMA.`
}

function bePrompt(issueNumber, design, impl, qeReport) {
  return `You are the Business Expert defined in /Users/parthpatel/real-estate-analyzer/CLAUDE.md — 20-year real estate investor, $10M+ AUM, 35+ properties, invested at every scale from single SFR to commercial.

Step 1 — Read YOUR persona checklist AND your owned principles.
  Read /Users/parthpatel/real-estate-analyzer/docs/personas/business-expert.md IN FULL — BE-1 through BE-11 are your rules.
  Read /Users/parthpatel/real-estate-analyzer/docs/ARCHITECTURE_PRINCIPLES.md sections II (Trust & Determinism). You own P5-P8 — Deterministic Numbers, Language Hygiene, Honest Analysis is the Moat, Score-only Display.

Task: final signoff on the fix for issue ${issueNumber}. QE has passed the technical check. Your job is to VETO if the fix is technically correct but business-wrong.

Read:
  - Issue ${issueNumber} from /Users/parthpatel/real-estate-analyzer/docs/ISSUE_TRACKER.md
  - Engineer's summary of changes: ${JSON.stringify(impl.summary)}
  - QE's report: ${JSON.stringify(qeReport)}

Also read /Users/parthpatel/real-estate-analyzer/docs/ARCHITECTURE_PRINCIPLES.md — you own principles P5 (Deterministic Numbers), P6 (Language Hygiene), P7 (Honest Analysis is the Moat), P8 (Score-only display), P25 (Data Validation).

Now simulate what a paying investor sees:

  1. Enumerate 2-3 REAL-USER SCENARIOS where this feature/bug matters. For each, describe what the user does and what outcome they see after the fix. Judge whether the outcome is business-correct (not just test-correct).

  2. Check marketing claims + your owned principles:
     - P5 Deterministic Numbers: does every number surfaced originate from a tool call?
     - P6 Language Hygiene: any banned verdict words? Directive advisory language?
     - P7 Honest Analysis: silver-lining framing on load-bearing failures?
     - P8 Score display only: any verdict badges, next-step CTAs derived from score?
     - "Institutional-grade deterministic analysis" — does the fix maintain this?
     - "Honest analysis is the moat" — does it produce honest scoring / narratives?

  3. Would an experienced BRRRR / buy-hold investor spot any lingering issue that the technical fix didn't address?

  4. Any real-world scenarios the design didn't consider? (e.g., regulatory, market convention, lender behavior, investor expectations)

Verdict: SIGNOFF only if every real-user scenario is business-correct AND marketing claims still hold AND no lingering issues. Otherwise CONCERNS.

CONCERNS = veto. Design goes back to Architect with your concerns as feedback.

Be strict. This is the last gate before the fix reaches paying users.

Return via BE_SCHEMA.`
}

// ==================== SUPPLEMENTARY PERSONAS ====================

const SUPPLEMENTARY_SCHEMA = {
  type: 'object',
  required: ['verdict', 'reasoning'],
  properties: {
    verdict: { enum: ['SIGNOFF', 'REJECT'] },
    concerns: {
      type: 'array',
      items: { type: 'string' },
    },
    reasoning: { type: 'string' },
    domainSpecificFindings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['finding', 'severity'],
        properties: {
          finding: { type: 'string' },
          severity: { enum: ['blocking', 'warning', 'nit'] },
        },
      },
    },
  },
}

const SUPPLEMENTARY_PERSONAS = {
  ux: {
    label: 'UX Designer',
    file: 'ux-designer.md',
    prefix: 'UX',
    ruleRange: 'UX-1 through UX-23',
    domain: 'user-facing UI — workspace / chat / wizard / form flows',
    focus:
      'Apple design philosophy (UX-1..5), information hierarchy (UX-6..8, UX-15..16), voice discipline including no directive language / no BUY-PASS badges (UX-11, UX-18), accessibility (UX-12, WCAG 2.1 AA), typography including tabular nums for financial data (UX-13..14).',
  },
  mobile: {
    label: 'Mobile Developer (Sterling)',
    file: 'mobile-developer.md',
    prefix: 'MOB',
    ruleRange: 'MOB-1 through MOB-56',
    domain: 'anything mobile-visible — touch targets, Core Web Vitals, bundle size, offline behavior, property-tour usage',
    focus:
      'Touch target minimums (MOB-1, ≥48px), Core Web Vitals budgets (MOB-6..8), REanalyzr-specific perf budgets (MOB-9..11), bundle size limits (MOB-12..14), offline-first capabilities (MOB-24..29), the key mobile questions (MOB-39..45). Hard-block on MOB-6..14 violations regardless of other reviewers.',
  },
  tax: {
    label: 'Tax Expert (CPA)',
    file: 'tax-expert.md',
    prefix: 'TAX',
    ruleRange: 'TAX-1 through TAX-14',
    domain: 'depreciation, 1031 exchange, hold-period tax, state tax, tax narrative / educational content',
    focus:
      'Depreciation accuracy including 27.5-year residential (TAX-13) and 25% recapture (TAX-2), 1031 timing rules (TAX-3), calculation accuracy vs professional software (TAX-5), and compliance disclaimers (TAX-6..8). TAX-6/7/8 violations are hard blockers regardless of other reviewer signoffs.',
  },
  marketing: {
    label: 'Marketing Expert',
    file: 'marketing-expert.md',
    prefix: 'MKT',
    ruleRange: 'MKT-1 through MKT-29',
    domain: 'landing / pricing / onboarding / conversion / activation surfaces / signup flow / email',
    focus:
      'Pricing structure (MKT-1..3), conversion optimization (MKT-4, MKT-6, MKT-8..9), retention benchmarks (MKT-17..20), voice discipline (MKT-25..29). Every claim / metric / benchmark in the fix MUST have a validated source per CLAUDE.md CRITICAL RULE — no invented numbers.',
  },
  strategic: {
    label: 'Strategic Product Advisor (Marcus Chen)',
    file: 'strategic-product-advisor.md',
    prefix: 'STRAT',
    ruleRange: 'STRAT-1 through STRAT-45',
    domain: 'pricing / packaging / GTM channel / AI moat construction / Track 1/2/3 boundary decisions',
    focus:
      'AI product moat (STRAT-18..19, STRAT-43), substrate discipline (STRAT-24), category timing (STRAT-20..21), pricing philosophy (STRAT-6, STRAT-35..36), REanalyzr constraints (STRAT-37..40, STRAT-45). Hard block on STRAT-37 (do not touch released assets) or STRAT-38 violations (Track 1/2/3 boundary).',
  },
}

function supplementaryPrompt(personaKey, issueNumber, design, impl, qeReport, beReport) {
  const p = SUPPLEMENTARY_PERSONAS[personaKey]
  if (!p) throw new Error(`Unknown supplementary persona: ${personaKey}`)

  return `You are the ${p.label} defined in /Users/parthpatel/real-estate-analyzer/CLAUDE.md.

Step 1 — Read YOUR persona checklist.
  Read /Users/parthpatel/real-estate-analyzer/docs/personas/${p.file} IN FULL. Your rules are ${p.ruleRange}.
  Also skim /Users/parthpatel/real-estate-analyzer/docs/ARCHITECTURE_PRINCIPLES.md for any principle that applies to your domain.

Task: domain review for issue ${issueNumber}. The base pipeline (Architect + Engineer + QE + Business Expert) has already signed off. Your job is to check the fix against YOUR domain (${p.domain}).

Focus: ${p.focus}

Issue: ${issueNumber} — read full entry from /Users/parthpatel/real-estate-analyzer/docs/ISSUE_TRACKER.md via grep.

Architect's design:
${JSON.stringify(design, null, 2)}

Engineer's implementation:
${JSON.stringify(impl, null, 2)}

QE Report:
${JSON.stringify(qeReport, null, 2)}

Business Expert Report:
${JSON.stringify(beReport, null, 2)}

Read every file in impl.filesModified that touches your domain. Read the commit at impl.commitSha (git show).

Verify:
  1. Does the implementation uphold every applicable ${p.prefix}-N rule from your persona file?
  2. For rules Architect did NOT explicitly call out as non-goals — are any violated?
  3. Are there domain-specific concerns the base pipeline (which focuses on backend correctness + trust guardrails) would miss?
  4. Any real-world scenarios in your domain that the design didn't consider?

Verdict: SIGNOFF only if all applicable rules hold AND no domain-specific concerns block shipping. Otherwise REJECT.

REJECT sends the design back to Architect with your concerns as feedback. Be strict — your veto is the last defense in your domain.

Return via the SUPPLEMENTARY_SCHEMA structured output.`
}

// ==================== ARG PARSING ====================

function parseArgs(rawArgs) {
  if (rawArgs === null || rawArgs === undefined) {
    throw new Error(
      'fix-issue requires args. Example: { name: "fix-issue", args: "#243" } or { args: { issue: "#243", personas: ["ux"] } }'
    )
  }

  let issue, personas
  if (typeof rawArgs === 'string') {
    issue = rawArgs.trim()
    personas = []
  } else if (typeof rawArgs === 'object') {
    issue = String(rawArgs.issue ?? '').trim()
    personas = Array.isArray(rawArgs.personas) ? rawArgs.personas.map((p) => String(p).toLowerCase().trim()) : []
  } else {
    throw new Error(`fix-issue args must be a string or object; got ${typeof rawArgs}`)
  }

  if (!issue) {
    throw new Error('fix-issue requires an issue number. See ISSUE_TRACKER.md.')
  }

  const normalizedIssue = issue.startsWith('#') ? issue : `#${issue}`

  const unknownPersonas = personas.filter((p) => !SUPPLEMENTARY_PERSONAS[p])
  if (unknownPersonas.length > 0) {
    throw new Error(
      `Unknown supplementary personas: ${unknownPersonas.join(', ')}. Valid options: ${Object.keys(SUPPLEMENTARY_PERSONAS).join(', ')}`
    )
  }

  return { issue: normalizedIssue, personas }
}

// ==================== MAIN LOOP ====================

const MAX_ITERATIONS = 3
const parsed = parseArgs(args)
const normalizedIssue = parsed.issue
const supplementaryPersonas = parsed.personas

log(`Starting fix-issue pipeline for ${normalizedIssue}`)
if (supplementaryPersonas.length > 0) {
  log(`Supplementary personas: ${supplementaryPersonas.map((p) => SUPPLEMENTARY_PERSONAS[p].label).join(', ')}`)
}

// ===== Phase 0 — Pre-flight (runs ONCE, before the iteration loop) =====
// The pre-flight audit maps current-state of the codebase around the issue so
// Architect designs against reality, not stale docs. Runs once per pipeline
// invocation because current-state doesn't change during design iterations.
// Read-only Explore agent — fast, cheap, thorough.
phase('Pre-flight · current-state audit')
const preflight = await agent(preflightPrompt(normalizedIssue), {
  label: 'preflight',
  schema: PREFLIGHT_SCHEMA,
  agentType: 'Explore',
})

if (!preflight) {
  log('Pre-flight returned null. Aborting.')
  return {
    status: 'ESCALATE_TO_USER',
    reason: 'Pre-flight audit failed to produce a current-state map',
  }
}

log(
  `Pre-flight complete: ${preflight.existingPatterns?.length ?? 0} existing patterns, ${preflight.relatedIssues?.length ?? 0} related issues, ${preflight.gotchas?.length ?? 0} gotchas flagged`
)

let iteration = 1
let design = null
let impl = null
let qeReport = null
let beReport = null
let feedback = null
let history = []

while (iteration <= MAX_ITERATIONS) {
  log(`--- Iteration ${iteration}/${MAX_ITERATIONS} ---`)

  // Phase 1 — Architect
  phase('Architect · design')
  design = await agent(architectPrompt(normalizedIssue, iteration, feedback, preflight), {
    label: `architect${iteration > 1 ? ` (iter ${iteration})` : ''}`,
    schema: DESIGN_SCHEMA,
    agentType: 'general-purpose',
  })

  if (!design) {
    log(`Iteration ${iteration}: Architect returned null. Aborting.`)
    return {
      status: 'ESCALATE_TO_USER',
      reason: 'Architect agent failed to produce a design',
      iteration,
      history,
    }
  }

  // Phase 2 — Engineer
  phase('Engineer · implement')
  impl = await agent(engineerPrompt(normalizedIssue, design), {
    label: `engineer${iteration > 1 ? ` (iter ${iteration})` : ''}`,
    schema: IMPL_SCHEMA,
    agentType: 'general-purpose',
  })

  if (!impl) {
    log(`Iteration ${iteration}: Engineer returned null. Aborting.`)
    return {
      status: 'ESCALATE_TO_USER',
      reason: 'Engineer agent failed to produce an implementation',
      iteration,
      design,
      history,
    }
  }

  if (!impl.tscClean || !impl.testsPassed) {
    feedback = `Engineer's iteration ${iteration} failed technical checks: tscClean=${impl.tscClean}, testsPassed=${impl.testsPassed}. Deviations: ${impl.deviationsFromDesign ?? 'none reported'}. Tighten the design spec so Engineer can implement it correctly.`
    history.push({ iteration, phase: 'engineer-tech-fail', design, impl })
    log(`Iteration ${iteration}: Engineer tech checks failed. Looping back to Architect.`)
    iteration++
    continue
  }

  // Phase 3 — QE
  phase('QE · validate')
  qeReport = await agent(qePrompt(normalizedIssue, design, impl), {
    label: `qe${iteration > 1 ? ` (iter ${iteration})` : ''}`,
    schema: QE_SCHEMA,
    agentType: 'general-purpose',
  })

  if (!qeReport) {
    log(`Iteration ${iteration}: QE returned null. Aborting.`)
    return {
      status: 'ESCALATE_TO_USER',
      reason: 'QE agent failed to produce a report',
      iteration,
      design,
      impl,
      history,
    }
  }

  if (qeReport.verdict === 'FAIL') {
    feedback = `QE iteration ${iteration} FAILED. Reasoning: ${qeReport.reasoning}. Addresses failure mode: ${qeReport.addressesFailureMode?.answer} (${qeReport.addressesFailureMode?.evidence}). Regression tests present: ${qeReport.regressionTestsPresent?.answer} (${qeReport.regressionTestsPresent?.evidence}). Broken invariants: ${(qeReport.brokenInvariants ?? []).join('; ') || 'none'}. Coverage gaps: ${(qeReport.coverageGaps ?? []).join('; ') || 'none'}.`
    history.push({ iteration, phase: 'qe-fail', design, impl, qeReport })
    log(`Iteration ${iteration}: QE FAILED. Looping back to Architect with QE feedback.`)
    iteration++
    continue
  }

  // Phase 4 — Business Expert (has veto even if QE passed)
  phase('Business Expert · signoff')
  beReport = await agent(bePrompt(normalizedIssue, design, impl, qeReport), {
    label: `be${iteration > 1 ? ` (iter ${iteration})` : ''}`,
    schema: BE_SCHEMA,
    agentType: 'general-purpose',
  })

  if (!beReport) {
    log(`Iteration ${iteration}: BE returned null. Aborting.`)
    return {
      status: 'ESCALATE_TO_USER',
      reason: 'Business Expert agent failed to produce a report',
      iteration,
      design,
      impl,
      qeReport,
      history,
    }
  }

  if (beReport.verdict === 'CONCERNS') {
    feedback = `Business Expert VETOED iteration ${iteration}. Reasoning: ${beReport.reasoning}. Concerns: ${(beReport.concerns ?? []).join('; ') || 'see reasoning'}. Marketing claim alignment: ${beReport.marketingClaimAlignment}. Real-user scenarios that failed: ${(beReport.realUserScenarios ?? []).filter((s) => !s.businessCorrect).map((s) => `[${s.scenario} → ${s.outcome}]`).join('; ') || 'none flagged specifically'}.`
    history.push({ iteration, phase: 'be-veto', design, impl, qeReport, beReport })
    log(`Iteration ${iteration}: BE VETOED. Looping back to Architect with BE concerns.`)
    iteration++
    continue
  }

  // ==================== Supplementary personas ====================
  // Run in sequence after BE signoff. Any REJECT loops back to Architect.
  // Reports accumulated on the iteration record so Architect (in loop 2+)
  // has full context on which domain rejected and why.
  const supplementaryReports = {}
  let supplementaryRejected = false

  for (const personaKey of supplementaryPersonas) {
    const p = SUPPLEMENTARY_PERSONAS[personaKey]
    phase(`${p.label} · signoff`)
    const report = await agent(
      supplementaryPrompt(personaKey, normalizedIssue, design, impl, qeReport, beReport),
      {
        label: `${personaKey}${iteration > 1 ? ` (iter ${iteration})` : ''}`,
        schema: SUPPLEMENTARY_SCHEMA,
        agentType: 'general-purpose',
      }
    )

    if (!report) {
      log(`Iteration ${iteration}: ${p.label} returned null. Aborting.`)
      return {
        status: 'ESCALATE_TO_USER',
        reason: `${p.label} agent failed to produce a report`,
        iteration,
        design,
        impl,
        qeReport,
        beReport,
        supplementaryReports,
        history,
      }
    }

    supplementaryReports[personaKey] = report

    if (report.verdict === 'REJECT') {
      feedback = `${p.label} REJECTED iteration ${iteration}. Reasoning: ${report.reasoning}. Concerns: ${(report.concerns ?? []).join('; ') || 'see reasoning'}. Blocking findings: ${(report.domainSpecificFindings ?? []).filter((f) => f.severity === 'blocking').map((f) => f.finding).join('; ') || 'see reasoning'}.`
      history.push({
        iteration,
        phase: `${personaKey}-reject`,
        design,
        impl,
        qeReport,
        beReport,
        supplementaryReports,
      })
      log(`Iteration ${iteration}: ${p.label} REJECTED. Looping back to Architect.`)
      supplementaryRejected = true
      break
    }
  }

  if (supplementaryRejected) {
    iteration++
    continue
  }

  // All gates passed (base + supplementary)
  log(`✅ Iteration ${iteration}: ALL GATES PASSED. Fix approved. Commit: ${impl.commitSha}`)
  return {
    status: 'APPROVED',
    issue: normalizedIssue,
    iterationsUsed: iteration,
    supplementaryPersonas,
    commitSha: impl.commitSha,
    preflight,
    design,
    impl,
    qeReport,
    beReport,
    supplementaryReports,
    history,
  }
}

// Exhausted iterations
log(`⚠️  Max iterations (${MAX_ITERATIONS}) reached without approval. Escalating to user.`)
return {
  status: 'ESCALATE_TO_USER',
  reason: `Reached max iterations (${MAX_ITERATIONS}) without approval. Last feedback: ${feedback}`,
  issue: normalizedIssue,
  design,
  impl,
  qeReport,
  beReport,
  history,
}
