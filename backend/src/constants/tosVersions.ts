/**
 * tosVersions — Task #78 (2026-06-18).
 *
 * Single source of truth for the current Terms of Service + Privacy
 * Policy versions, and which versions carry MATERIAL changes that
 * require affirmative re-consent from existing users on next login.
 *
 * Why this exists: when ToS gets updated to include arbitration,
 * class action waiver, pricing-model changes, or dispute resolution
 * shifts, browsewrap ("by continuing you agree") is increasingly
 * struck down by courts. Material changes need clickwrap — affirmative
 * acceptance — to bind users. The login endpoint compares User.
 * termsVersion against CURRENT_TOS_VERSION; if the user's version is
 * older and the diff includes a material change, return
 * `requiresReconsent: true` and the frontend forces a modal.
 *
 * Bump CURRENT_TOS_VERSION when actually updating the ToS document.
 * Add the new entry to MATERIAL_VERSION_HISTORY with material:true
 * only when the rewrite includes a "material" change as defined in
 * the ToS §7 ("dispute resolution, arbitration, pricing model, data
 * sharing, or liability").
 */

export const CURRENT_TOS_VERSION = '2025-10-30';

export const CURRENT_PRIVACY_VERSION = '2026-04-27';

/**
 * Material vs non-material flag per ToS version. Used by the login
 * endpoint: if the user's stored version is older than the latest
 * MATERIAL version, they need to re-accept before continuing.
 *
 * Non-material updates (typo fixes, formatting, contact info changes)
 * silently update via the next page-load — no re-consent prompt.
 *
 * Each entry should be added when the corresponding version ships.
 * Ordered chronologically.
 */
export const TOS_VERSION_HISTORY: Array<{
  version: string;
  material: boolean;
  summary: string;
}> = [
  {
    version: '2025-10-30',
    material: true,
    summary: 'Initial ToS for the 2.0 platform.',
  },
  // When the attorney-reviewed rewrite ships (post-#77), add it here:
  // {
  //   version: '2026-06-30',
  //   material: true,
  //   summary:
  //     'Added arbitration + class action waiver; rewrote subscription ' +
  //     'section as pay-per-deal; added CCPA section; added AI ' +
  //     'confabulation acknowledgment.',
  // },
];

/**
 * Returns true when the user's termsVersion is older than any material
 * version in history. False if the user has accepted the most recent
 * material version (even if they predate non-material patches).
 */
export function requiresReconsent(userTermsVersion: string | undefined): boolean {
  if (!userTermsVersion) return true;
  // Find the latest material version.
  const latestMaterial = [...TOS_VERSION_HISTORY]
    .filter((v) => v.material)
    .sort((a, b) => (a.version > b.version ? -1 : 1))[0];
  if (!latestMaterial) return false;
  return userTermsVersion < latestMaterial.version;
}
