/**
 * objectIdHex — shared Zod schema for MongoDB ObjectId fields surfaced to
 * the LLM via agent tool input schemas (Task #16, 2026-05-23).
 *
 * THE BUG THIS PREVENTS
 * ---------------------
 * Several agent tools historically declared ObjectId fields as
 *   `z.union([z.instanceof(Types.ObjectId), z.string()])`
 * which round-trips through `zod-to-json-schema` as `{}` (matches anything)
 * because `z.instanceof()` has no JSON Schema representation and the union
 * collapses to the broader branch. The result: the LLM sees an empty
 * field schema and either omits the field, hallucinates a value, or sends
 * garbage that breaks downstream lookups silently. This was the root cause
 * of the recall_user_context failure that produced the chat stress-test
 * inversion (the 45 → 92 anomaly).
 *
 * THE FIX
 * -------
 * - JSON Schema seen by the LLM: a strict 24-char hex pattern. Renders as
 *   `{ "type": "string", "pattern": "^[a-fA-F0-9]{24}$" }`.
 * - Runtime: a `z.preprocess` step coerces an incoming `Types.ObjectId` to
 *   its hex string BEFORE the regex validates. Internal callers (tests,
 *   orchestrator) that still hand us a real `ObjectId` instance pass
 *   cleanly without forcing every call site to remember `.toString()`.
 * - Compile-time: the schema is cast to a `ZodType` whose declared INPUT
 *   type is `string | Types.ObjectId`. Tool input-type aliases that
 *   reference these fields can use `z.input<typeof Schema>` to get the
 *   widened compile-time signature; the OUTPUT (post-validation) type is
 *   always `string`.
 *
 * USAGE
 * -----
 *   import { objectIdHex } from './schemas/objectIdHex';
 *
 *   export const InputSchema = z.object({
 *     decisionId: objectIdHex,                 // required
 *     dealId:     objectIdHex.optional(),      // optional
 *   });
 *
 *   // Use z.input so internal callers can still pass an ObjectId instance.
 *   export type ToolInput = z.input<typeof InputSchema>;
 *
 *   async execute(input: ToolInput, ctx) {
 *     const validated = InputSchema.parse(input);
 *     // validated.decisionId is always a hex string at this point.
 *   }
 */

import { z } from 'zod';
import { Types } from 'mongoose';

const HEX_RE = /^[a-fA-F0-9]{24}$/;

const innerHexString = z
  .string()
  .regex(HEX_RE, 'Expected 24-char hex ObjectId string');

/**
 * Coercer that runs as the preprocess step. Pulled out so the type cast
 * below stays readable. Returns the value untouched if it's not an
 * ObjectId; the regex below catches anything still malformed.
 */
function coerceObjectIdToHex(value: unknown): unknown {
  return value instanceof Types.ObjectId ? value.toHexString() : value;
}

/**
 * The exported schema. The explicit `ZodType<output, def, input>` cast
 * declares the input type as `string | Types.ObjectId` — this is what makes
 * `z.input<typeof YourSchema>` produce a tool input type that accepts
 * either form from internal callers. Output is always a validated hex
 * string.
 */
export const objectIdHex = z.preprocess(
  coerceObjectIdToHex,
  innerHexString
) as unknown as z.ZodType<string, z.ZodTypeDef, string | Types.ObjectId>;
