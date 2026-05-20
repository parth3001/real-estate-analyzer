/**
 * auditDealScoreIntegrity.ts — READ-ONLY diagnostic (Day 11h, 2026-05-20)
 *
 * Measures the blast radius of the two-scores / duplicate-Deal bug BEFORE
 * we decide migration-vs-hand-fix. Writes NOTHING. Just counts.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/auditDealScoreIntegrity.ts
 *
 * Reports four numbers that drive the Stage 1 backfill decision:
 *   1. Total Deals
 *   2. Duplicate Deals — same (userId, canonicalAddressKey) appearing >1x.
 *      These are the duplicates created by the broken exact-string dedup
 *      in dealMaterializationService (the canonical-key helper is dead code
 *      in the query path). Each duplicate set is one property fragmented
 *      across multiple Deal docs with potentially divergent scores.
 *   3. Legacy pre-substrate Deals — latestDecisionEventId is null/missing.
 *      Created before the 2026-05-18 substrate bridge. Under the chosen 1b
 *      (derive score from DecisionEvent) these have NO derivable source and
 *      need a synthesized DecisionEvent during backfill.
 *   4. Active intra-doc divergence — top-level investmentDecision.dealQuality
 *      != nested analysis.investmentDecision.dealQuality on the same doc
 *      (the 1105-Daffodil-style corruption).
 *
 * If these numbers are small, we hand-fix. If large, we build the migration.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { DealModel } from '../models/Deal';
import { buildCanonicalAddressKey } from '../utils/canonicalAddressKey';

interface LeanDealLite {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  updatedAt?: Date;
  latestDecisionEventId?: mongoose.Types.ObjectId | null;
  propertyAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  // strict:false means these may exist outside the formal schema:
  investmentDecision?: {
    professionalAssessment?: { dealQuality?: number };
    score?: number;
  };
  analysis?: {
    investmentDecision?: {
      professionalAssessment?: { dealQuality?: number };
      score?: number;
    };
  };
}

function safeCanonicalKey(addr: LeanDealLite['propertyAddress']): string | null {
  if (!addr || !addr.street || !addr.city || !addr.state) return null;
  try {
    return buildCanonicalAddressKey({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
    });
  } catch {
    return null;
  }
}

function topScore(d: LeanDealLite): number | undefined {
  return (
    d.investmentDecision?.professionalAssessment?.dealQuality ??
    d.investmentDecision?.score
  );
}

function nestedScore(d: LeanDealLite): number | undefined {
  return (
    d.analysis?.investmentDecision?.professionalAssessment?.dealQuality ??
    d.analysis?.investmentDecision?.score
  );
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected (READ-ONLY audit — no writes will occur)\n');

  try {
    const deals = (await DealModel.find(
      {},
      {
        userId: 1,
        updatedAt: 1,
        latestDecisionEventId: 1,
        propertyAddress: 1,
        investmentDecision: 1,
        'analysis.investmentDecision': 1,
      }
    ).lean()) as unknown as LeanDealLite[];

    const total = deals.length;

    // ---- 2. Duplicate Deals by (userId, canonicalAddressKey) ----
    const byKey = new Map<string, LeanDealLite[]>();
    let unkeyable = 0;
    for (const d of deals) {
      const ck = safeCanonicalKey(d.propertyAddress);
      if (!ck) {
        unkeyable++;
        continue;
      }
      const key = `${d.userId?.toString() ?? 'NO_USER'}::${ck}`;
      const arr = byKey.get(key) ?? [];
      arr.push(d);
      byKey.set(key, arr);
    }
    const duplicateSets = [...byKey.entries()].filter(([, arr]) => arr.length > 1);
    const duplicateDealCount = duplicateSets.reduce((sum, [, arr]) => sum + arr.length, 0);
    const dealsLostToMerge = duplicateSets.reduce((sum, [, arr]) => sum + (arr.length - 1), 0);

    // ---- 3. Legacy pre-substrate Deals ----
    const legacy = deals.filter((d) => !d.latestDecisionEventId);

    // ---- 4. Active intra-doc divergence ----
    const divergent = deals.filter((d) => {
      const t = topScore(d);
      const n = nestedScore(d);
      return t !== undefined && n !== undefined && t !== n;
    });

    // ---- Report ----
    console.log('═══════════════════════════════════════════════════');
    console.log('  DEAL SCORE INTEGRITY AUDIT (read-only)');
    console.log('═══════════════════════════════════════════════════\n');

    console.log(`1. TOTAL DEALS:                       ${total}`);
    console.log(`   (unkeyable — missing address):     ${unkeyable}\n`);

    console.log(`2. DUPLICATE DEAL SETS:               ${duplicateSets.length}`);
    console.log(`   Deals involved in duplicates:      ${duplicateDealCount}`);
    console.log(`   Deals that would merge away:        ${dealsLostToMerge}`);
    if (duplicateSets.length > 0) {
      console.log('   ── duplicate sets (canonical key → scores) ──');
      for (const [key, arr] of duplicateSets.slice(0, 20)) {
        const scores = arr
          .map((d) => `${topScore(d) ?? '–'}/${nestedScore(d) ?? '–'}`)
          .join('  ');
        console.log(`     ${key}`);
        console.log(`       ${arr.length} docs | top/nested: ${scores}`);
      }
      if (duplicateSets.length > 20) {
        console.log(`     … and ${duplicateSets.length - 20} more sets`);
      }
    }
    console.log('');

    console.log(`3. LEGACY PRE-SUBSTRATE DEALS:         ${legacy.length}`);
    console.log(`   (latestDecisionEventId is null —`);
    console.log(`    need synthesized DecisionEvent for 1b)\n`);

    console.log(`4. ACTIVE INTRA-DOC DIVERGENCE:        ${divergent.length}`);
    console.log(`   (top-level dealQuality != nested)`);
    if (divergent.length > 0) {
      console.log('   ── divergent docs (top vs nested) ──');
      for (const d of divergent.slice(0, 20)) {
        const addr = d.propertyAddress
          ? `${d.propertyAddress.street}, ${d.propertyAddress.city}`
          : '(no address)';
        console.log(
          `     ${d._id.toString()}  top=${topScore(d)} nested=${nestedScore(d)}  ${addr}`
        );
      }
      if (divergent.length > 20) {
        console.log(`     … and ${divergent.length - 20} more`);
      }
    }
    console.log('');

    console.log('───────────────────────────────────────────────────');
    console.log('  RECOMMENDATION');
    console.log('───────────────────────────────────────────────────');
    const affected = new Set<string>();
    duplicateSets.forEach(([, arr]) => arr.forEach((d) => affected.add(d._id.toString())));
    legacy.forEach((d) => affected.add(d._id.toString()));
    divergent.forEach((d) => affected.add(d._id.toString()));
    console.log(`  Distinct Deals needing attention:   ${affected.size} / ${total}`);
    if (affected.size <= 30) {
      console.log('  → Small blast radius. HAND-FIX is viable.');
    } else {
      console.log('  → Large blast radius. Build the migration script.');
    }
    console.log('═══════════════════════════════════════════════════');
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected. No data was modified.');
  }
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(10);
});
