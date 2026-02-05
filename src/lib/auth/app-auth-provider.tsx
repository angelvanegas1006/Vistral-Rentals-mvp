"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useSupabaseAuth } from "./supabase-auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserRole {
  role: AppRole;
  property_id?: string;
}

interface AppAuthContextType {
  user: User | null;
  roles: UserRole[];
  role: AppRole | null;
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  isAdmin: boolean;
  refetchRoles: () => Promise<void>;
}

const AppAuthContext = createContext<AppAuthContextType | undefined>(undefined);

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUserRoles = async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, property_id")
        .eq("user_id", user.id);

      if (error) throw error;

      setRoles(data || []);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchUserRoles();
    }
  }, [user, authLoading]);

  const hasRole = (role: AppRole): boolean => {
    return roles.some((r) => r.role === role);
  };

  const hasAnyRole = (checkRoles: AppRole[]): boolean => {
    return roles.some((r) => checkRoles.includes(r.role));
  };

  const isAdmin = hasRole("supply_admin" as AppRole);
  const role = roles.length > 0 ? roles[0].role : null;

  const value: AppAuthContextType = {
    user,
    roles,
    role,
    loading: authLoading || loading,
    hasRole,
    hasAnyRole,
    isAdmin,
    refetchRoles: fetchUserRoles,
  };

  return (
    <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (context === undefined) {
    throw new Error("useAppAuth must be used within an AppAuthProvider");
  }
  return context;
}
