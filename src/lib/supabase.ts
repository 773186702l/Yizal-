import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const isSupabaseConfigured = () => {
  const isJwt = (key: string) => key.split('.').length === 3;
  const isSbKey = (key: string) => key.startsWith('sb_');
  const hasUrl = !!supabaseUrl && supabaseUrl.startsWith('https://');
  const hasKey = !!supabaseAnonKey && (isJwt(supabaseAnonKey) || isSbKey(supabaseAnonKey));
  const configured = hasUrl && hasKey;
  
  if (!configured && typeof window !== 'undefined') {
    console.group('Supabase Client Configuration Status');
    console.log('Configured:', configured);
    console.log('URL Present:', !!supabaseUrl);
    console.log('URL Valid:', hasUrl);
    console.log('Anon Key Present:', !!supabaseAnonKey);
    console.log('Anon Key Valid:', hasKey);
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
        console.warn('Supabase URL must start with https://. Current:', supabaseUrl);
    }
    if (supabaseAnonKey && !isJwt(supabaseAnonKey) && !isSbKey(supabaseAnonKey)) {
        console.warn('Supabase Anon Key must be a valid JWT or start with sb_. Prefix:', supabaseAnonKey.substring(0, 10));
    }
    console.groupEnd();
  }
  
  return configured;
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
