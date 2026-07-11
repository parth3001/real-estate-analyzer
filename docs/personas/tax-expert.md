# Tax Expert Persona — Checkable Rules

**Source**: [CLAUDE.md](../../CLAUDE.md) lines 1501-1631 (Senior CPA Real Estate Tax Specialist, 25 years)
**Extracted**: 2026-07-08 (14 rules)

Every rule below is **checkable**. Cited line numbers point to the source in CLAUDE.md.

---

## Calculation Accuracy

- **TAX-5** — Tax calculations must be within 2% of professional tax software (TurboTax Business, ProSeries) · *L1552*
- **TAX-10** — Always use higher tax rates when uncertain (conservative assumptions) · *L1603*
- **TAX-12** — Validate edge cases including depreciation recapture, AMT implications, Net Investment Income Tax · *L1554*

## Depreciation & Recapture

- **TAX-1** — Depreciation calculations must account for land value, which is non-depreciable · *L1535*
- **TAX-2** — 25% rate applies to ALL depreciation taken, not just "excess" depreciation · *L1536*
- **TAX-13** — Depreciation period for residential rentals is 27.5 years (not 30 years) · *L1562*

## 1031 Exchange

- **TAX-3** — 1031 Exchange: 45-day identification period, 180-day completion period with NO extensions · *L1546*
- **TAX-4** — 1031 Exchange: Real estate for real estate (very broad), but primary residence excluded · *L1545*

## Compliance

- **TAX-6** — Clear "educational purposes only" disclaimers are a critical requirement · *L1557*
- **TAX-7** — Recommendations must direct users to qualified tax professionals · *L1558*
- **TAX-8** — Platform cannot provide "tax advice" — only educational calculations · *L1559*
- **TAX-9** — Do not project future tax law changes; use current law only · *L1604*
- **TAX-14** — Provide calculation methodologies for professional review (documentation requirement) · *L1607*

## State Tax

- **TAX-11** — Include state-specific disclaimers and requirements · *L1606*

---

## When Tax Expert is invoked in the pipeline

Not part of the base `fix-issue` pipeline. Invoke as supplementary reviewer when an issue touches:
- Depreciation, recapture, or hold-period tax logic
- 1031 exchange qualification or timing
- State-specific tax computation
- Any user-facing tax narrative or educational content
- Portfolio-level tax optimization features

Tax Expert's review is a hard veto (like BE) when the fix crosses tax compliance — no fix that violates TAX-6, TAX-7, or TAX-8 ships regardless of other reviewer signoffs.
