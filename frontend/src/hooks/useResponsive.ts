import { useState, useEffect } from 'react';

export interface ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440
} as const;

export const useResponsive = (): ResponsiveBreakpoints => {
  const [dimensions, setDimensions] = useState<ResponsiveBreakpoints>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1440,
        height: 900
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet,
      width,
      height
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setDimensions({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet,
        width,
        height
      });
    };

    window.addEventListener('resize', handleResize);

    // Call handler immediately to set initial state
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
};

// Utility function for responsive styles
export const getResponsiveStyle = (
  mobile: any,
  tablet?: any,
  desktop?: any
) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  if (isMobile) return mobile;
  if (isTablet && tablet !== undefined) return tablet;
  if (isDesktop && desktop !== undefined) return desktop;

  // Fallback: tablet uses desktop, desktop uses tablet if not specified
  if (isTablet) return desktop ?? tablet ?? mobile;
  if (isDesktop) return tablet ?? desktop ?? mobile;

  return mobile;
};

// Media query helper for CSS-in-JS
export const mediaQueries = {
  mobile: `@media (max-width: ${BREAKPOINTS.mobile - 1}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.tablet}px)`,
  mobileUp: `@media (min-width: ${BREAKPOINTS.mobile}px)`,
  tabletUp: `@media (min-width: ${BREAKPOINTS.tablet}px)`
} as const;