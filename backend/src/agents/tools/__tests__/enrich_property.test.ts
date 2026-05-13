/**
 * W4-S5 acceptance test — tool:enrich_property.
 *
 * Uses a fake MarketIntelligenceAdapter (the real service hits
 * external APIs and is sealed per the strangler-fig rule).
 *
 * Verifies:
 *   1. Tool contract conformance (invokeLLM: false, external_api side
 *      effects declared, retry policy)
 *   2. Input normalization (structured address → flat query)
 *   3. Output reshaping (service's `comparables`/`property`/etc. →
 *      tool's `comps`/`propertyData`/etc.)
 *   4. enrichmentSource derivation from dataSource array
 *   5. cacheHit heuristic (recent lastUpdated → false; old → true)
 *   6. Trust boundary on malformed input
 */

import { Types } from 'mongoose';
import {
  enrichProperty,
  setMarketIntelligenceAdapter,
  resetMarketIntelligenceAdapter,
  type MarketIntelligenceAdapter,
} from '../enrich_property';
import type { ToolContext } from '../types';
import type {
  MarketDataResponse,
  MarketDataQuery,
} from '../../../types/marketData';
import { EventsRepository } from '../../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';

describe('tool:enrich_property (W4-S5)', () => {
  function makeCtx(): ToolContext {
    return {
      traceId: 'trace-enrich',
      userId: new Types.ObjectId(),
      eventsRepo: new EventsRepository(),
      eventsReads: new EventsRepositoryReads(),
      tools: {},
    };
  }

  function makeAdapter(
    response: MarketDataResponse,
    onCall?: (query: MarketDataQuery) => void
  ): MarketIntelligenceAdapter {
    return {
      async getComprehensiveMarketData(query) {
        if (onCall) onCall(query);
        return response;
      },
    };
  }

  function stubResponse(
    overrides: Partial<MarketDataResponse> = {}
  ): MarketDataResponse {
    return {
      property: { rentEstimate: 2400 } as unknown as MarketDataResponse['property'],
      comparables: [
        { address: '123 Main', price: 425000 } as unknown as MarketDataResponse['comparables'][number],
        { address: '125 Main', price: 430000 } as unknown as MarketDataResponse['comparables'][number],
      ],
      marketTrends: { medianRent: 2400 } as unknown as MarketDataResponse['marketTrends'],
      economicIndicators: { mortgageRate: 7.2 } as unknown as MarketDataResponse['economicIndicators'],
      location: {
        address: '123 Main St',
        zipCode: '78643',
        city: 'Anna',
        state: 'TX',
      },
      lastUpdated: new Date(),
      dataSource: ['rentcast', 'fred'],
      ...overrides,
    };
  }

  afterEach(() => {
    resetMarketIntelligenceAdapter();
  });

  // ===== Contract =====

  describe('Tool contract', () => {
    it('declares invokeLLM: false', () => {
      expect(enrichProperty.invokeLLM).toBe(false);
    });
    it('declares external_api side effects for rentcast + fred + census', () => {
      const services = enrichProperty.sideEffects
        .filter((s) => s.type === 'external_api')
        .map((s) => (s as { type: 'external_api'; service: string }).service);
      expect(services).toEqual(['rentcast', 'fred', 'census']);
    });
    it('uses DEFAULT_READ_RETRY (transient API failures should retry)', () => {
      expect(enrichProperty.retrySemantics.maxAttempts).toBeGreaterThan(1);
      expect(enrichProperty.retrySemantics.backoff).toBe('exponential');
    });
    it('has the stable global name', () => {
      expect(enrichProperty.name).toBe('enrich_property');
    });
  });

  // ===== Input normalization =====

  describe('input normalization', () => {
    it('flattens structured address into MarketDataQuery', async () => {
      let capturedQuery: MarketDataQuery | undefined;
      setMarketIntelligenceAdapter(
        makeAdapter(stubResponse(), (q) => {
          capturedQuery = q;
        })
      );

      await enrichProperty.execute(
        {
          address: { street: '123 Main St', city: 'Anna', state: 'TX', zipCode: '78643' },
          propertyType: 'SFR',
        },
        makeCtx()
      );

      expect(capturedQuery).toMatchObject({
        address: '123 Main St',
        city: 'Anna',
        state: 'TX',
        zipCode: '78643',
        propertyType: 'SFR',
        includeEconomicData: true,
      });
    });

    it('forwards optional knobs (radius, maxComparables, forceRefresh)', async () => {
      let capturedQuery: MarketDataQuery | undefined;
      setMarketIntelligenceAdapter(
        makeAdapter(stubResponse(), (q) => {
          capturedQuery = q;
        })
      );

      await enrichProperty.execute(
        {
          address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' },
          propertyType: 'SFR',
          radius: 2,
          maxComparables: 8,
          forceRefresh: true,
        },
        makeCtx()
      );

      expect(capturedQuery?.radius).toBe(2);
      expect(capturedQuery?.maxComparables).toBe(8);
      expect(capturedQuery?.forceRefresh).toBe(true);
    });
  });

  // ===== Output reshaping =====

  describe('output reshaping', () => {
    it('renames comparables→comps, property→propertyData, economicIndicators→economic', async () => {
      const stub = stubResponse();
      setMarketIntelligenceAdapter(makeAdapter(stub));

      const out = await enrichProperty.execute(
        {
          address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' },
        },
        makeCtx()
      );

      expect(out.comps).toBe(stub.comparables);
      expect(out.propertyData).toBe(stub.property);
      expect(out.economic).toBe(stub.economicIndicators);
      expect(out.marketTrends).toBe(stub.marketTrends);
    });

    it('returns the full MarketDataResponse on `fullResponse`', async () => {
      const stub = stubResponse();
      setMarketIntelligenceAdapter(makeAdapter(stub));

      const out = await enrichProperty.execute(
        {
          address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' },
        },
        makeCtx()
      );

      expect(out.fullResponse).toBe(stub);
    });
  });

  // ===== enrichmentSource derivation =====

  describe('enrichmentSource derivation', () => {
    it('returns "composite" when multiple sources contribute', async () => {
      setMarketIntelligenceAdapter(
        makeAdapter(stubResponse({ dataSource: ['rentcast', 'fred'] }))
      );
      const out = await enrichProperty.execute(
        { address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' } },
        makeCtx()
      );
      expect(out.enrichmentSource).toBe('composite');
    });

    it('returns the single source name when only one contributes', async () => {
      setMarketIntelligenceAdapter(
        makeAdapter(stubResponse({ dataSource: ['rentcast'] }))
      );
      const out = await enrichProperty.execute(
        { address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' } },
        makeCtx()
      );
      expect(out.enrichmentSource).toBe('rentcast');
    });

    it('returns "fallback" when dataSource includes "Fallback"', async () => {
      setMarketIntelligenceAdapter(
        makeAdapter(stubResponse({ dataSource: ['Fallback'] }))
      );
      const out = await enrichProperty.execute(
        { address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' } },
        makeCtx()
      );
      expect(out.enrichmentSource).toBe('fallback');
    });

    it('returns "fallback" when dataSource has no known sources', async () => {
      setMarketIntelligenceAdapter(
        makeAdapter(stubResponse({ dataSource: ['unknown_service'] }))
      );
      const out = await enrichProperty.execute(
        { address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' } },
        makeCtx()
      );
      expect(out.enrichmentSource).toBe('fallback');
    });
  });

  // ===== cacheHit heuristic =====

  describe('cacheHit heuristic', () => {
    it('returns false for a fresh response (lastUpdated near now)', async () => {
      setMarketIntelligenceAdapter(makeAdapter(stubResponse()));
      const out = await enrichProperty.execute(
        { address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' } },
        makeCtx()
      );
      expect(out.cacheHit).toBe(false);
    });

    it('returns true when lastUpdated is meaningfully older than the call time', async () => {
      // Simulate cache hit: lastUpdated 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      setMarketIntelligenceAdapter(
        makeAdapter(stubResponse({ lastUpdated: oneHourAgo }))
      );

      const out = await enrichProperty.execute(
        { address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' } },
        makeCtx()
      );
      expect(out.cacheHit).toBe(true);
    });
  });

  // ===== Trust boundary =====

  describe('input validation', () => {
    it('rejects missing address fields', async () => {
      setMarketIntelligenceAdapter(makeAdapter(stubResponse()));
      await expect(
        enrichProperty.execute(
          {
            address: { street: '', city: 'Y', state: 'Z', zipCode: '00000' },
          },
          makeCtx()
        )
      ).rejects.toThrow();
    });

    it('rejects unknown propertyType', async () => {
      setMarketIntelligenceAdapter(makeAdapter(stubResponse()));
      await expect(
        enrichProperty.execute(
          {
            address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' },
            propertyType: 'Land' as unknown as 'SFR',
          },
          makeCtx()
        )
      ).rejects.toThrow();
    });

    it('rejects negative radius', async () => {
      setMarketIntelligenceAdapter(makeAdapter(stubResponse()));
      await expect(
        enrichProperty.execute(
          {
            address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' },
            radius: -1,
          },
          makeCtx()
        )
      ).rejects.toThrow();
    });

    it('propagates service failures', async () => {
      setMarketIntelligenceAdapter({
        async getComprehensiveMarketData() {
          throw new Error('Service boom');
        },
      });
      await expect(
        enrichProperty.execute(
          { address: { street: 'X', city: 'Y', state: 'Z', zipCode: '00000' } },
          makeCtx()
        )
      ).rejects.toThrow(/Service boom/);
    });
  });
});
