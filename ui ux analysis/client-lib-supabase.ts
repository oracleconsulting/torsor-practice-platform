/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// SINGLETON: This must be the only place in the client app that calls createClient().
// Multiple GoTrueClient instances cause auth race conditions (SIGNED_IN carousel, timeouts).
// All other files must import: import { supabase } from '@/lib/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

console.log('Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING');
console.log('Supabase Key:', supabaseAnonKey ? 'Present (' + supabaseAnonKey.length + ' chars)' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

