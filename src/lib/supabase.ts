import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured', code: 'CONFIG_MISSING' } }),
        upsert: () => Promise.resolve({ error: { message: 'Supabase not configured', code: 'CONFIG_MISSING' } }),
        insert: () => Promise.resolve({ error: { message: 'Supabase not configured', code: 'CONFIG_MISSING' } }),
        delete: () => Promise.resolve({ error: { message: 'Supabase not configured', code: 'CONFIG_MISSING' } }),
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured', code: 'CONFIG_MISSING' } }),
          delete: () => Promise.resolve({ error: { message: 'Supabase not configured', code: 'CONFIG_MISSING' } }),
        })
      }),
      auth: {
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        admin: {
          createUser: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          deleteUser: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        }
      }
    } as any;
