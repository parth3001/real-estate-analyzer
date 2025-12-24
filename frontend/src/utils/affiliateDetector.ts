/**
 * Affiliate Partner Detection Utility
 *
 * Detects subdomain-based affiliate partners and manages branding configuration.
 * Used to provide branded landing pages and track referrals for influencer partnerships.
 *
 * @author Architect from CLAUDE.md
 * @date December 22, 2025
 */

export interface AffiliatePartner {
  id: string;
  name: string;
  subdomain: string;
  affiliateCode: string;
  brandingConfig: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    heroImage?: string;
    tagline: string;
    description: string;
  };
  contact?: {
    website?: string;
    youtube?: string;
    instagram?: string;
  };
}

/**
 * Registry of all affiliate partners
 * Add new partners here as configuration (no code changes needed)
 */
const AFFILIATE_PARTNERS: Record<string, AffiliatePartner> = {
  theficouple: {
    id: 'theficouple',
    name: 'The FI Couple',
    subdomain: 'theficouple',
    affiliateCode: 'JOSH_LUPO',
    brandingConfig: {
      logo: '/partners/theficouple-logo.png',
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      heroImage: '/partners/theficouple-hero.jpg',
      tagline: 'Analyze Real Estate Deals Like The FI Couple',
      description: 'Professional-grade real estate analysis tools trusted by Josh Lupo and The FI Couple community.'
    },
    contact: {
      website: 'https://theficouple.com',
      youtube: 'https://youtube.com/@theficouple',
      instagram: 'https://instagram.com/theficouple'
    }
  }
};

/**
 * Detects affiliate partner from current subdomain
 *
 * @returns AffiliatePartner object if subdomain matches, null otherwise
 */
export function detectAffiliatePartner(): AffiliatePartner | null {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Handle localhost testing
  if (hostname.includes('localhost')) {
    const localSubdomain = parts[0];
    if (localSubdomain !== 'localhost' && AFFILIATE_PARTNERS[localSubdomain]) {
      return AFFILIATE_PARTNERS[localSubdomain];
    }
    return null;
  }

  // Production: Check if we have a subdomain
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain === 'www' || subdomain === 'reanalyzr' || subdomain === 'reanalyzr') {
      return null;
    }
    if (AFFILIATE_PARTNERS[subdomain]) {
      return AFFILIATE_PARTNERS[subdomain];
    }
  }

  return null;
}

/**
 * Gets affiliate code from subdomain or URL parameter
 */
export function getAffiliateCode(): string | null {
  const partner = detectAffiliatePartner();
  if (partner) return partner.affiliateCode;

  const params = new URLSearchParams(window.location.search);
  const refParam = params.get('ref');
  if (refParam) return refParam;

  const stored = localStorage.getItem('affiliateCode');
  if (stored) return stored;

  return null;
}

/**
 * Persist affiliate code to localStorage
 */
export function setAffiliateCode(code: string): void {
  localStorage.setItem('affiliateCode', code);
  localStorage.setItem('affiliateCodeSetAt', new Date().toISOString());
}

/**
 * Clear affiliate code from localStorage
 */
export function clearAffiliateCode(): void {
  localStorage.removeItem('affiliateCode');
  localStorage.removeItem('affiliateCodeSetAt');
}
