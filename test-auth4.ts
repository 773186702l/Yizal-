import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@yazal-erp.com',
    password: 'user1234'
  });
  console.log('Service role sign in error:', error?.message);
  console.log('Has session:', !!data?.session);
}
test();
