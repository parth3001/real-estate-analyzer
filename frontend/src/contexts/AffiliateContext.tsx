/**
 * Affiliate Context Provider
 *
 * Manages affiliate partner detection and tracking throughout the application.
 * Detects subdomain-based partners, persists affiliate codes, and provides
 * branding configuration to child components.
 *
 * Usage:
 * 1. Wrap App with <AffiliateProvider>
 * 2. Access via useAffiliate() hook in any component
 * 3. Automatically detects and persists affiliate codes
 *
 * @author Architect from CLAUDE.md
 * @date December 23, 2025
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  detectAffiliatePartner,
  getAffiliateCode,
  setAffiliateCode as persistAffiliateCode,
  clearAffiliateCode as removeAffiliateCode
} from '../utils/affiliateDetector';
import type { AffiliatePartner } from '../utils/affiliateDetector';

interface AffiliateContextValue {
  /** Current affiliate partner (if any) */
  affiliatePartner: AffiliatePartner | null;

  /** Current affiliate code for tracking */
  affiliateCode: string | null;

  /** Manually set affiliate code (e.g., from URL param) */
  setAffiliateCode: (code: string) => void;

  /** Clear affiliate tracking */
  clearAffiliateCode: () => void;

  /** Whether we're on an affiliate subdomain */
  isAffiliateSite: boolean;
}

const AffiliateContext = createContext<AffiliateContextValue | undefined>(undefined);

interface AffiliateProviderProps {
  children: ReactNode;
}

export function AffiliateProvider({ children }: AffiliateProviderProps): React.ReactElement {
  const [affiliatePartner, setAffiliatePartner] = useState<AffiliatePartner | null>(null);
  const [affiliateCode, setAffiliateCodeState] = useState<string | null>(null);

  useEffect(() => {
    // Detect affiliate partner from subdomain
    const partner = detectAffiliatePartner();
    setAffiliatePartner(partner);

    // Get affiliate code (subdomain, URL param, or localStorage)
    const code = getAffiliateCode();
    setAffiliateCodeState(code);

    // Persist code if we have one (for attribution)
    if (code) {
      persistAffiliateCode(code);
      console.log('🎯 Affiliate tracking initialized:', {
        partner: partner?.name || 'None',
        code,
        source: partner ? 'subdomain' : 'url_or_storage'
      });
    }

    // Log subdomain detection for debugging
    if (partner) {
      console.log('🏷️ Affiliate partner detected:', {
        name: partner.name,
        subdomain: partner.subdomain,
        affiliateCode: partner.affiliateCode
      });
    }
  }, []); // Run once on mount

  const setAffiliateCode = (code: string): void => {
    setAffiliateCodeState(code);
    persistAffiliateCode(code);
    console.log('🎯 Affiliate code manually set:', code);
  };

  const clearAffiliateCode = (): void => {
    setAffiliateCodeState(null);
    removeAffiliateCode();
    console.log('🗑️ Affiliate code cleared');
  };

  const isAffiliateSite = affiliatePartner !== null;

  const value: AffiliateContextValue = {
    affiliatePartner,
    affiliateCode,
    setAffiliateCode,
    clearAffiliateCode,
    isAffiliateSite
  };

  return (
    <AffiliateContext.Provider value={value}>
      {children}
    </AffiliateContext.Provider>
  );
}

/**
 * Hook to access affiliate context
 *
 * @throws Error if used outside AffiliateProvider
 */
export function useAffiliate(): AffiliateContextValue {
  const context = useContext(AffiliateContext);
  if (context === undefined) {
    throw new Error('useAffiliate must be used within AffiliateProvider');
  }
  return context;
}

/**
 * HOC to require affiliate context
 * Useful for components that only work on affiliate sites
 */
export function withAffiliate<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WithAffiliateComponent(props: P) {
    const affiliate = useAffiliate();

    if (!affiliate.isAffiliateSite) {
      return null; // Don't render on non-affiliate sites
    }

    return <Component {...props} />;
  };
}
