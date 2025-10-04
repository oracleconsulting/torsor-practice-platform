import { useState, useEffect } from 'react';
import { AccountancyApiService, ApiResponse } from '@/services/accountancyApi';
import { useToast } from '@/components/ui/use-toast';

export function useAccountancyData<T>(
  fetchFunction: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchFunction();
        
        if (!mounted) return;

        if (response.error) {
          setError(response.error);
          
          // Show toast for specific errors
          if (response.status === 404) {
            toast({
              title: "Data not found",
              description: "The requested data is not available yet.",
              variant: "default"
            });
          } else if (response.status === 500) {
            toast({
              title: "Server error",
              description: "There was a problem loading the data. Please try again later.",
              variant: "destructive"
            });
          }
        } else {
          setData(response.data || null);
        }
      } catch (err) {
        if (!mounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { data, loading, error, refetch: () => fetchData() };
}