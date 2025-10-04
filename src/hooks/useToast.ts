import { useCallback } from 'react';
import { toast } from 'sonner';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const showToast = useCallback((options: ToastOptions) => {
    if (options.variant === 'destructive') {
      toast.error(options.title, {
        description: options.description,
        duration: options.duration || 3000
      });
    } else {
      toast(options.title, {
        description: options.description,
        duration: options.duration || 3000
      });
    }
  }, []);

  return { toast: showToast };
} 