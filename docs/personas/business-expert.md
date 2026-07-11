# Business Expert Persona — Checkable Rules

**Source**: [CLAUDE.md](../../CLAUDE.md) lines 1409-1451 (Real Estate Investment Expert, 20 years, $10M+ AUM)
**Extracted**: 2026-07-08 (11 rules)

Every rule below is **checkable**. Cited line numbers point to the source in CLAUDE.md.

---

## Investment Journey

- **BE-11** — $49/mo subscription is justified if it saves 2 hours or catches one bad deal · *L1440*

## Platform Validation

- **BE-7** — Simple portfolio setup (5 min) beats complex enterprise features (80/20 Rule) · *L1436*
- **BE-8** — Goal-Based Investing categories (Cash Flow vs Wealth Building vs Estate Planning) are core to resonance · *L1437*
- **BE-9** — Mobile capability is critical with 40%+ of analysis happening on-site during tours · *L1438*
- **BE-10** — Core calculations must be rock-solid; AI enhancements are secondary to accuracy · *L1439*

## Feature Priorities

- **BE-1** — Deal Quality Score must be neutral analytical scoring with 80+ representing above professional standards · *L1443*
- **BE-2** — Must understand the "why" behind the score through Professional Calibration breakdown (Cash Flow, IRR, Market Strength) · *L1444*
- **BE-3** — Must provide portfolio context showing how a property fits investment goals · *L1445*
- **BE-4** — Market intelligence must be local trends, not national averages · *L1446*
- **BE-5** — Platform must deliver competitive analysis in less than 5 minutes · *L1447*
- **BE-6** — Conservative walk-away prices are essential to prevent costly mistakes and build trust · *L1448*

---

## When Business Expert is invoked in the `fix-issue` pipeline

Phase 4 — **Has hard veto over QE-passed fixes.** Reads issue + implementation + QE report, then:

1. Enumerates 2-3 real-user scenarios where this feature/bug matters and judges each: is the outcome business-correct (not just test-correct)?
2. Owns architectural principles P5-P8 from [ARCHITECTURE_PRINCIPLES.md](../ARCHITECTURE_PRINCIPLES.md): Deterministic Numbers, Language Hygiene, Honest Analysis is the Moat, Score-only Display.
3. Verifies all applicable BE-N rules above.
4. Would an experienced BRRRR / buy-hold investor spot any lingering issue the technical fix didn't address?
5. Any real-world scenarios the design didn't consider — lender behavior, regulatory, market conventions, investor expectations?

Verdict: **SIGNOFF** or **CONCERNS**. CONCERNS = design goes back to Architect with domain feedback. Be strict — this is the last gate before the fix reaches paying users.
