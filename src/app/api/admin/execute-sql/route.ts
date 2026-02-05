import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Temporary admin route to execute SQL scripts
 * WARNING: This should be removed or secured in production
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql } = body;

    if (!sql) {
      return NextResponse.json(
        { error: "SQL query is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Execute SQL using Supabase REST API
    // Note: Supabase doesn't support direct SQL execution via JS client
    // We need to use the REST API with pg_query or create a function
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      // Try alternative: execute via direct query if RPC doesn't exist
      // For ALTER TABLE, we need to use the management API or SQL editor
      return NextResponse.json(
        {
          error: "Direct SQL execution not available via API",
          message: "Please execute the SQL script manually in Supabase Dashboard > SQL Editor",
          sql,
        },
        { status: 400 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("SQL execution error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error occurred",
        message: "Please execute the SQL script manually in Supabase Dashboard > SQL Editor",
      },
      { status: 500 }
    );
  }
}
