"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useSupabaseAuth } from "./supabase-auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AppAuthContextType {
  user: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AppAuthContext = createContext<AppAuthContextType | undefined>(undefined);

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signOut } = useSupabaseAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const role = profile?.role ?? null;
  const isAdmin = role === "admin";

  const value: AppAuthContextType = {
    user,
    profile,
    role,
    loading: authLoading || loading,
    isAdmin,
    signOut,
    refetchProfile: fetchProfile,
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
