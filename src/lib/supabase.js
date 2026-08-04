import { createClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_ID = 'yblsagikbnaznrgjuvjz';
const DEFAULT_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const DEFAULT_ANON_KEY = 'sb_publishable_6RsBrUAxCJr6K7-pGEhHYA_ZklIRiwF';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return true; // Configured with live MTA Ghana Supabase Project ID: yblsagikbnaznrgjuvjz
};
