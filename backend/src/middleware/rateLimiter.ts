/**
 * PDF Request Rate Limiter Middleware
 *
 * Purpose: Prevent abuse by limiting PDF requests to 5 per hour per IP address
 * Implementation: LRU Cache with bounded memory (max 5000 IPs)
 *
 * Why LRU Cache vs In-Memory Map:
 *   - Bounded size (prevents memory leaks with 10K+ unique IPs)
 *   - Automatic TTL-based expiration (1 hour)
 *   - O(1) operations for get/set/delete
 *
 * Created: 2026-03-01
 */

import { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import { RateLimitEntry, RateLimitResult, PDF_CONSTANTS } from '../types/pdf.types';
import { logger } from '../utils/logger';

// ============================================================
// LRU Cache Configuration
// ============================================================

const MAX_CACHE_SIZE = PDF_CONSTANTS.RATE_LIMIT_CACHE_MAX_SIZE;  // 5000 IPs max
const WINDOW_MS = PDF_CONSTANTS.RATE_LIMIT_WINDOW_MS;            // 1 hour
const MAX_REQUESTS = PDF_CONSTANTS.RATE_LIMIT_MAX_REQUESTS;      // 5 requests per window

/**
 * LRU Cache for rate limiting
 * Key: IP address
 * Value: { count, resetAt }
 */
const rateLimitCache = new LRUCache<string, RateLimitEntry>({
  max: MAX_CACHE_SIZE,  // Maximum 5000 IPs tracked
  ttl: WINDOW_MS,       // Entries expire after 1 hour
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

// ============================================================
// Helper Functions
// ============================================================

/**
 * Extract IP address from request
 * Checks x-forwarded-for header (for proxies/load balancers) then falls back to socket IP
 *
 * @param req - Express request object
 * @returns string - IP address
 */
function getClientIp(req: Request): string {
  // Check x-forwarded-for header (Render.com uses this)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }

  // Fallback to socket IP
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Check if IP has exceeded rate limit
 *
 * @param ip - IP address
 * @returns RateLimitResult
 */
function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitCache.get(ip);

  // No previous requests from this IP
  if (!entry) {
    const resetAt = now + WINDOW_MS;
    rateLimitCache.set(ip, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt,
    };
  }

  // Previous requests exist - check if window has expired
  if (now >= entry.resetAt) {
    // Window expired - reset count
    const resetAt = now + WINDOW_MS;
    rateLimitCache.set(ip, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt,
    };
  }

  // Within window - check if limit exceeded
  if (entry.count >= MAX_REQUESTS) {
    // Limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);  // Convert to seconds

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  // Within window and under limit - increment count
  entry.count++;
  rateLimitCache.set(ip, entry);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

// ============================================================
// Express Middleware
// ============================================================

/**
 * PDF Request Rate Limiter Middleware
 *
 * Limits PDF requests to 5 per hour per IP address
 * Returns 429 (Too Many Requests) if limit exceeded
 *
 * Response headers:
 *   - X-RateLimit-Limit: Maximum requests per window
 *   - X-RateLimit-Remaining: Requests remaining in current window
 *   - X-RateLimit-Reset: Unix timestamp when limit resets
 *   - Retry-After: Seconds until limit resets (only if 429)
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware
 */
export function pdfRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const result = checkRateLimit(ip);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt / 1000));  // Unix timestamp

  if (!result.allowed) {
    // Rate limit exceeded
    res.setHeader('Retry-After', result.retryAfter!);

    logger.warn(`[RateLimiter] PDF request rate limit exceeded for IP: ${ip}`, {
      ip,
      retryAfter: result.retryAfter,
      resetAt: new Date(result.resetAt).toISOString(),
    });

    res.status(429).json({
      error: `Rate limit exceeded. You can request ${MAX_REQUESTS} PDFs per hour. Try again in ${Math.ceil(result.retryAfter! / 60)} minutes.`,
      retryAfter: result.retryAfter,
      type: 'rate-limit',
    });
    return;
  }

  // Rate limit OK - proceed
  logger.debug(`[RateLimiter] PDF request allowed for IP: ${ip}`, {
    ip,
    remaining: result.remaining,
    resetAt: new Date(result.resetAt).toISOString(),
  });

  next();
}

// ============================================================
// Cache Statistics (for Monitoring/Debugging)
// ============================================================

/**
 * Get rate limiter cache statistics
 * Useful for monitoring dashboard and debugging
 *
 * @returns Cache stats object
 */
export function getRateLimiterStats() {
  return {
    cacheSize: rateLimitCache.size,
    maxSize: MAX_CACHE_SIZE,
    utilizationPercent: (rateLimitCache.size / MAX_CACHE_SIZE) * 100,
    windowMs: WINDOW_MS,
    maxRequestsPerWindow: MAX_REQUESTS,
  };
}

/**
 * Get rate limit status for a specific IP
 * Useful for debugging and support
 *
 * @param ip - IP address
 * @returns Rate limit status or null if IP not in cache
 */
export function getIpRateLimitStatus(ip: string): RateLimitEntry | null {
  return rateLimitCache.get(ip) || null;
}

/**
 * Clear rate limit for a specific IP (admin/support use)
 * WARNING: Use with caution - only for legitimate support requests
 *
 * @param ip - IP address to clear
 * @returns boolean - true if IP was in cache and cleared
 */
export function clearIpRateLimit(ip: string): boolean {
  const existed = rateLimitCache.has(ip);
  if (existed) {
    rateLimitCache.delete(ip);
    logger.info(`[RateLimiter] Manually cleared rate limit for IP: ${ip}`);
  }
  return existed;
}

/**
 * Clear all rate limits (admin use only)
 * WARNING: Use with extreme caution
 */
export function clearAllRateLimits(): void {
  const previousSize = rateLimitCache.size;
  rateLimitCache.clear();
  logger.warn(`[RateLimiter] Manually cleared all rate limits (${previousSize} entries)`);
}

// ============================================================
// Export Default Middleware
// ============================================================

export default pdfRateLimiter;
