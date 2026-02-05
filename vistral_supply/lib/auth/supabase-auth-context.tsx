"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import type { User, Session } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/utils';

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  isAuthenticated: boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  // In demo mode, provide mock auth immediately
  if (isDemoMode()) {
    const mockAuth: SupabaseAuthContextType = {
      user: {
        id: 'mock-user-id',
        email: 'demo@supply.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User,
      session: null,
      loading: false, // Important: set to false immediately
      signOut: async () => {
        console.log('[Demo] Sign out clicked');
      },
      getAccessToken: async () => null,
      isAuthenticated: true,
    };

    return (
      <SupabaseAuthContext.Provider value={mockAuth}>
        {children}
      </SupabaseAuthContext.Provider>
    );
  }

  // Normal mode: use real Supabase auth
  // Always render children, even if auth is loading or fails
  try {
    const auth = useSupabaseAuth();
    return (
      <SupabaseAuthContext.Provider value={auth}>
        {children}
      </SupabaseAuthContext.Provider>
    );
  } catch (error) {
    // Error boundary: if auth hook fails, provide fallback auth
    console.error('[SupabaseAuthProvider] ❌ Error in auth hook:', error);
    const fallbackAuth: SupabaseAuthContextType = {
      user: null,
      session: null,
      loading: false, // Set to false so app can continue
      signOut: async () => {
        console.log('[Fallback] Sign out');
      },
      getAccessToken: async () => null,
      isAuthenticated: false,
    };
    
    return (
      <SupabaseAuthContext.Provider value={fallbackAuth}>
        {children}
      </SupabaseAuthContext.Provider>
    );
  }
}

export function useSupabaseAuthContext() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuthContext must be used within a SupabaseAuthProvider');
  }
  return context;
}
