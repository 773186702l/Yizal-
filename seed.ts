import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase Config');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const accounts = [
    {username:'laithhazza1@gmail.com', password:'1234', role:'admin', name:'ليث هزاع'},
    {username:'laithhazza09@gmail.com', password:'1234', role:'admin', name:'ليث هزاع'},
    {username:'admin', password:'1234', role:'admin', name:'محمد الأمين'},
    {username:'accountant1', password:'1234', role:'accountant', name:'سارة يوسف'},
    {username:'sales1', password:'1234', role:'sales', name:'خالد عمر'},
    {username:'exec1', password:'1234', role:'executor', name:'نور خليفة'},
];

async function seed() {
  console.log('Seeding Supabase...');

  for (const account of accounts) {
    const email = account.username.includes('@') ? account.username : `${account.username}@yazal-erp.com`;
    console.log(`Processing user: ${email}`);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.name }
    });

    if (authError && authError.message !== 'A user with this email address has already been registered') {
      console.error(`Error creating auth for ${email}:`, authError.message);
      continue;
    }

    let uid = authData?.user?.id;

    if (!uid) {
        // Try to fetch existing user
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users.find(u => u.email === email);
        if (existing) uid = existing.id;
    }

    if (uid) {
        // Upsert to users table
        const { error: dbError } = await supabase.from('users').upsert({
            uid,
            username: account.username,
            role: account.role,
            name: account.name,
            password: account.password,
            email: email,
            
        }, { onConflict: 'username' });

        if (dbError) {
            console.error(`Error creating db profile for ${email}:`, dbError.message);
        } else {
            console.log(`Successfully seeded profile for ${email}`);
        }
    }
  }
  console.log('Seeding complete.');
}

seed().catch(console.error);
