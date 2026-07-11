/**
 * fix-issue.js — 4-persona pipeline for pre-launch issue fixes.
 *
 *   Architect (design) → Engineer (code) → QE (validate) → Business Expert (signoff)
 *
 * Loop policy: up to 3 iterations. Any failure loops back to Architect (who
 * decides whether to revise the design or tighten the spec for Engineer).
 * Business Expert has hard veto — even if QE passes, BE can send the fix
 * back for design work.
 *
 * After 3 failed iterations, workflow stops and surfaces to the user for
 * a decision (revise the issue, drop the fix, or manual intervention).
 *
 * Invoke: Workflow({ name: 'fix-issue', args: '#243' })
 *   args is the issue number as filed in docs/ISSUE_TRACKER.md.
 */

export const meta = {
  name: 'fix-issue',
  description:
    '4-persona pipeline for issue fixes: Architect → Engineer → QE → Business Expert. ' +
    'BE has veto. Up to 3 iterations then escalates to user.',
  phases: [
    { title: 'Architect · design' },
    { title: 'Engineer · implement' },
    { title: 'QE · validate' },
    { title: 'Business Expert · signoff' },
  ],
}

// ==================== SCHEMAS (structured tool outputs) ====================

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

function architectPrompt(issueNumber, iteration, feedback) {
  const iterationBlock = iteration === 1 ? '' : `

⚠️  This is iteration ${iteration}. Previous iteration failed.

Previous feedback: ${feedback}

Revise the design. If the failure was in DESIGN, produce a fundamentally different approach (set rejectPreviousWork: true). If the failure was in IMPLEMENTATION (Engineer misinterpreted), tighten the design spec so misinterpretation is impossible.
`

  return `You are the Principal Software Architect defined in /Users/parthpatel/real-estate-analyzer/CLAUDE.md — 18 years experience, financial services + real estate.

Task: design a fix for issue ${issueNumber}.

Step 1 — Read the authoritative principles checklist.
  Read /Users/parthpatel/real-estate-analyzer/docs/ARCHITECTURE_PRINCIPLES.md IN FULL before starting the design. This is your checklist. Every design decision must be defensible against P1-P25.

Step 2 — Read the issue.
  Run: grep -A 30 "^### Issue ${issueNumber}:" /Users/parthpatel/real-estate-analyzer/docs/ISSUE_TRACKER.md
  Read the full entry including its "Component", "Description", "Business Impact", "Proposed Solution", and "Related" sections.

Step 3 — Read the code.
  For every file:line-range mentioned in Component + Description, read that file (at least ±20 lines around the referenced line).
  Read related callers/consumers if the issue is about drift or wire-shape.

Step 4 — Design the fix.
  Verify the design against every APPLICABLE principle in ARCHITECTURE_PRINCIPLES.md. Cite the principle numbers in your reasoning (e.g., "per P1 Single Source of Truth, this consolidates the three computation sites into one projector call").
  For any principle you consciously chose NOT to apply, list it as a non-goal WITH REASONING.
  Do not scope-creep — the fix must match the issue.

Return via the DESIGN_SCHEMA structured output. Be specific: filesToChange must name files that exist and describe changes concretely. Invariants must be testable assertions. NonGoals must call out what an over-eager engineer might otherwise attempt AND every principle intentionally skipped.
${iterationBlock}
Do NOT modify code. Design only.`
}

function engineerPrompt(issueNumber, design) {
  return `You are the Senior Full-Stack Engineer defined in /Users/parthpatel/real-estate-analyzer/CLAUDE.md — 15 years, React/Node.js, financial calculations.

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

// ==================== MAIN LOOP ====================

const MAX_ITERATIONS = 3
const issueNumber = String(args ?? '').trim()

if (!issueNumber) {
  throw new Error(
    'fix-issue requires an issue number as args. Example: { name: "fix-issue", args: "#243" }'
  )
}

// Normalize: allow "#243" or "243"
const normalizedIssue = issueNumber.startsWith('#') ? issueNumber : `#${issueNumber}`

log(`Starting fix-issue pipeline for ${normalizedIssue}`)

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
  design = await agent(architectPrompt(normalizedIssue, iteration, feedback), {
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

  // All gates passed
  log(`✅ Iteration ${iteration}: ALL GATES PASSED. Fix approved. Commit: ${impl.commitSha}`)
  return {
    status: 'APPROVED',
    issue: normalizedIssue,
    iterationsUsed: iteration,
    commitSha: impl.commitSha,
    design,
    impl,
    qeReport,
    beReport,
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
