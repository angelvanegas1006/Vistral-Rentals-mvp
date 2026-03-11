"use client";

import { useState, useEffect, useCallback } from "react";
import { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface CreateUserPayload {
  email: string;
  password: string;
  full_name: string;
}

export function useTeam() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team/users");
      if (!res.ok) throw new Error("Failed to fetch team members");
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error("[Fetch Team Error]:", error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const createUser = async (payload: CreateUserPayload) => {
    const res = await fetch("/api/team/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create user");
    }

    await fetchMembers();
    return res.json();
  };

  return { members, loading, createUser, refetch: fetchMembers };
}
