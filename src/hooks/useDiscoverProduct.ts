import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { DiscoverProductRequest, DiscoverProductResponse } from '../types/tech-stack';

export function useDiscoverProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const discover = useCallback(async (req: DiscoverProductRequest): Promise<DiscoverProductResponse> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<DiscoverProductResponse>('discover-sa-tech-product', {
        body: req,
      });
      if (invokeError) throw new Error(invokeError.message || 'Invoke failed');
      if (!data) throw new Error('No response from discover-sa-tech-product');
      return data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Discover failed');
      setError(err);
      return {
        status: 'error',
        confidence: 'low',
        is_new: false,
        message: err.message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { discover, loading, error };
}
