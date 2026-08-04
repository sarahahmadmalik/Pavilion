import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yblsagikbnaznrgjuvjz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6RsBrUAxCJr6K7-pGEhHYA_ZklIRiwF';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  console.log('🔗 Connecting to Supabase project: yblsagikbnaznrgjuvjz...');
  try {
    const { data, error } = await supabase.from('users').select('*').limit(5);
    if (error) {
      console.log('ℹ️ Table "users" notice (you can apply supabase/schema.sql in your Supabase SQL Editor):', error.message);
    } else {
      console.log('✅ Supabase connected successfully! Existing users count:', data.length);
    }
  } catch (err) {
    console.error('❌ Supabase connection error:', err);
  }
}

testConnection();
