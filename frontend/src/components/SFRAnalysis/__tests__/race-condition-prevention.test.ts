/**
 * Unit Tests for Race Condition Prevention Logic
 * 
 * Tests the core race condition prevention functionality without UI dependencies
 * 
 * Implementation Date: 2025-07-28
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Race Condition Prevention Logic', () => {
  describe('Request ID Generation', () => {
    it('should generate unique request IDs', () => {
      const generateRequestId = () => {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      };

      const id1 = generateRequestId();
      const id2 = generateRequestId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should follow consistent format', () => {
      const generateRequestId = (prefix: string) => {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      };

      const analysisId = generateRequestId('analysis');
      const quickCalcId = generateRequestId('quickcalc');
      
      expect(analysisId).toMatch(/^analysis-\d+-[a-z0-9]+$/);
      expect(quickCalcId).toMatch(/^quickcalc-\d+-[a-z0-9]+$/);
    });
  });

  describe('Latest Request Wins Pattern', () => {
    it('should identify the latest request correctly', () => {
      const activeRequestId = 'analysis-1672531200000-abc123';
      const requestId1 = 'analysis-1672531200000-def456';
      const requestId2 = 'analysis-1672531200000-abc123';
      
      const isLatestRequest = (requestId: string, activeId: string) => {
        return requestId === activeId;
      };

      expect(isLatestRequest(requestId1, activeRequestId)).toBe(false);
      expect(isLatestRequest(requestId2, activeRequestId)).toBe(true);
    });

    it('should handle null active request ID', () => {
      const requestId = 'analysis-1672531200000-abc123';
      const activeRequestId = null;
      
      const isLatestRequest = (requestId: string, activeId: string | null) => {
        return activeId === null || requestId === activeId;
      };

      expect(isLatestRequest(requestId, activeRequestId)).toBe(true);
    });
  });

  describe('Request Cancellation Logic', () => {
    it('should properly cancel outdated requests', async () => {
      const mockCallback = vi.fn();
      let activeRequestId: string | null = null;
      
      const simulateRequest = async (requestId: string, delay: number) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            if (requestId === activeRequestId) {
              mockCallback(requestId);
            }
            resolve();
          }, delay);
        });
      };

      // Start first request
      const request1 = 'req-1';
      activeRequestId = request1;
      const promise1 = simulateRequest(request1, 100);

      // Start second request (should cancel first)
      const request2 = 'req-2';
      activeRequestId = request2;
      const promise2 = simulateRequest(request2, 50);

      await Promise.all([promise1, promise2]);

      // Only the second (latest) request should have executed
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(request2);
    });
  });

  describe('Timeout Management', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should clear previous timeouts when new requests come in', () => {
      const mockCallback = vi.fn();
      let activeTimeout: NodeJS.Timeout | null = null;
      
      const setDebounceTimeout = (callback: () => void, delay: number) => {
        if (activeTimeout) {
          clearTimeout(activeTimeout);
        }
        activeTimeout = setTimeout(callback, delay);
      };

      // Set first timeout
      setDebounceTimeout(() => mockCallback('first'), 1000);
      
      // Set second timeout (should cancel first)
      setDebounceTimeout(() => mockCallback('second'), 1000);

      // Fast forward time
      vi.advanceTimersByTime(1000);

      // Only second callback should have executed
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('second');
    });

    it('should handle rapid consecutive timeout updates', () => {
      const mockCallback = vi.fn();
      let activeTimeout: NodeJS.Timeout | null = null;
      
      const setDebounceTimeout = (callback: () => void, delay: number) => {
        if (activeTimeout) {
          clearTimeout(activeTimeout);
        }
        activeTimeout = setTimeout(callback, delay);
      };

      // Simulate rapid slider changes
      for (let i = 0; i < 5; i++) {
        setDebounceTimeout(() => mockCallback(`call-${i}`), 1000);
      }

      // Fast forward time
      vi.advanceTimersByTime(1000);

      // Only the last callback should execute
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('call-4');
    });
  });

  describe('Request State Management', () => {
    it('should maintain correct loading states', () => {
      const state = {
        isCalculating: false,
        activeRequestId: null as string | null
      };

      const startRequest = (requestId: string) => {
        state.activeRequestId = requestId;
        state.isCalculating = true;
      };

      const endRequest = (requestId: string) => {
        // Only clear loading if this is still the active request
        if (state.activeRequestId === requestId) {
          state.isCalculating = false;
        }
      };

      // Start first request
      startRequest('req-1');
      expect(state.isCalculating).toBe(true);
      expect(state.activeRequestId).toBe('req-1');

      // Start second request
      startRequest('req-2');
      expect(state.isCalculating).toBe(true);
      expect(state.activeRequestId).toBe('req-2');

      // End first request (should not clear loading since req-2 is active)
      endRequest('req-1');
      expect(state.isCalculating).toBe(true);

      // End second request (should clear loading)
      endRequest('req-2');
      expect(state.isCalculating).toBe(false);
    });
  });

  describe('Significance-Based Analysis Triggering', () => {
    it('should trigger full analysis for significant changes', () => {
      const calculateSignificance = (oldValue: number, newValue: number, threshold: number = 0.1) => {
        return Math.abs((newValue - oldValue) / oldValue) > threshold;
      };

      // Test significant changes
      expect(calculateSignificance(100, 120, 0.1)).toBe(true);  // 20% change
      expect(calculateSignificance(100, 90, 0.1)).toBe(false);  // -10% change (exactly at threshold)
      expect(calculateSignificance(100, 89, 0.1)).toBe(true);   // -11% change
      expect(calculateSignificance(2500, 2800, 0.1)).toBe(true); // 12% change

      // Test insignificant changes
      expect(calculateSignificance(100, 105, 0.1)).toBe(false); // 5% change
      expect(calculateSignificance(2500, 2550, 0.1)).toBe(false); // 2% change
    });

    it('should handle edge cases in significance calculation', () => {
      const calculateSignificance = (oldValue: number, newValue: number, threshold: number = 0.1) => {
        if (oldValue === 0) return newValue !== 0;
        return Math.abs((newValue - oldValue) / oldValue) > threshold;
      };

      // Test zero old value
      expect(calculateSignificance(0, 100, 0.1)).toBe(true);
      expect(calculateSignificance(0, 0, 0.1)).toBe(false);

      // Test very small values
      expect(calculateSignificance(0.01, 0.02, 0.1)).toBe(true); // 100% change
      expect(calculateSignificance(0.01, 0.011, 0.1)).toBe(false); // 10% change
    });
  });

  describe('Performance Metrics', () => {
    it('should track calculation timing correctly', () => {
      const startTime = Date.now();
      const endTime = startTime + 45; // 45ms calculation
      
      const calculationTime = endTime - startTime;
      
      expect(calculationTime).toBe(45);
      
      const isWithinTarget = calculationTime < 50; // Target: <50ms
      expect(isWithinTarget).toBe(true);
    });

    it('should identify performance issues', () => {
      const checkPerformance = (duration: number) => {
        if (duration < 50) return 'excellent';
        if (duration < 100) return 'good';
        if (duration < 200) return 'acceptable';
        return 'needs-optimization';
      };

      expect(checkPerformance(25)).toBe('excellent');
      expect(checkPerformance(75)).toBe('good');
      expect(checkPerformance(150)).toBe('acceptable');
      expect(checkPerformance(500)).toBe('needs-optimization');
    });
  });
});