import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TechProduct } from '../types/tech-stack';

export function useTechProducts(activeOnly = true) {
  const [products, setProducts] = useState<TechProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('sa_tech_products')
        .select('*')
        .order('primary_category', { ascending: true });
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      const { data, error: e } = await query;
      if (e) throw e;
      setProducts((data as TechProduct[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load tech products'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { products, loading, error, refetch };
}
