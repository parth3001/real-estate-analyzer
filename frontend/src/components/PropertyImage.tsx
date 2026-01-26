/**
 * PropertyImage Component
 * Feature #9: Google Maps Property Image Integration
 *
 * FSE Implementation:
 * - Lazy loading with IntersectionObserver
 * - Responsive image sizing
 * - Skeleton loading state
 * - Graceful fallback if image fails
 * - Mobile-first design (40%+ usage)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import type { PropertyVisuals } from '../types/analysis';

interface PropertyImageProps {
  visuals?: PropertyVisuals;
  alt?: string;
  height?: number | string;
  width?: string;
  borderRadius?: number;
  showSource?: boolean; // Debug: Show which source was used
}

export const PropertyImage: React.FC<PropertyImageProps> = ({
  visuals,
  alt = 'Property Image',
  height = 400,
  width = '100%',
  borderRadius = 2,
  showSource = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Lazy loading with IntersectionObserver (FSE: Performance optimization)
  useEffect(() => {
    if (!imageRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imageRef.current);

    return () => observer.disconnect();
  }, []);

  // Determine which image URL to use (priority: primaryImage > streetView > staticMap)
  const imageUrl = visuals?.primaryImageUrl || visuals?.streetViewStaticUrl || visuals?.staticMapUrl;

  // No visuals data at all
  if (!visuals) {
    return (
      <Box
        sx={{
          width,
          height,
          borderRadius,
          backgroundColor: 'grey.100',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
        <Typography variant="caption" color="text.secondary">
          No image available
        </Typography>
      </Box>
    );
  }

  // Visuals fetched but no valid image URL
  if (!imageUrl) {
    return (
      <Box
        sx={{
          width,
          height,
          borderRadius,
          backgroundColor: 'grey.100',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
        <Typography variant="caption" color="text.secondary">
          {visuals.apiStatus === 'fallback'
            ? 'Image temporarily unavailable'
            : 'No image available'}
        </Typography>
        {showSource && visuals.source && (
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            Source: {visuals.source}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box ref={imageRef} sx={{ position: 'relative', width, height, borderRadius }}>
      {/* Skeleton loading state */}
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{ borderRadius }}
        />
      )}

      {/* Error state */}
      {hasError && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius,
            backgroundColor: 'grey.100',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
          <Typography variant="caption" color="text.secondary">
            Failed to load image
          </Typography>
        </Box>
      )}

      {/* Actual image (lazy loaded) */}
      {isInView && !hasError && (
        <Box
          component="img"
          src={imageUrl}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius,
            display: isLoading ? 'none' : 'block',
          }}
        />
      )}

      {/* Debug: Show source badge (bottom-right corner) */}
      {showSource && !isLoading && !hasError && visuals.source && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: 10,
          }}
        >
          {visuals.source}
        </Box>
      )}
    </Box>
  );
};

export default PropertyImage;
