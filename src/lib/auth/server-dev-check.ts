import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Extracts the Bearer token from the request's Authorization header,
 * verifies it with Supabase, and returns the user's profile role.
 */
export async function getCallerRole(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return profile?.role ?? null;
  } catch {
    return null;
  }
}

export function isDeveloperRole(role: string | null): boolean {
  return role === "developer";
}
