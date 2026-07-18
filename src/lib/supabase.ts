import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const isSupabaseConfigured = () => {
  // Always return true to enable database persistence and login via the server-side API proxy.
  // This allows the application to work seamlessly in both preview and published builds.
  return true;
};

const checkClientConfigured = () => {
  const isJwt = (key: string) => key.split('.').length === 3;
  const isSbKey = (key: string) => key.startsWith('sb_');
  const hasUrl = !!supabaseUrl && supabaseUrl.startsWith('https://');
  const hasKey = !!supabaseAnonKey && (isJwt(supabaseAnonKey) || isSbKey(supabaseAnonKey));
  return hasUrl && hasKey;
};

export const supabase = checkClientConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: { message: 'Supabase client direct connection not configured', code: 'CONFIG_MISSING' } }),
        upsert: () => Promise.resolve({ error: { message: 'Supabase client direct connection not configured', code: 'CONFIG_MISSING' } }),
        insert: () => Promise.resolve({ error: { message: 'Supabase client direct connection not configured', code: 'CONFIG_MISSING' } }),
        delete: () => Promise.resolve({ error: { message: 'Supabase client direct connection not configured', code: 'CONFIG_MISSING' } }),
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Supabase client direct connection not configured', code: 'CONFIG_MISSING' } }),
          delete: () => Promise.resolve({ error: { message: 'Supabase client direct connection not configured', code: 'CONFIG_MISSING' } }),
        })
      }),
      auth: {
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase client direct connection not configured', code: 'CONFIG_MISSING' } }),
        setSession: () => Promise.resolve({ data: null, error: null }),
        admin: {
          createUser: () => Promise.resolve({ data: null, error: { message: 'Supabase client direct connection not configured' } }),
          deleteUser: () => Promise.resolve({ error: { message: 'Supabase client direct connection not configured' } }),
        }
      }
    } as any;
