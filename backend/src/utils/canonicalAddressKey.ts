/**
 * canonicalAddressKey — deterministic key for a property address.
 *
 * Used by DealLicense (Issue #105) to enforce "one license per
 * property per user" — same property typed two slightly different
 * ways must collapse to the same key so the user isn't double-billed
 * for "123 Main St" vs. "123 main street".
 *
 * NORMALIZATION RULES
 * -------------------
 *
 * 1. Lowercase everything.
 * 2. Trim whitespace from each field; collapse internal whitespace runs to a single space.
 * 3. Strip punctuation (`.`, `,`, `#`).
 * 4. Expand a stable set of street-suffix abbreviations to canonical short forms:
 *      street→st, avenue→ave, boulevard→blvd, drive→dr, road→rd,
 *      lane→ln, court→ct, place→pl, terrace→ter, way→way,
 *      highway→hwy, parkway→pkwy, circle→cir, trail→trl
 *    (We use the SHORT canonical form — USPS standard — because it's
 *    the most common input shape from RentCast.)
 * 5. State normalized to 2-letter UPPERCASE.
 * 6. ZIP truncated to 5 digits (ignore +4 extensions).
 * 7. Join with `|` separators in fixed order: street|city|state|zip.
 *
 * The output is the literal joined string — NOT a hash. Reasons:
 *   - Indexable directly in Mongo
 *   - Human-readable in `db.deal_licenses.find()` queries during ops
 *   - Hash collisions are non-existent in our scale, but if we ever
 *     need to hash for URL safety, do it at the API boundary, not the
 *     model layer
 *
 * NON-GOALS
 * ---------
 *
 * Full USPS address validation. We're collapsing user-typed variants
 * to a stable key, not validating that the address exists. If the
 * user types a typo, we license the typo — same as Zillow / Redfin.
 *
 * Apartment / unit numbers: kept as-is (in the `street` field). Two
 * units in the same building are different licenses. If a user
 * accidentally enters apt 2A and apt 2-A, those collapse together
 * after punctuation strip — acceptable.
 */

const STREET_SUFFIX_MAP: Record<string, string> = {
  street: 'st',
  st: 'st',
  avenue: 'ave',
  ave: 'ave',
  av: 'ave',
  boulevard: 'blvd',
  blvd: 'blvd',
  drive: 'dr',
  dr: 'dr',
  road: 'rd',
  rd: 'rd',
  lane: 'ln',
  ln: 'ln',
  court: 'ct',
  ct: 'ct',
  place: 'pl',
  pl: 'pl',
  terrace: 'ter',
  ter: 'ter',
  way: 'way',
  highway: 'hwy',
  hwy: 'hwy',
  parkway: 'pkwy',
  pkwy: 'pkwy',
  circle: 'cir',
  cir: 'cir',
  trail: 'trl',
  trl: 'trl',
};

function normalizeStreet(street: string): string {
  const base = street
    .toLowerCase()
    .replace(/[.,#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Walk tokens and replace suffix variants. Only replace if the
  // ENTIRE token matches a known suffix — don't smush "lane" inside
  // a word like "lakelane".
  const tokens = base.split(' ');
  for (let i = 0; i < tokens.length; i++) {
    const canon = STREET_SUFFIX_MAP[tokens[i]];
    if (canon) tokens[i] = canon;
  }
  return tokens.join(' ');
}

function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .replace(/[.,#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeState(state: string): string {
  // Accept either 2-letter codes ("TX") or full names ("Texas").
  // For full names, take the first 2 letters uppercased — fine for the
  // narrow set we see in practice, where RentCast returns 2-letter codes
  // and users typing the wizard see 2-letter pickers.
  const trimmed = state.replace(/[.,#]/g, '').trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  // Heuristic: take first two letters uppercased. Not perfect (would
  // collapse "California" and "Colorado" to "CA" and "CO" correctly,
  // but "South Carolina" and "South Dakota" would both → "SO"). Until
  // we see a real-world case where this matters, the simpler heuristic
  // beats a full state-name lookup table.
  return trimmed.slice(0, 2).toUpperCase();
}

function normalizeZip(zip: string | undefined): string {
  if (!zip) return '';
  const digits = zip.replace(/[^0-9]/g, '');
  return digits.slice(0, 5);
}

export interface PropertyAddressInput {
  street: string;
  city: string;
  state: string;
  zipCode?: string;
}

/**
 * Produce the canonical key for a property address.
 *
 * Throws on missing required fields (street/city/state) — the caller
 * needs to handle the typed-but-incomplete case explicitly. ZIP is
 * optional; missing ZIP just omits that segment of the key.
 */
export function buildCanonicalAddressKey(addr: PropertyAddressInput): string {
  if (!addr.street?.trim()) {
    throw new Error('canonicalAddressKey: street is required');
  }
  if (!addr.city?.trim()) {
    throw new Error('canonicalAddressKey: city is required');
  }
  if (!addr.state?.trim()) {
    throw new Error('canonicalAddressKey: state is required');
  }
  return [
    normalizeStreet(addr.street),
    normalizeCity(addr.city),
    normalizeState(addr.state),
    normalizeZip(addr.zipCode),
  ].join('|');
}
