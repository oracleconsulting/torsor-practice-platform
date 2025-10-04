import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl);
  console.log('VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// Create and export the Supabase client instance
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'sb-oracle-auth-token', // Changed to avoid conflicts
        storage: window.localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
  }
  return supabaseInstance;
})();

// Export a function to get the instance
export const getSupabase = () => supabase;

// Export a function that creates a new client instance if needed
export function createSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
} 