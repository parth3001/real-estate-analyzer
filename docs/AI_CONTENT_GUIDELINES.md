# AI Content Generation Guidelines

**Version**: 1.0
**Last Updated**: 2026-01-22
**Related**: Issue #76 - AI Directive Language Legal Liability Fix

---

## 🎯 Purpose

This document provides guidelines for AI-generated content in the REanalyzr platform to ensure **legal compliance** and avoid investment advice liability.

---

## ⚖️ Legal Compliance Requirements

### Critical Rule: NO Directive Language

**FORBIDDEN**: AI-generated content must NEVER use directive language that could be construed as investment advice or recommendations.

**Why**: Using directive language exposes the platform to legal liability under investment advice regulations. REanalyzr is an **analytical tool**, not a **financial advisor**.

---

## 🚫 Forbidden Language Patterns

### Directive Verdicts
- ❌ "The algorithm recommended BUY"
- ❌ "We recommend PASS on this deal"
- ❌ "This property warrants CAUTION"
- ❌ "Our system suggests you NEGOTIATE"

### Recommendation Language
- ❌ "We recommend you buy this property"
- ❌ "I suggest you pass on this deal"
- ❌ "You should buy/pass/negotiate"
- ❌ "We advise against this investment"

### Directive Action Phrases
- ❌ "You should buy this property"
- ❌ "You must negotiate the price"
- ❌ "You need to pass on this"
- ❌ "We recommend purchasing"

---

## ✅ Required Analytical Language

### Quality Score-Based Framing
- ✅ "The analysis indicates a ${dealQuality}/100 assessment"
- ✅ "This property shows a ${dealQuality}/100 quality score"
- ✅ "The data demonstrates ${dealQuality}/100 deal quality"

### Analytical Observations
- ✅ "The analysis shows..."
- ✅ "The data indicates..."
- ✅ "The assessment demonstrates..."
- ✅ "The metrics suggest..."
- ✅ "The calculation reveals..."

### Neutral Descriptors
- ✅ "Strong fundamentals" (80-100)
- ✅ "Solid foundation" (65-79)
- ✅ "Requires optimization" (50-64)
- ✅ "Significant concerns" (35-49)
- ✅ "Below professional standards" (0-34)

---

## 📐 Quality Score System (0-100)

### Score Ranges and Non-Directive Descriptors

| Score Range | Descriptor | Analytical Framing |
|-------------|------------|-------------------|
| 80-100 | (Strong fundamentals) | "The property demonstrates strong fundamentals with an ${score}/100 assessment" |
| 65-79 | (Solid foundation) | "The analysis shows a solid foundation with ${score}/100 quality" |
| 50-64 | (Requires optimization) | "The data indicates ${score}/100 quality requiring optimization" |
| 35-49 | (Significant concerns) | "The assessment reveals significant concerns with ${score}/100 quality" |
| 0-34 | (Below professional standards) | "The metrics show ${score}/100 quality below professional standards" |

---

## 🔧 Implementation: Post-Processing Validation

All AI-generated content passes through `validateAndSanitizeAIContent()` which:

1. **Detects** directive patterns via regex
2. **Replaces** with analytical equivalents
3. **Logs** violations for prompt refinement
4. **Returns** sanitized content

### Replacement Map

| Directive Pattern | Analytical Replacement |
|------------------|----------------------|
| "recommend(ed\|s)" | "indicates" |
| "should (buy\|pass\|negotiate)" | "analysis shows" |
| "algorithm recommends" | "algorithm indicates" |
| "we/I recommend" | "the analysis shows" |
| "(buy\|pass\|negotiate) this property" | "consider this property" |

---

## 📝 Prompt Engineering Best Practices

### DO: Use Deal Quality Scores
```typescript
const prompt = `
PROFESSIONAL ASSESSMENT: Deal Quality ${dealQuality}/100 ${getQualityDescriptor(dealQuality)}

Task: Explain the ${dealQuality}/100 assessment using weighted factor scores.

CRITICAL: NEVER use directive language (recommend, should buy, caution as verdict)
`;
```

### DON'T: Use Verdict Language
```typescript
const prompt = `
Recommendation: ${verdict}  // ❌ WRONG - Creates liability

Task: Explain why our algorithm recommended "${verdict}"  // ❌ WRONG - Directive
`;
```

---

## 🧪 Testing Requirements

### Unit Tests
Every AI content generation method must have tests validating:
- ✅ Zero directive language in output
- ✅ Analytical framing is present
- ✅ Deal Quality score is referenced
- ✅ Post-processing validation works

### Integration Tests
Full analysis flow tests must validate:
- ✅ No directive language with user goals
- ✅ Multiple goal variations produce analytical content
- ✅ Low quality (30/100) avoids "PASS" directive
- ✅ Strong quality (80/100) avoids "BUY" directive

---

## 📚 Examples

### ❌ WRONG: Directive Language

```
"With your cash flow strategy, this property's 45/100 deal quality driven
primarily by low cash flow scores results in our CAUTION recommendation because
the algorithmic assessment indicates marginal returns."
```

**Problems**:
- Uses "CAUTION recommendation" (directive verdict)
- Implies platform is making a recommendation

### ✅ CORRECT: Analytical Language

```
"With your cash flow strategy, this property's 45/100 assessment (Significant concerns)
driven primarily by cash flow scoring at 35/100 and IRR at 40/100 indicates marginal
returns that may require careful evaluation against your investment goals."
```

**Correct because**:
- Uses "45/100 assessment" (objective score)
- "indicates" instead of "recommends"
- "may require careful evaluation" instead of "proceed with caution"

---

## 🔍 AI Prompt Examples

### Example 1: Goal-Based Reasoning Prompt

```typescript
const prompt = `
You are a portfolio manager explaining our algorithm's Deal Quality assessment.

PROFESSIONAL ASSESSMENT: Deal Quality ${dealQuality}/100 ${getQualityDescriptor(dealQuality)}

USER'S INVESTMENT STRATEGY:
- Personal Strategy Notes: "${userGoal}"

CRITICAL LEGAL COMPLIANCE:
1. EXPLAIN the ${dealQuality}/100 assessment using weighted scores
2. CONNECT analysis to user's strategy
3. NEVER use directive language (recommend, should buy/pass, caution)
4. ANALYTICAL FRAMING: "The analysis indicates...", "The data shows..."

TASK: Write 2-3 sentences explaining the ${dealQuality}/100 assessment
and how it relates to the user's goals.

FORMAT: Return analytical explanation only, no directives.
`;
```

### Example 2: Capital Strategy Prompt

```typescript
const prompt = `
You are a capital allocation specialist analyzing financing strategy.

VERIFIED DEAL STRUCTURE:
- Professional Score: ${dealQuality}/100 ${getQualityDescriptor(dealQuality)}
- Monthly Cash Flow: $${cashFlow}

CRITICAL CONSTRAINTS:
1. NEVER use directive language (recommend, should, must)
2. Use analytical framing: "The analysis shows...", "Data indicates..."

STRATEGY FOCUS: ${dealQuality >= 65 ? 'Optimize strong structure' :
                  dealQuality >= 50 ? 'Structure improvements' :
                  'Risk mitigation approaches'}

TASK: Provide capital strategy analysis for ${dealQuality}/100 quality.
`;
```

---

## 📊 Monitoring & Refinement

### Weekly Review Process
1. Review `logger.warn` outputs for directive language violations
2. Analyze patterns in sanitized content
3. Refine AI prompts to reduce violations
4. Update directive patterns list as needed

### Quarterly Audit
1. Manual review of 50 random AI outputs
2. Legal team review of content samples
3. Update guidelines based on findings
4. Refresh team training on compliance

---

## 🎓 Training Guidelines

### For New Developers
1. Read this document completely
2. Review Issue #76 root cause analysis
3. Understand legal liability implications
4. Review test files for examples
5. Practice: Write 3 analytical vs directive examples

### For AI Prompt Engineers
1. Master analytical framing techniques
2. Understand quality score system
3. Know forbidden patterns by heart
4. Review GPT-4o-mini prompt engineering best practices
5. Test prompts with multiple scenarios before deployment

---

## 📖 Related Documentation

- **Issue #76**: `/docs/ISSUE_TRACKER.md` - Root cause and fix documentation
- **Implementation**: `/backend/src/services/aiEnhancedMessaging.ts` - Source code
- **Unit Tests**: `/backend/src/tests/aiEnhancedMessaging-directive-validation.test.ts`
- **Integration Tests**: `/backend/src/tests/integration/issue76-ai-directive-validation.test.ts`

---

## ✅ Compliance Checklist

Before deploying new AI content features:

- [ ] Prompts use Deal Quality scores (0-100), NOT verdicts
- [ ] Prompts explicitly forbid directive language
- [ ] Post-processing validation implemented
- [ ] Unit tests validate no directive language
- [ ] Integration tests cover user goal scenarios
- [ ] Manual QA tested with 5+ goal variations
- [ ] Legal team reviewed content samples
- [ ] Documentation updated
- [ ] Team trained on guidelines

---

## 🚨 Escalation Process

If directive language is detected in production:

1. **Immediate**: Disable affected AI feature
2. **Within 1 hour**: Investigate root cause (prompt or GPT output)
3. **Within 4 hours**: Deploy fix with updated validation
4. **Within 24 hours**: Full audit of all AI content
5. **Within 1 week**: Legal review and documentation update

---

## 📞 Contact

**Questions about AI content compliance?**
- Technical: Senior Full-Stack Engineer
- Legal: Legal/Compliance Team
- Product: Product Owner
- Escalations: CTO

**Emergency (Production Directive Language)**:
- Immediately notify CTO and Legal Team
- Follow escalation process above

---

**Document Owner**: Principal Software Architect
**Approved By**: Legal & Compliance Team
**Next Review**: 2026-04-22 (Quarterly)
