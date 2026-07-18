import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function test() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const u = users?.users.find(u => u.email === 'admin@yazal-erp.com');
  if (u) {
    const res = await supabase.auth.admin.updateUserById(u.id, { password: 'user1234' });
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: 'admin@yazal-erp.com',
      password: 'user1234'
    });
    console.log('Sign in with user1234 error:', signinError?.message);
    
    // Also update the database users table
    await supabase.from('users').update({password: 'user1234'}).eq('uid', u.id);
  }
}
test();
