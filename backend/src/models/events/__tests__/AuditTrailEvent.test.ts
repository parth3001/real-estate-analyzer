/**
 * W1-S2 part 7 — AuditTrailEvent acceptance tests.
 * B2B compliance audit-trail surface.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AuditTrailEventModel, AuditTrailPayloadSchema, AuditTrailPayload } from '../AuditTrailEvent';
import { APPEND_ONLY_ERROR } from '../BaseEvent';

const SETUP_TIMEOUT_MS = 90_000;

function validPayload(): AuditTrailPayload {
  return {
    decisionId: new Types.ObjectId(),
    action: 'export_pdf',
    exportFormat: 'pdf',
    recipient: 'underwriter@acme-cu.com',
    ipAddress: '192.168.1.42',
  };
}

describe('AuditTrailEvent (W1-S2 part 7)', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  describe('Zod schema', () => {
    it('parses valid export_pdf payload', () => {
      expect(() => AuditTrailPayloadSchema.parse(validPayload())).not.toThrow();
    });

    it('accepts all 4 actions', () => {
      const actions = ['export_pdf', 'view_assumptions', 'sign_off', 'submit_to_committee'] as const;
      for (const action of actions) {
        expect(() => AuditTrailPayloadSchema.parse({ ...validPayload(), action })).not.toThrow();
      }
    });

    it('rejects invalid action', () => {
      expect(() =>
        AuditTrailPayloadSchema.parse({ ...validPayload(), action: 'preview' as unknown as 'export_pdf' })
      ).toThrow();
    });

    it('accepts all 3 export formats', () => {
      for (const exportFormat of ['pdf', 'csv', 'json'] as const) {
        expect(() => AuditTrailPayloadSchema.parse({ ...validPayload(), exportFormat })).not.toThrow();
      }
    });

    it('accepts sign_off payload with approvedBy + approvalNote', () => {
      const payload = {
        decisionId: new Types.ObjectId(),
        action: 'sign_off' as const,
        approvedBy: new Types.ObjectId(),
        approvalNote: 'Approved with conditions on environmental review',
      };
      expect(() => AuditTrailPayloadSchema.parse(payload)).not.toThrow();
    });

    it('accepts view_assumptions payload with viewedAssumptions list', () => {
      const payload = {
        decisionId: new Types.ObjectId(),
        action: 'view_assumptions' as const,
        viewedAssumptions: ['assumptions.vacancyRate', 'assumptions.maintenanceRate'],
      };
      expect(() => AuditTrailPayloadSchema.parse(payload)).not.toThrow();
    });

    it('rejects missing required decisionId', () => {
      const payload = validPayload() as unknown as Record<string, unknown>;
      delete payload.decisionId;
      expect(() => AuditTrailPayloadSchema.parse(payload)).toThrow();
    });
  });

  describe('Mongoose discriminator', () => {
    it('creates an AuditTrailEvent in events collection', async () => {
      const event = await AuditTrailEventModel.create({
        traceId: 'test-audit-1',
        eventVersion: 1,
        actorType: 'tool:export_audit_pdf',
        userId: new Types.ObjectId(),
        payload: validPayload(),
      });
      expect(event.get('eventType')).toBe('audit_trail');
      expect(AuditTrailEventModel.collection.name).toBe('events');
    });

    it('inherits append-only', async () => {
      const event = await AuditTrailEventModel.create({
        traceId: 'test-audit-2',
        eventVersion: 1,
        actorType: 'tool:export_audit_pdf',
        userId: new Types.ObjectId(),
        payload: validPayload(),
      });
      await expect(
        AuditTrailEventModel.updateOne({ _id: event._id }, { 'payload.action': 'sign_off' })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });
  });
});
