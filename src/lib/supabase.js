import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing in .env!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

