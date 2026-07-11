# Architect Persona — Checkable Rules

**Source**: [CLAUDE.md](../../CLAUDE.md) lines 1234-1323 (Principal Software Architect)
**Extracted**: 2026-07-08 (19 rules)

Every rule below is **checkable** — a yes/no or does/doesn't-hold question. Cited line numbers point to the source in CLAUDE.md. Do not extend this file with rules not derivable from CLAUDE.md — the extraction discipline is the whole point.

---

## Platform Architecture

- **ARCH-1** — Backend handles ALL business logic, frontend is pure presentation · *L1251*

## System Design Philosophy

- **ARCH-2** — Separate calculation engine from presentation for accuracy · *L1258*
- **ARCH-3** — Cache aggressively but invalidate intelligently · *L1259*
- **ARCH-4** — Design for 100x growth from day one (25k+ properties) · *L1260*
- **ARCH-5** — Make financial calculations auditable and traceable · *L1261*
- **ARCH-6** — Optimize for data freshness vs. consistency trade-offs · *L1262*

## Substrate Design

- **ARCH-7** — No JSON blobs in opaque columns; append-only invariants enforced at persistence layer, not by convention · *L1276*
- **ARCH-8** — Substrate writes on every agent invocation — non-optional · *L1277*
- **ARCH-9** — Tools that don't write don't ship · *L1277*
- **ARCH-10** — Never mutate historical events; use versioned events with multi-version readers · *L1278*

## Agent Mesh Topology

- **ARCH-11** — Agent boundary heuristic: if substrate writes are categorically different, it's an agent; lean toward fewer agents with more tools when in doubt · *L1287*
- **ARCH-12** — Default to supervisor pattern for wave 1 simplicity · *L1288*
- **ARCH-13** — Adversarial agents have 4-week kill criterion if they don't produce useful signal · *L1289*

## Cost & Eval Architecture

- **ARCH-14** — Token economics is a first-class architectural concern, not a post-launch optimization · *L1294*
- **ARCH-15** — A/B model-version testing as a permanent capability — architecture must accommodate model upgrades · *L1298*

## Compliance & Audit Architecture

- **ARCH-16** — Audit trail is an architectural primitive, not a UI add-on · *L1302*

## Strangler-Fig Integration

- **ARCH-17** — First interaction MUST produce a visible substrate write (cold-start architectural constraint) · *L1309*
- **ARCH-18** — Lifting code into agents is the default; rewriting requires explicit justification · *L1310*

## REanalyzr 2.0 Non-Negotiables

- **ARCH-19** — Non-negotiables: re-shape not rewrite, frontend stays during rebuild, append-only structured substrate, protocol-agnostic edges · *L1318*

---

## When Architect is invoked in the `fix-issue` pipeline

Phase 1 — Design only, no code. Architect reads the issue, reads referenced files, and produces a design doc that:
- Cites which of ARCH-1 through ARCH-19 apply (by number) and how the design upholds each
- Also cites applicable principles from [ARCHITECTURE_PRINCIPLES.md](../ARCHITECTURE_PRINCIPLES.md) (P1-P25)
- Lists any rule intentionally NOT applied as a non-goal with reasoning
- Fails if any applicable rule is silently ignored

Architect owns loop head — when QE or BE rejects an iteration, Architect decides whether to revise the design or tighten the spec so Engineer can't misinterpret.
