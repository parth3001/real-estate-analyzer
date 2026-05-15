/**
 * Environment loader — MUST be imported FIRST in src/index.ts.
 *
 * Bug class this prevents (Issue surfaced 2026-05-15):
 *
 *   Several services (RentcastService, FredService, etc.) are instantiated
 *   as MODULE-LEVEL SINGLETONS — `export const foo = new FooService()`.
 *   Their constructors read `process.env.SOME_KEY` at construction time.
 *
 *   In `src/index.ts`, the import graph reaches those service modules
 *   BEFORE the line that calls `dotenv.config()`. Result: singletons
 *   capture undefined / empty values, and every request to that service
 *   fails (e.g., RentCast returning 401 "No API key in X-Api-Key header"
 *   even though .env had the key).
 *
 * The fix:
 *   1. Move the dotenv.config() call into THIS file (side-effect-only
 *      module — no exports beyond the assertion below).
 *   2. Make `src/index.ts` import this file FIRST, before any service
 *      / route / repository imports. TypeScript compiles ES-module
 *      `import` statements to `require()` in source order under
 *      CommonJS, so a top-of-file import here guarantees env load
 *      finishes before later imports start evaluating.
 *
 * DO NOT add other side-effects here. Keep this file laser-focused on
 * loading .env so the next engineer can read its name and instantly
 * understand its job.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env only outside production (Render injects env vars directly).
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(__dirname, '../.env');
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    // Don't log here — logger isn't loaded yet (it's a service too).
    // index.ts will log this when it's ready.
    // eslint-disable-next-line no-console
    console.warn(
      '[loadEnv] No .env file found at',
      envPath,
      '— this is normal in production.'
    );
  }
}
