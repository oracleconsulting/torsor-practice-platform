/**
 * Performance Optimization Utilities
 */

import { lazy, useEffect } from 'react';

// Code splitting helper with minimum delay
export const lazyLoad = (importFn: () => Promise<any>) => {
  return lazy(() => {
    return Promise.all([
      importFn(),
      new Promise(resolve => setTimeout(resolve, 300)) // Minimum delay for smooth UX
    ]).then(([moduleExports]) => moduleExports);
  });
};

// Image optimization (placeholder for CDN integration)
export const optimizeImage = (src: string, width?: number, quality: number = 80): string => {
  // TODO: Integrate with Cloudinary or similar service
  // For now, return original
  if (width) {
    // Could append query params for responsive images
    return `${src}?w=${width}&q=${quality}`;
  }
  return src;
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  options?: IntersectionObserverInit
) => {
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, options);

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, callback, options]);
};

// Measure performance
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${(end - start).toFixed(2)}ms`);
};

// Memoize expensive calculations
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Prefetch data
export const prefetch = async (url: string) => {
  try {
    const response = await fetch(url);
    await response.json();
    // Data is now in browser cache
  } catch (error) {
    console.error('Prefetch failed:', error);
  }
};

// Check if device has slow connection
export const isSlowConnection = (): boolean => {
  const connection = (navigator as any).connection;
  if (!connection) return false;
  
  return (
    connection.effectiveType === '2g' ||
    connection.effectiveType === 'slow-2g' ||
    connection.saveData
  );
};

// Virtual scroll helper
export const calculateVisibleRange = (
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  totalItems: number,
  overscan: number = 3
): { start: number; end: number } => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);
  
  return { start, end };
};

export default {
  lazyLoad,
  optimizeImage,
  debounce,
  throttle,
  useIntersectionObserver,
  measurePerformance,
  memoize,
  prefetch,
  isSlowConnection,
  calculateVisibleRange
};

