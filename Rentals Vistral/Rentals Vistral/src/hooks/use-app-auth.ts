"use client";

/**
 * Re-export the useAppAuth hook from the auth provider
 * This provides access to user, roles, and role-based permissions
 */
export { useAppAuth } from "@/lib/auth/app-auth-provider";

/**
 * Additional helper hook for common auth operations
 */
export function useAuthHelpers() {
  const getUserName = (email?: string, name?: string): string => {
    if (!email) return "";
    // Extract name from email (part before @)
    return name || email.split("@")[0];
  };

  return {
    getUserName,
  };
}
