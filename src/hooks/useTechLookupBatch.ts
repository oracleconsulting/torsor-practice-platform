import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TechLookupBatchResponse } from '../types/tech-stack';

export function useTechLookupBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lookupBatch = useCallback(async (productNames: string[]): Promise<TechLookupBatchResponse['results']> => {
    if (!productNames.length) return {};
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<TechLookupBatchResponse>('discover-sa-tech-product', {
        body: { action: 'lookup_batch', productNames },
      });
      if (invokeError) throw new Error(invokeError.message || 'Invoke failed');
      return data?.results ?? {};
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Lookup batch failed');
      setError(err);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookupBatch, loading, error };
}
