import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

declare const supabase: SupabaseClient<Database>;
export { supabase };

export function createClient(): SupabaseClient<Database>; 