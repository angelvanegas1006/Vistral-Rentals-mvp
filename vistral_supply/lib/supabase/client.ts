"use client";

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';
import { config, getSupabaseProjectName } from '@/lib/config/environment';
import { isDemoMode } from '@/lib/utils';

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

// Validate environment variables only if not in demo mode
if (!isDemoMode() && (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '')) {
  const errorMessage = 
    'Missing Supabase environment variables. ' +
    `Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.\n` +
    `Current environment: ${config.environment}\n` +
    `Expected Supabase project: ${getSupabaseProjectName()}\n` +
    `Supabase URL: ${supabaseUrl ? 'Set' : 'Missing'}\n` +
    `Supabase Anon Key: ${supabaseAnonKey ? 'Set' : 'Missing'}`;
  
  if (config.isDevelopment) {
    console.warn(`⚠️ ${errorMessage}`);
  }
}

export function createClient() {
  // In demo mode, return a mock client that won't crash
  if (isDemoMode()) {
    console.log('[Supabase Client] 🎨 Demo mode: Using mock client');
    // Return a minimal mock client
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
    } as any;
  }

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '') {
    throw new Error('Cannot create Supabase client: missing required environment variables');
  }
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'x-client-info': `vistral-supply-${config.environment}`,
          'x-supabase-project': getSupabaseProjectName(),
        },
      },
    }
  );
}
