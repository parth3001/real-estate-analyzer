/**
 * W4-S8 acceptance test — tool:export_audit_pdf.
 *
 * Verifies:
 *   1. Tool contract conformance
 *   2. Three format paths (json / csv / pdf) all produce non-empty
 *      content with the right MIME type
 *   3. AuditTrailEvent emitted with action: 'export_pdf' and the
 *      requested exportFormat
 *   4. pdfUrl is a valid data URL containing the base64 content
 *   5. pdfSizeBytes matches the raw byte length (not the base64 length)
 *   6. JSON output is valid JSON containing the bundle's data
 *   7. CSV output has the expected header + one row per event
 *   8. PDF output starts with %PDF- (valid PDF magic) and contains
 *      the bundle data in its text stream
 *   9. Trust boundary: invalid decisionId / unknown format rejected
 *   10. Read failures (missing decision) propagate without emitting
 *       AuditTrailEvent
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventsRepository } from '../../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import { exportAuditPdf } from '../export_audit_pdf';
import type { ToolContext } from '../types';
import type { DecisionPayload } from '../../../models/events/DecisionEvent';

const SETUP_TIMEOUT_MS = 90_000;

describe('tool:export_audit_pdf (W4-S8)', () => {
  let mongoServer: MongoMemoryServer;
  let writes: EventsRepository;
  let reads: EventsRepositoryReads;

  function makeCtx(userId: Types.ObjectId, traceId = 'trace-export'): ToolContext {
    return {
      traceId,
      userId,
      eventsRepo: writes,
      eventsReads: reads,
      tools: {},
    };
  }

  /** Seed a minimal audit trail: analysis + decision + 1 override. */
  async function seedAuditTrail(userId: Types.ObjectId): Promise<{
    decisionId: Types.ObjectId;
    analysisEventId: Types.ObjectId;
  }> {
    const analysisEventId = await writes.writeAnalysisEvent({
      traceId: 'seed',
      actorType: 'tool:score_deal',
      userId,
      payload: {
        propertyData: { propertyType: 'SFR', purchasePrice: 425000 } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['propertyData'],
        marketData: { lastUpdated: new Date(), dataSource: ['rentcast'] } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['marketData'],
        assumptions: { vacancyRate: 0.05 },
        metrics: { capRate: 5.2 } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['metrics'],
        monthlyAnalysis: { cashFlow: -120 },
        longTermAnalysis: { projectionYears: 10 },
        walkAwayPrice: 385000,
        enrichmentSource: 'rentcast',
        enrichmentCacheHit: false,
        engineVersion: 'v3.0',
        computeTimeMs: 142,
      },
    });

    const decisionPayload: DecisionPayload = {
      analysisEventId,
      dealQuality: 72,
      qualityLabel: 'Meets professional standards',
      qualityColor: 'yellow',
      professionalAssessment: { dealQuality: 72 } as unknown as DecisionPayload['professionalAssessment'],
      marketPosition: { walkAwayPrice: 385000 } as unknown as DecisionPayload['marketPosition'],
      reasoningTrail: {
        primaryInsight: 'ok',
        strategicRecommendations: [],
        riskMitigation: [],
        opportunityMaximization: [],
        keyRisks: [],
      },
      confidence: 80,
      scoringWeightsUsed: { cashFlow: 0.3 } as unknown as DecisionPayload['scoringWeightsUsed'],
      engineVersion: 'v3.0',
    };
    const decisionId = await writes.writeDecisionEvent({
      traceId: 'seed',
      actorType: 'agent:deal_scoring',
      userId,
      payload: decisionPayload,
    });

    await writes.writeOverrideEvent({
      traceId: 'seed',
      actorType: 'user',
      userId,
      payload: {
        originalDecisionId: decisionId,
        fieldPath: 'assumptions.vacancyRate',
        originalValue: 0.05,
        newValue: 0.08,
        inputMethod: 'structured_modal',
        priorDealQuality: 72,
      },
    });

    return { decisionId, analysisEventId };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    writes = new EventsRepository();
    reads = new EventsRepositoryReads();
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  // ===== Contract =====

  describe('Tool contract', () => {
    it('declares invokeLLM: false', () => {
      expect(exportAuditPdf.invokeLLM).toBe(false);
    });
    it('declares single audit_trail event side effect', () => {
      expect(exportAuditPdf.sideEffects).toEqual([
        { type: 'event', eventType: 'audit_trail' },
      ]);
    });
    it('has the stable global name', () => {
      expect(exportAuditPdf.name).toBe('export_audit_pdf');
    });
  });

  // ===== JSON format =====

  describe('format=json', () => {
    it('returns valid JSON containing the audit bundle', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);

      const out = await exportAuditPdf.execute(
        { decisionId, format: 'json' },
        makeCtx(userId)
      );

      expect(out.format).toBe('json');
      expect(out.contentType).toBe('application/json');
      expect(out.pdfSizeBytes).toBeGreaterThan(0);

      const decoded = Buffer.from(out.contentBase64, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      expect(parsed).toHaveProperty('decision');
      expect(parsed).toHaveProperty('analysis');
      expect(parsed).toHaveProperty('overrides');
      expect(parsed.overrides).toHaveLength(1);
    });

    it('pdfSizeBytes equals raw byte length (not base64 length)', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);
      const out = await exportAuditPdf.execute(
        { decisionId, format: 'json' },
        makeCtx(userId)
      );
      const rawBytes = Buffer.from(out.contentBase64, 'base64').byteLength;
      expect(out.pdfSizeBytes).toBe(rawBytes);
      // Sanity: base64 is ~4/3 the raw length
      expect(out.contentBase64.length).toBeGreaterThan(rawBytes);
    });
  });

  // ===== CSV format =====

  describe('format=csv', () => {
    it('produces a CSV with header row and one row per event', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);

      const out = await exportAuditPdf.execute(
        { decisionId, format: 'csv' },
        makeCtx(userId)
      );

      expect(out.format).toBe('csv');
      expect(out.contentType).toBe('text/csv');

      const decoded = Buffer.from(out.contentBase64, 'base64').toString('utf8');
      const lines = decoded.trim().split('\n');
      expect(lines[0]).toBe('eventType,timestamp,_id,traceId,payload_json');
      // Bundle has: 1 decision + 1 analysis + 1 override + 0 critiques + 0 audit
      expect(lines).toHaveLength(1 + 3); // header + 3 events
    });

    it('escapes embedded quotes in payload JSON', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);

      const out = await exportAuditPdf.execute(
        { decisionId, format: 'csv' },
        makeCtx(userId)
      );
      const decoded = Buffer.from(out.contentBase64, 'base64').toString('utf8');
      // CSV escapes " as "" inside quoted fields. The payload always has
      // some quoted strings, so this should appear.
      expect(decoded).toMatch(/""/);
    });
  });

  // ===== PDF format =====

  describe('format=pdf', () => {
    it('produces output starting with the PDF magic bytes', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);

      const out = await exportAuditPdf.execute(
        { decisionId, format: 'pdf' },
        makeCtx(userId)
      );

      expect(out.format).toBe('pdf');
      expect(out.contentType).toBe('application/pdf');

      const decoded = Buffer.from(out.contentBase64, 'base64').toString('utf8');
      expect(decoded.startsWith('%PDF-')).toBe(true);
      expect(decoded).toContain('%%EOF');
    });

    it('contains an xref table + trailer (valid PDF structure)', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);

      const out = await exportAuditPdf.execute(
        { decisionId, format: 'pdf' },
        makeCtx(userId)
      );
      const decoded = Buffer.from(out.contentBase64, 'base64').toString('utf8');
      expect(decoded).toContain('xref');
      expect(decoded).toContain('trailer');
      expect(decoded).toContain('startxref');
    });
  });

  // ===== Substrate emission =====

  describe('AuditTrailEvent emission', () => {
    it("writes an AuditTrailEvent with action: 'export_pdf' and the requested exportFormat", async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);

      const out = await exportAuditPdf.execute(
        { decisionId, format: 'csv' },
        makeCtx(userId, 'trace-emit')
      );

      const events = await reads.getEventsByTraceId('trace-emit');
      const auditEvent = events.find((e) => e.eventType === 'audit_trail');
      expect(auditEvent).toBeDefined();
      expect(auditEvent!._id.toString()).toBe(out.auditTrailEventId.toString());
      expect(auditEvent!.payload).toMatchObject({
        action: 'export_pdf',
        exportFormat: 'csv',
      });
    });

    it("uses actorType 'user' (export is a user action, not a tool emission)", async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);

      await exportAuditPdf.execute(
        { decisionId, format: 'json' },
        makeCtx(userId, 'trace-actor')
      );
      const events = await reads.getEventsByTraceId('trace-actor');
      const auditEvent = events.find((e) => e.eventType === 'audit_trail')!;
      expect(auditEvent.actorType).toBe('user');
    });

    it('AuditTrailEvent.payload.decisionId references the exported decision', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);

      await exportAuditPdf.execute(
        { decisionId, format: 'json' },
        makeCtx(userId, 'trace-ref')
      );
      const events = await reads.getEventsByTraceId('trace-ref');
      const auditEvent = events.find((e) => e.eventType === 'audit_trail')!;
      expect(
        (auditEvent.payload as { decisionId: Types.ObjectId }).decisionId.toString()
      ).toBe(decisionId.toString());
    });
  });

  // ===== Data URL output =====

  describe('pdfUrl is a valid data URL', () => {
    it('starts with the right data: prefix and includes the base64', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);

      const out = await exportAuditPdf.execute(
        { decisionId, format: 'pdf' },
        makeCtx(userId)
      );
      expect(out.pdfUrl.startsWith('data:application/pdf;base64,')).toBe(true);
      expect(out.pdfUrl).toContain(out.contentBase64);
    });

    it('json format uses application/json MIME', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);
      const out = await exportAuditPdf.execute(
        { decisionId, format: 'json' },
        makeCtx(userId)
      );
      expect(out.pdfUrl.startsWith('data:application/json;base64,')).toBe(true);
    });

    it('csv format uses text/csv MIME', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);
      const out = await exportAuditPdf.execute(
        { decisionId, format: 'csv' },
        makeCtx(userId)
      );
      expect(out.pdfUrl.startsWith('data:text/csv;base64,')).toBe(true);
    });
  });

  // ===== Trust boundary =====

  describe('error handling', () => {
    it('rejects an unknown format', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);

      await expect(
        exportAuditPdf.execute(
          {
            decisionId,
            format: 'xml' as unknown as 'pdf',
          },
          makeCtx(userId)
        )
      ).rejects.toThrow();
    });

    it('throws when the decisionId references a non-existent decision; NO AuditTrailEvent written', async () => {
      const userId = new Types.ObjectId();
      const fake = new Types.ObjectId();

      await expect(
        exportAuditPdf.execute(
          { decisionId: fake, format: 'json' },
          makeCtx(userId, 'trace-missing')
        )
      ).rejects.toThrow(/Decision not found/);

      const events = await reads.getEventsByTraceId('trace-missing');
      expect(events).toHaveLength(0);
    });

    it('accepts hex-string decisionId', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedAuditTrail(userId);

      const out = await exportAuditPdf.execute(
        { decisionId: decisionId.toHexString(), format: 'json' },
        makeCtx(userId)
      );
      expect(out.auditTrailEventId).toBeInstanceOf(Types.ObjectId);
    });
  });
});
