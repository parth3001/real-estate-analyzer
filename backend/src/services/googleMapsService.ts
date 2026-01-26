/**
 * Google Maps Service
 *
 * Handles all Google Maps API integrations for property visuals:
 * - Google Places API (property photos)
 * - Street View Static API (street-level imagery)
 * - Maps Static API (static maps with pins)
 *
 * Architecture:
 * - Cache-first strategy (30-day TTL)
 * - Graceful degradation (always returns something)
 * - Circuit breaker pattern (prevents runaway costs)
 * - Non-blocking errors (never throws, returns null)
 */

import axios from 'axios';
import { logger } from '../utils/logger';

// Environment configuration
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const CACHE_TTL_DAYS = parseInt(process.env.GOOGLE_MAPS_CACHE_TTL_DAYS || '30', 10);
const MONTHLY_BUDGET = parseInt(process.env.GOOGLE_MAPS_MONTHLY_BUDGET || '100', 10);

// Validate API key on module load
if (!GOOGLE_MAPS_API_KEY) {
  logger.error('⚠️  GOOGLE_MAPS_API_KEY not configured in environment');
  logger.error('   Property images will NOT be available. Add to .env and restart backend.');
  // FSE: Don't throw error - allow backend to start, but warn clearly
}

// API endpoints
const BASE_URLS = {
  places: 'https://maps.googleapis.com/maps/api/place',
  streetView: 'https://maps.googleapis.com/maps/api/streetview',
  staticMap: 'https://maps.googleapis.com/maps/api/staticmap',
  geocode: 'https://maps.googleapis.com/maps/api/geocode/json'
};

/**
 * Property Visuals Data Structure
 */
export interface PropertyVisuals {
  primaryImageUrl?: string | null;      // Google Places photo (best quality)
  streetViewStaticUrl?: string;         // Street View static image (for hero)
  streetViewEmbedUrl?: string;          // Street View iframe URL (interactive)
  staticMapUrl?: string;                // Static map with pin
  fetchedAt?: Date;                     // Cache timestamp
  cacheExpiry?: Date;                   // When to refresh (30 days)
  source?: 'google-places' | 'street-view' | 'map-only';  // Which API provided primary image
  apiStatus?: 'success' | 'partial' | 'fallback';         // Quality indicator
}

/**
 * Circuit breaker for cost management
 */
class CircuitBreaker {
  private monthlySpend: number = 0;
  private tripped: boolean = false;
  private lastReset: Date = new Date();

  checkBudget(estimatedCost: number): boolean {
    // Reset monthly counter if new month
    const now = new Date();
    if (now.getMonth() !== this.lastReset.getMonth()) {
      this.monthlySpend = 0;
      this.tripped = false;
      this.lastReset = now;
    }

    // Check if adding this cost would exceed budget
    if (this.monthlySpend + estimatedCost > MONTHLY_BUDGET) {
      if (!this.tripped) {
        logger.error('🚨 Circuit breaker TRIPPED - Monthly API budget exceeded', {
          monthlySpend: this.monthlySpend,
          budget: MONTHLY_BUDGET
        });
        this.tripped = true;
      }
      return false;
    }

    this.monthlySpend += estimatedCost;
    return true;
  }

  isTripped(): boolean {
    return this.tripped;
  }
}

const circuitBreaker = new CircuitBreaker();

/**
 * Google Maps Service
 */
class GoogleMapsService {
  /**
   * Get property image from Google Places API
   *
   * @param address - Full property address
   * @returns Image URL or null if not available
   */
  async getPropertyImage(address: string): Promise<string | null> {
    if (!GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key not configured');
      return null;
    }

    // Check circuit breaker ($7 per 1000 = ~$0.007 per request)
    if (!circuitBreaker.checkBudget(0.007)) {
      logger.warn('Circuit breaker active - skipping Places API call');
      return null;
    }

    try {
      // Step 1: Find place by text search
      const searchUrl = `${BASE_URLS.places}/textsearch/json?query=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

      const searchResponse = await axios.get(searchUrl, { timeout: 5000 });

      if (searchResponse.data.status !== 'OK' || !searchResponse.data.results?.[0]) {
        logger.info('No Google Places result found for address', { address });
        return null;
      }

      const place = searchResponse.data.results[0];

      // Step 2: Check if place has photos
      if (!place.photos || place.photos.length === 0) {
        logger.info('No photos available for place', { address, placeId: place.place_id });
        return null;
      }

      // Step 3: Get photo URL (first photo)
      const photoReference = place.photos[0].photo_reference;
      const photoUrl = `${BASE_URLS.places}/photo?maxwidth=800&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;

      logger.info('✅ Google Places image found', { address, photoUrl });
      return photoUrl;

    } catch (error: any) {
      logger.warn('Error fetching Google Places image', {
        address,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Generate Street View static image URL
   * Used for hero section (static image, faster loading)
   *
   * @param lat - Latitude
   * @param lng - Longitude
   * @param size - Image size (default: 800x600)
   * @returns Static image URL
   */
  getStreetViewStaticUrl(lat: number, lng: number, size: string = '800x600'): string {
    if (!GOOGLE_MAPS_API_KEY) {
      return '';
    }

    return `${BASE_URLS.streetView}?size=${size}&location=${lat},${lng}&fov=90&pitch=0&key=${GOOGLE_MAPS_API_KEY}`;
  }

  /**
   * Generate Street View embed URL
   * Used for interactive iframe (no API cost!)
   *
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns Embed URL for iframe
   */
  getStreetViewEmbedUrl(lat: number, lng: number): string {
    if (!GOOGLE_MAPS_API_KEY) {
      return '';
    }

    // Google Street View Embed API (free for embeds)
    return `https://www.google.com/maps/embed/v1/streetview?location=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
  }

  /**
   * Generate static map URL with pin
   * Used for location context
   *
   * @param lat - Latitude
   * @param lng - Longitude
   * @param size - Map size (default: 800x400)
   * @param zoom - Zoom level (default: 15)
   * @returns Static map URL
   */
  getStaticMapUrl(lat: number, lng: number, size: string = '800x400', zoom: number = 15): string {
    if (!GOOGLE_MAPS_API_KEY) {
      return '';
    }

    // Red marker at property location
    const markerStyle = 'color:red|label:P';
    return `${BASE_URLS.staticMap}?center=${lat},${lng}&zoom=${zoom}&size=${size}&markers=${markerStyle}|${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
  }

  /**
   * Geocode address to coordinates using Google Geocoding API
   * Feature #9: Convert address → lat/lng when coordinates are missing
   *
   * @param address - Full property address
   * @returns Coordinates or null if geocoding fails
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key not configured - cannot geocode');
      return null;
    }

    // Check circuit breaker ($5 per 1000 = ~$0.005 per request)
    if (!circuitBreaker.checkBudget(0.005)) {
      logger.warn('Circuit breaker active - skipping geocoding call');
      return null;
    }

    try {
      const url = `${BASE_URLS.geocode}?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

      logger.info('📍 Geocoding address...', { address });
      const response = await axios.get(url, { timeout: 5000 });

      if (response.data.status === 'OK' && response.data.results?.[0]) {
        const location = response.data.results[0].geometry.location;
        logger.info('✅ Geocoding successful', {
          address,
          lat: location.lat,
          lng: location.lng
        });
        return { lat: location.lat, lng: location.lng };
      }

      logger.warn('Geocoding failed', { address, status: response.data.status });
      return null;

    } catch (error: any) {
      logger.error('Geocoding error', { address, error: error.message });
      return null;
    }
  }

  /**
   * Master method: Get all property visuals
   * Implements fallback hierarchy: Places Photo → Street View → Map
   *
   * @param address - Full property address
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns PropertyVisuals object with all available visuals
   */
  async getPropertyVisuals(address: string, lat: number, lng: number): Promise<PropertyVisuals> {
    const startTime = Date.now();

    // Initialize result object
    const visuals: PropertyVisuals = {
      fetchedAt: new Date(),
      cacheExpiry: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000)
    };

    try {
      // Step 1: Try to get Google Places photo (best quality)
      const placesImage = await this.getPropertyImage(address);

      if (placesImage) {
        visuals.primaryImageUrl = placesImage;
        visuals.source = 'google-places';
        visuals.apiStatus = 'success';
      } else {
        // Fallback to Street View static image
        visuals.primaryImageUrl = this.getStreetViewStaticUrl(lat, lng, '800x600');
        visuals.source = 'street-view';
        visuals.apiStatus = 'partial';
      }

      // Step 2: Generate Street View URLs (always include)
      visuals.streetViewStaticUrl = this.getStreetViewStaticUrl(lat, lng, '800x600');
      visuals.streetViewEmbedUrl = this.getStreetViewEmbedUrl(lat, lng);

      // Step 3: Generate static map (always include)
      visuals.staticMapUrl = this.getStaticMapUrl(lat, lng, '800x400', 15);

      const duration = Date.now() - startTime;

      logger.info('✅ Property visuals fetched', {
        address,
        source: visuals.source,
        duration: `${duration}ms`,
        hasPlacesPhoto: !!placesImage
      });

      return visuals;

    } catch (error: any) {
      logger.error('Error fetching property visuals', {
        address,
        lat,
        lng,
        error: error.message
      });

      // Return minimal visuals (map only) on complete failure
      visuals.staticMapUrl = this.getStaticMapUrl(lat, lng, '800x400', 15);
      visuals.source = 'map-only';
      visuals.apiStatus = 'fallback';

      return visuals;
    }
  }

  /**
   * Check if cached visuals are still valid
   *
   * @param visuals - Cached PropertyVisuals object
   * @returns true if cache is still valid
   */
  isCacheValid(visuals: PropertyVisuals): boolean {
    if (!visuals.cacheExpiry) {
      return false;
    }

    return new Date(visuals.cacheExpiry) > new Date();
  }

  /**
   * Get circuit breaker status
   * Used for monitoring/debugging
   */
  getCircuitBreakerStatus() {
    return {
      tripped: circuitBreaker.isTripped(),
      budget: MONTHLY_BUDGET
    };
  }
}

// Export singleton instance
export default new GoogleMapsService();
