/**
 * objectIdHex — regression locks for the shared ObjectId-field schema
 * (Task #16, 2026-05-23).
 *
 * Two failure modes must NEVER come back:
 *
 *   1. JSON Schema corruption. The original bug was
 *      `z.union([z.instanceof(Types.ObjectId), z.string()])`
 *      collapsing to `{}` after zod-to-json-schema, which made the LLM
 *      see an empty slot. We assert the rendered schema is `string` with
 *      the strict hex pattern.
 *
 *   2. Internal-caller breakage. Tests, the orchestrator, and various
 *      service layers still hand Types.ObjectId instances to tool
 *      inputs. The preprocess MUST coerce these to hex so .parse()
 *      succeeds — without forcing every caller to remember .toString().
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { objectIdHex } from '../objectIdHex';

describe('objectIdHex (Task #16)', () => {
  describe('JSON Schema rendering (the original bug)', () => {
    it('renders as a string with the strict 24-char hex pattern (not `{}`)', () => {
      // zod-to-json-schema unwraps z.preprocess, so the LLM sees the inner
      // string + regex shape directly. This is the assertion that locks
      // in the fix — if anyone reverts to z.union+z.instanceof, this
      // snapshot becomes `{}` and the test fails loudly.
      const schema = zodToJsonSchema(objectIdHex) as Record<string, unknown>;
      expect(schema.type).toBe('string');
      expect(schema.pattern).toBe('^[a-fA-F0-9]{24}$');
    });

    it('renders inside a parent object schema cleanly too', () => {
      const Parent = z.object({ decisionId: objectIdHex });
      const json = zodToJsonSchema(Parent) as {
        properties?: { decisionId?: Record<string, unknown> };
      };
      expect(json.properties?.decisionId?.type).toBe('string');
      expect(json.properties?.decisionId?.pattern).toBe('^[a-fA-F0-9]{24}$');
    });
  });

  describe('runtime acceptance', () => {
    it('accepts a 24-char hex string', () => {
      const oid = new Types.ObjectId();
      const parsed = objectIdHex.parse(oid.toHexString());
      expect(parsed).toBe(oid.toHexString());
    });

    it('coerces a Types.ObjectId instance to hex via preprocess', () => {
      const oid = new Types.ObjectId();
      const parsed = objectIdHex.parse(oid);
      expect(parsed).toBe(oid.toHexString());
    });

    it('rejects a non-hex string (gibberish)', () => {
      expect(() => objectIdHex.parse('not-a-valid-objectid')).toThrow();
    });

    it('rejects a number', () => {
      expect(() => objectIdHex.parse(12345)).toThrow();
    });

    it('rejects an empty string', () => {
      expect(() => objectIdHex.parse('')).toThrow();
    });

    it('rejects a hex string of the wrong length', () => {
      // 23 chars — one short.
      expect(() => objectIdHex.parse('a'.repeat(23))).toThrow();
      // 25 chars — one too many.
      expect(() => objectIdHex.parse('a'.repeat(25))).toThrow();
    });
  });

  describe('compile-time input type (z.input)', () => {
    // This block is type-level documentation — if the input type narrows
    // back to just `string`, the // @ts-expect-error pragmas below would
    // start FAILING (compile passes where errors were expected), which
    // surfaces the regression at build time. Wrapped in a describe block
    // so the test runner sees it as a registered case even though the
    // assertions are at the type level.
    it('accepts string | Types.ObjectId at compile time', () => {
      const Schema = z.object({ id: objectIdHex });
      type Input = z.input<typeof Schema>;
      const a: Input = { id: new Types.ObjectId().toHexString() };
      const b: Input = { id: new Types.ObjectId() };
      // Runtime sanity — both parse to hex strings.
      expect(typeof Schema.parse(a).id).toBe('string');
      expect(typeof Schema.parse(b).id).toBe('string');
    });
  });
});
