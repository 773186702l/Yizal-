import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@yazal-erp.com',
    password: 'user1234'
  });
  console.log('Anon sign in error:', error?.message);
}
test();
