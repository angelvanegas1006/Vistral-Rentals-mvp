"use client";

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { useSupabaseAuthContext } from './supabase-auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import type { User } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/utils';

type AppRole = Database['public']['Enums']['app_role'];

interface AppUser {
  id: string;
  email: string;
  role: AppRole;
}

interface AppAuthContextType {
  user: AppUser | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  isAnalyst: boolean;
  isRenovatorAnalyst: boolean;
  isSupplyLead: boolean;
  isRenoLead: boolean;
  isScouter: boolean;
  isProjectAnalyst: boolean;
  isProjectLead: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
}

const AppAuthContext = createContext<AppAuthContextType | undefined>(undefined);

// Mock user for frontend-only testing
const MOCK_USER: AppUser = {
  id: 'mock-user-id',
  email: 'demo@supply.com',
  role: 'supply_admin',
};

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const authContext = useSupabaseAuthContext();
  const supabaseUser: User | null = authContext.user;
  const supabaseLoading = authContext.loading;
  
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo mode: use mock user immediately
    if (isDemoMode()) {
      console.log('[AppAuthProvider] 🎨 Demo mode: Using mock user');
      setAppUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // Timeout to prevent infinite loading (3 seconds max)
    const timeoutId = setTimeout(() => {
      console.warn('[AppAuthProvider] ⚠️ Timeout waiting for auth, setting loading to false');
      setLoading(false);
      // If no user after timeout, ensure appUser is null
      if (!supabaseUser) {
        setAppUser(null);
      }
    }, 3000);

    // Wait for Supabase auth to finish loading
    if (supabaseLoading) {
      return () => clearTimeout(timeoutId);
    }

    async function fetchUserRole() {
      // If no user, set loading to false immediately
      if (!supabaseUser) {
        clearTimeout(timeoutId);
        setAppUser(null);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        let role: AppRole = 'supply_partner'; // Default role
        
        try {
          // Add timeout to the database query (2 seconds)
          const queryPromise = supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', supabaseUser.id)
            .single();

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 2000)
          );

          const { data, error } = await Promise.race([
            queryPromise,
            timeoutPromise
          ]) as any;

          if (error) {
            if (error.code === 'PGRST116') {
              // User has no role assigned, use default
              role = 'supply_partner';
            } else if (error.code === '42P01') {
              console.warn('[AppAuthProvider] ⚠️ Table user_roles does not exist. Please run migration 001_user_roles.sql');
              role = 'supply_partner';
            } else {
              console.warn('[AppAuthProvider] ⚠️ Error fetching user role:', error);
              role = 'supply_partner';
            }
          } else {
            role = (data?.role as AppRole) || 'supply_partner';
          }
        } catch (err: any) {
          if (process.env.NODE_ENV === 'development') {
            console.debug('[AppAuthProvider] Error fetching user role (e.g. CORS/network):', err);
          }
          role = 'supply_partner';
        }

        const newAppUser = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role,
        };

        clearTimeout(timeoutId);
        setAppUser(newAppUser);
        setLoading(false);
      } catch (error) {
        console.error('[AppAuthProvider] ❌ Error in fetchUserRole:', error);
        clearTimeout(timeoutId);
        setAppUser(null);
        setLoading(false);
      }
    }

    fetchUserRole().catch((err) => {
      console.error('[AppAuthProvider] ❌ Unhandled error in fetchUserRole:', err);
      clearTimeout(timeoutId);
      setAppUser(null);
      setLoading(false);
    });

    return () => clearTimeout(timeoutId);
  }, [supabaseUser, supabaseLoading]);

  const hasRole = (role: AppRole): boolean => {
    return appUser?.role === role;
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    return appUser ? roles.includes(appUser.role) : false;
  };

  // Memoize computed values to prevent unnecessary re-renders
  const isAdmin = useMemo(() => appUser?.role === 'supply_admin', [appUser?.role]);
  const isPartner = useMemo(() => appUser?.role === 'supply_partner', [appUser?.role]);
  const isAnalyst = useMemo(() => appUser?.role === 'supply_analyst', [appUser?.role]);
  const isRenovatorAnalyst = useMemo(() => appUser?.role === 'renovator_analyst', [appUser?.role]);
  const isSupplyLead = useMemo(() => appUser?.role === 'supply_lead', [appUser?.role]);
  const isRenoLead = useMemo(() => appUser?.role === 'reno_lead', [appUser?.role]);
  const isScouter = useMemo(() => appUser?.role === 'scouter', [appUser?.role]);
  const isProjectAnalyst = useMemo(() => appUser?.role === 'supply_project_analyst', [appUser?.role]);
  const isProjectLead = useMemo(() => appUser?.role === 'supply_project_lead', [appUser?.role]);
  const isLoading = useMemo(() => loading || (isDemoMode() ? false : supabaseLoading), [loading, supabaseLoading]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: AppAuthContextType = useMemo(() => ({
    user: appUser,
    role: appUser?.role || null,
    isLoading,
    isAdmin,
    isPartner,
    isAnalyst,
    isRenovatorAnalyst,
    isSupplyLead,
    isRenoLead,
    isScouter,
    isProjectAnalyst,
    isProjectLead,
    hasRole,
    hasAnyRole,
  }), [appUser, isLoading, isAdmin, isPartner, isAnalyst, isRenovatorAnalyst, isSupplyLead, isRenoLead, isScouter, isProjectAnalyst, isProjectLead, hasRole, hasAnyRole]);

  return (
    <AppAuthContext.Provider value={value}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth must be used within an AppAuthProvider');
  }
  return context;
}
