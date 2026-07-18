import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function test() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  const u = users?.users.find(u => u.email === 'admin@yazal-erp.com');
  console.log('User exists?', !!u);
  if (u) {
    const res = await supabase.auth.admin.updateUserById(u.id, { password: 'password1234' });
    console.log('Update password error?', res.error);
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: 'admin@yazal-erp.com',
      password: 'password1234'
    });
    console.log('Sign in error:', signinError?.message);
  }
}
test();
