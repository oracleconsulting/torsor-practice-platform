/**
 * Hook for fetching P&L comparison data
 * Provides period vs budget, prior month, and prior year comparisons
 */

import { useState, useEffect, useCallback } from 'react';
import { BIComparisonService, type FullComparisonData } from '../services/business-intelligence';

interface UsePLComparisonOptions {
  enabled?: boolean;
}

interface UsePLComparisonResult {
  comparison: FullComparisonData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePLComparison(
  periodId: string | null | undefined,
  options: UsePLComparisonOptions = {}
): UsePLComparisonResult {
  const { enabled = true } = options;
  
  const [comparison, setComparison] = useState<FullComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchComparison = useCallback(async () => {
    if (!periodId || !enabled) {
      setComparison(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await BIComparisonService.calculateComparisons(periodId);
      setComparison(data);
    } catch (err) {
      console.error('[usePLComparison] Error fetching comparison:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comparison data');
      setComparison(null);
    } finally {
      setLoading(false);
    }
  }, [periodId, enabled]);
  
  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);
  
  return {
    comparison,
    loading,
    error,
    refetch: fetchComparison
  };
}

export default usePLComparison;


