import mongoose from 'mongoose';
import { DealModel } from '../models/Deal';
import { logger } from '../utils/logger';

export interface FormattedLastDeal {
  addressLine: string;
  headlineMetric: string | null;
}

export interface UserEmailContext {
  lastDeal: FormattedLastDeal | null;
  monthlyAnalyzedCount: number;
}

const QUERY_TIMEOUT_MS = 500;

function formatAddressLine(deal: any, fallbackName?: string): string | null {
  const a = deal?.propertyAddress;
  if (a?.street && a?.city && a?.state) {
    return `${a.street}, ${a.city} ${a.state}`;
  }
  if (a?.city && a?.state) {
    return `${a.city}, ${a.state}`;
  }
  if (fallbackName) return fallbackName;
  return null;
}

function formatHeadlineMetric(deal: any): string | null {
  const m = deal?.analysis?.keyMetrics;
  if (!m) return null;

  const parts: string[] = [];
  const coc = typeof m.cashOnCashReturn === 'number' ? m.cashOnCashReturn : null;
  const cashFlow = typeof m.cashFlow === 'number' ? m.cashFlow : null;

  if (coc !== null) parts.push(`ROI ${coc.toFixed(1)}%`);
  if (cashFlow !== null) parts.push(`Cash flow $${Math.round(cashFlow)}/mo`);

  return parts.length ? parts.join(' · ') : null;
}

/**
 * Fetch the minimal context needed to personalize a returning-user
 * magic-link email. Failures (missing deals, query timeout, malformed
 * data) degrade gracefully to null — auth path is never blocked.
 */
export async function getUserEmailContext(
  userId: mongoose.Types.ObjectId | string
): Promise<UserEmailContext> {
  const empty: UserEmailContext = { lastDeal: null, monthlyAnalyzedCount: 0 };

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [latest, count] = await Promise.all([
      DealModel.findOne({ userId })
        .sort({ updatedAt: -1 })
        .select('propertyAddress propertyName analysis.keyMetrics')
        .lean()
        .maxTimeMS(QUERY_TIMEOUT_MS)
        .exec(),
      DealModel.countDocuments({ userId, createdAt: { $gte: startOfMonth } })
        .maxTimeMS(QUERY_TIMEOUT_MS)
        .exec(),
    ]);

    const addressLine = latest ? formatAddressLine(latest, (latest as any).propertyName) : null;
    const headlineMetric = latest ? formatHeadlineMetric(latest) : null;

    return {
      lastDeal: addressLine ? { addressLine, headlineMetric } : null,
      monthlyAnalyzedCount: count ?? 0,
    };
  } catch (err) {
    logger.warn('[dealEmailHelper] context lookup failed, falling back to empty', {
      err: err instanceof Error ? err.message : String(err),
    });
    return empty;
  }
}
