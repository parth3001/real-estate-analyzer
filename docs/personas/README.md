# Persona Checklists

Every persona defined in [CLAUDE.md](../../CLAUDE.md) has a corresponding numbered rule list here. These files are the **authoritative checklists** each persona consults when reviewing a design, implementation, or artifact.

**Total: 233 rules across 9 personas**, all extracted from CLAUDE.md with source line citations.

---

## Files

| Persona | Rules | Focus | Source in CLAUDE.md |
|---|---|---|---|
| [Architect](architect.md) | 19 | System design, substrate, agent mesh, cost architecture | L1234-1323 |
| [Engineer](engineer.md) | 21 | Implementation, LLM ops, testing, cost optimization | L1324-1408 |
| [QE Engineer](qe-engineer.md) | 15 | Test discipline, substrate verification, LLM eval | L1163-1231 |
| [Business Expert](business-expert.md) | 11 | Investment lens, feature priorities, real-user outcomes | L1409-1451 |
| [UX Designer](ux-designer.md) | 23 | Apple design philosophy, hierarchy, voice, accessibility | L1452-1500 |
| [Tax Expert](tax-expert.md) | 14 | Depreciation, 1031, compliance, calculation accuracy | L1501-1631 |
| [Marketing Expert](marketing-expert.md) | 29 | Conversion, pricing psychology, growth metrics, voice | L1632-1770 |
| [Strategic Product Advisor](strategic-product-advisor.md) | 45 | GTM, AI moat, category timing, B2B strategy, Track model | L1771-1898 |
| [Mobile Developer](mobile-developer.md) | 56 | Touch targets, Core Web Vitals, offline-first, property tours | L1899-2368 |

---

## Extraction discipline

Every rule in every file was **extracted** from CLAUDE.md, not invented. Each rule cites its source line so anyone can trace it back. If a rule needs to change, the change goes into CLAUDE.md first — these files are downstream projections.

**Do not add rules that aren't in CLAUDE.md.** If a persona needs new guidance, update CLAUDE.md and re-extract.

---

## How the `fix-issue` pipeline uses these

The base pipeline uses 4 personas in sequence:

1. **Architect** (Phase 1) reads [architect.md](architect.md) + [../ARCHITECTURE_PRINCIPLES.md](../ARCHITECTURE_PRINCIPLES.md), designs fix
2. **Engineer** (Phase 2) reads [engineer.md](engineer.md), implements per design
3. **QE Engineer** (Phase 3) reads [qe-engineer.md](qe-engineer.md) + P1-P25, adversarially validates
4. **Business Expert** (Phase 4) reads [business-expert.md](business-expert.md) + P5-P8 (owned), has hard veto

The other 5 personas (UX / Tax / Marketing / Strategic / Mobile) are invoked as supplementary reviewers when an issue touches their domain. Each has its own veto scope defined at the end of its file.

---

## Also see

- **[ARCHITECTURE_PRINCIPLES.md](../ARCHITECTURE_PRINCIPLES.md)** — 25 system-level principles P1-P25 (system rules, not persona rules)
- **[.claude/workflows/fix-issue.js](../../.claude/workflows/fix-issue.js)** — the 4-persona pipeline that consumes these files
- **[CLAUDE.md](../../CLAUDE.md)** — authoritative source; these persona files are derived

---

**Last extraction**: 2026-07-08 by 9 parallel Explore agents. See git commit for provenance.
