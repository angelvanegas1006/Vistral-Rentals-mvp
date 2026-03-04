"use client";

export { useAppAuth } from "@/lib/auth/app-auth-provider";

export function useAuthHelpers() {
  const getUserName = (email?: string, name?: string): string => {
    if (!email) return "";
    return name || email.split("@")[0];
  };

  return {
    getUserName,
  };
}
