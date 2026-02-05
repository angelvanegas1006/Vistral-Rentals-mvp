"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/utils';

// Mock user for demo mode
const MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'demo@supply.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(isDemoMode() ? MOCK_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!isDemoMode());
  const router = useRouter();

  // In demo mode, ensure mock auth is set immediately
  useEffect(() => {
    if (isDemoMode()) {
      setUser(MOCK_USER);
      setSession(null);
      setLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    // Skip if in demo mode
    if (isDemoMode()) {
      return;
    }

    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let subscription: { unsubscribe: () => void } | null = null;

    // Aggressive timeout: 3 seconds max
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('[useSupabaseAuth] ⚠️ Auth initialization timeout after 3s, setting loading to false');
        setLoading(false);
        // Don't set user/session to null here - let the actual auth call handle it
      }
    }, 3000);

    async function initializeAuth() {
      try {
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        // Clear timeout since we got a response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (error) {
          console.warn('[useSupabaseAuth] ⚠️ Error getting session:', error);
          // On error, assume no session
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
        } else {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      } catch (err: any) {
        console.warn('[useSupabaseAuth] ⚠️ Exception getting session:', err);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    }

    // Start auth initialization
    initializeAuth().catch((err) => {
      console.error('[useSupabaseAuth] ❌ Unhandled error in initializeAuth:', err);
      if (mounted) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    try {
      const supabase = createClient();
      const authStateChange = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Clear timeout if we get an auth state change
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        }
      });
      
      subscription = authStateChange.data.subscription;
    } catch (err) {
      console.warn('[useSupabaseAuth] ⚠️ Error setting up auth state listener:', err);
      // If listener setup fails, at least ensure loading is false
      if (mounted) {
        setLoading(false);
      }
    }

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router]);

  const signOut = useCallback(async () => {
    if (isDemoMode()) {
      console.log('[Demo] Sign out clicked');
      router.push('/login');
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }, [router]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (isDemoMode()) {
      return null;
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  return {
    user,
    session,
    loading,
    signOut,
    getAccessToken,
    isAuthenticated: !!user,
  };
}
