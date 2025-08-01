/**
 * useDebounce Hook - Comprehensive debouncing solution for interactive features
 * 
 * Provides multiple debouncing strategies:
 * 1. Standard debounce - delays execution until inactivity period
 * 2. Throttle debounce - limits execution frequency  
 * 3. Adaptive debounce - adjusts delay based on operation type
 * 4. Request tracking debounce - prevents race conditions
 */

import { useCallback, useRef, useEffect, useState } from 'react';

export interface DebounceOptions {
  delay: number;
  immediate?: boolean;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

export interface AdaptiveDebounceOptions {
  quickDelay: number;      // For quick calculations (50-100ms)
  standardDelay: number;   // For form inputs (300-500ms) 
  longDelay: number;       // For full analysis (1000-2000ms)
  operationType: 'quick' | 'standard' | 'long';
}

export interface RequestTrackingOptions {
  generateRequestId?: () => string;
  onRequestStart?: (requestId: string) => void;
  onRequestComplete?: (requestId: string) => void;
  onRequestCancelled?: (requestId: string) => void;
}

/**
 * Standard debounce hook - delays execution until inactivity period
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  func: T,
  options: DebounceOptions
): [(...args: Parameters<T>) => void, () => void] => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const funcRef = useRef(func);
  const lastCallRef = useRef<number>(0);

  // Update function reference
  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const debouncedFunc = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    // Clear existing timeout
    cancel();

    // Execute immediately if immediate flag is set and this is the first call
    if (options.immediate && lastCallRef.current === 0) {
      funcRef.current(...args);
      lastCallRef.current = now;
      return;
    }

    // Execute immediately if leading edge is enabled
    if (options.leading && timeSinceLastCall >= options.delay) {
      funcRef.current(...args);
      lastCallRef.current = now;
    }

    // Set up delayed execution
    timeoutRef.current = setTimeout(() => {
      const shouldExecute = options.trailing !== false;
      
      // Check maxWait constraint
      if (options.maxWait && (Date.now() - lastCallRef.current) >= options.maxWait) {
        if (shouldExecute) {
          funcRef.current(...args);
        }
        lastCallRef.current = Date.now();
        timeoutRef.current = null;
        return;
      }

      if (shouldExecute) {
        funcRef.current(...args);
      }
      lastCallRef.current = Date.now();
      timeoutRef.current = null;
    }, options.delay);
  }, [options, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return [debouncedFunc, cancel];
};

/**
 * Throttle hook - limits execution frequency
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): [(...args: Parameters<T>) => void, () => void] => {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const funcRef = useRef(func);

  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const throttledFunc = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= delay) {
      // Execute immediately
      funcRef.current(...args);
      lastCallRef.current = now;
    } else {
      // Schedule for later execution
      cancel();
      timeoutRef.current = setTimeout(() => {
        funcRef.current(...args);
        lastCallRef.current = Date.now();
        timeoutRef.current = null;
      }, delay - timeSinceLastCall);
    }
  }, [delay, cancel]);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  return [throttledFunc, cancel];
};

/**
 * Adaptive debounce hook - adjusts delay based on operation type
 */
export const useAdaptiveDebounce = <T extends (...args: any[]) => any>(
  func: T,
  options: AdaptiveDebounceOptions
): [(...args: Parameters<T>) => void, () => void, (type: 'quick' | 'standard' | 'long') => void] => {
  const [currentType, setCurrentType] = useState(options.operationType);
  
  const getDelay = useCallback(() => {
    switch (currentType) {
      case 'quick': return options.quickDelay;
      case 'standard': return options.standardDelay;
      case 'long': return options.longDelay;
      default: return options.standardDelay;
    }
  }, [currentType, options]);

  const [debouncedFunc, cancel] = useDebounce(func, {
    delay: getDelay(),
    trailing: true
  });

  const setOperationType = useCallback((type: 'quick' | 'standard' | 'long') => {
    cancel(); // Cancel existing timeout when changing type
    setCurrentType(type);
  }, [cancel]);

  return [debouncedFunc, cancel, setOperationType];
};

/**
 * Request tracking debounce hook - prevents race conditions
 */
export const useRequestTrackingDebounce = <T extends (...args: any[]) => Promise<any>>(
  func: T,
  options: DebounceOptions & RequestTrackingOptions
): [(...args: Parameters<T>) => void, () => void, string | null] => {
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const funcRef = useRef(func);
  const requestCounterRef = useRef(0);

  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const generateRequestId = useCallback(() => {
    if (options.generateRequestId) {
      return options.generateRequestId();
    }
    requestCounterRef.current += 1;
    return `req-${Date.now()}-${requestCounterRef.current}`;
  }, [options.generateRequestId]);

  const wrappedFunc = useCallback(async (...args: Parameters<T>) => {
    const requestId = generateRequestId();
    setActiveRequestId(requestId);
    
    options.onRequestStart?.(requestId);

    try {
      const result = await funcRef.current(...args);
      
      // Only process result if this is still the active request
      setActiveRequestId(current => {
        if (current === requestId) {
          options.onRequestComplete?.(requestId);
          return null;
        } else {
          options.onRequestCancelled?.(requestId);
          return current;
        }
      });

      return result;
    } catch (error) {
      setActiveRequestId(current => {
        if (current === requestId) {
          options.onRequestComplete?.(requestId);
          return null;
        }
        return current;
      });
      throw error;
    }
  }, [generateRequestId, options]);

  const [debouncedFunc, cancel] = useDebounce(wrappedFunc, {
    delay: options.delay,
    immediate: options.immediate,
    maxWait: options.maxWait,
    leading: options.leading,
    trailing: options.trailing
  });

  const cancelWithCleanup = useCallback(() => {
    cancel();
    if (activeRequestId) {
      options.onRequestCancelled?.(activeRequestId);
      setActiveRequestId(null);
    }
  }, [cancel, activeRequestId, options]);

  return [debouncedFunc, cancelWithCleanup, activeRequestId];
};

/**
 * Input debounce hook - specialized for form inputs
 */
export const useInputDebounce = <T>(
  value: T,
  callback: (value: T) => void,
  delay: number = 300
): [T, (newValue: T) => void] => {
  const [displayValue, setDisplayValue] = useState(value);
  
  const [debouncedCallback] = useDebounce(callback, { delay, trailing: true });

  const handleChange = useCallback((newValue: T) => {
    setDisplayValue(newValue);
    debouncedCallback(newValue);
  }, [debouncedCallback]);

  // Update display value when external value changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return [displayValue, handleChange];
};

/**
 * Slider debounce hook - specialized for slider components
 */
export const useSliderDebounce = (
  onQuickChange: (value: number) => Promise<any>,
  onFullChange: (value: number) => Promise<any>,
  options: {
    quickDelay?: number;
    fullDelay?: number;
    significantChangeThreshold?: number;
  } = {}
): {
  handleSliderChange: (value: number, originalValue: number) => void;
  isCalculating: boolean;
  activeRequestId: string | null;
  cancel: () => void;
} => {
  const [isCalculating, setIsCalculating] = useState(false);
  
  const {
    quickDelay = 50,
    fullDelay = 1500,
    significantChangeThreshold = 0.1
  } = options;

  // Quick calculation for immediate feedback
  const [quickDebounced, cancelQuick, quickRequestId] = useRequestTrackingDebounce(
    onQuickChange,
    {
      delay: quickDelay,
      onRequestStart: () => setIsCalculating(true),
      onRequestComplete: () => setIsCalculating(false),
      onRequestCancelled: () => setIsCalculating(false)
    }
  );

  // Full analysis for significant changes
  const [fullDebounced, cancelFull, fullRequestId] = useRequestTrackingDebounce(
    onFullChange,
    {
      delay: fullDelay,
      onRequestStart: (id) => console.log(`Starting full analysis: ${id}`),
      onRequestComplete: (id) => console.log(`Completed full analysis: ${id}`),
      onRequestCancelled: (id) => console.log(`Cancelled full analysis: ${id}`)
    }
  );

  const handleSliderChange = useCallback((value: number, originalValue: number) => {
    const percentChange = Math.abs((value - originalValue) / originalValue);
    
    // Always do quick calculation for immediate feedback
    quickDebounced(value);
    
    // Only do full analysis for significant changes
    if (percentChange >= significantChangeThreshold) {
      fullDebounced(value);
    }
  }, [quickDebounced, fullDebounced, significantChangeThreshold]);

  const cancel = useCallback(() => {
    cancelQuick();
    cancelFull();
    setIsCalculating(false);
  }, [cancelQuick, cancelFull]);

  const activeRequestId = quickRequestId || fullRequestId;

  return {
    handleSliderChange,
    isCalculating,
    activeRequestId,
    cancel
  };
};

/**
 * API debounce hook - specialized for API calls
 */
export const useAPIDebounce = <T extends (...args: any[]) => Promise<any>>(
  apiCall: T,
  options: {
    delay?: number;
    retryAttempts?: number;
    retryDelay?: number;
  } = {}
): {
  execute: (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | null>;
  isLoading: boolean;
  error: Error | null;
  cancel: () => void;
  activeRequestId: string | null;
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const {
    delay = 300,
    retryAttempts = 2,
    retryDelay = 1000
  } = options;

  const retryCall = useCallback(async (func: T, args: Parameters<T>, attempt: number = 0): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await func(...args);
    } catch (err) {
      if (attempt < retryAttempts) {
        console.log(`API call failed, retrying (${attempt + 1}/${retryAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return retryCall(func, args, attempt + 1);
      }
      throw err;
    }
  }, [retryAttempts, retryDelay]);

  const wrappedApiCall = useCallback(async (...args: Parameters<T>) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await retryCall(apiCall, args);
      setIsLoading(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('API call failed');
      setError(error);
      setIsLoading(false);
      throw error;
    }
  }, [apiCall, retryCall]);

  const [debouncedExecute, cancel, activeRequestId] = useRequestTrackingDebounce(
    wrappedApiCall,
    { delay }
  );

  const execute = useCallback(async (...args: Parameters<T>) => {
    try {
      debouncedExecute(...args);
      // Since debouncedExecute is now void, we can't return its result
      // The actual result will be handled by the API call itself
      return null;
    } catch (err) {
      console.error('Debounced API call failed:', err);
      return null;
    }
  }, [debouncedExecute]);

  return {
    execute,
    isLoading,
    error,
    cancel,
    activeRequestId
  };
};