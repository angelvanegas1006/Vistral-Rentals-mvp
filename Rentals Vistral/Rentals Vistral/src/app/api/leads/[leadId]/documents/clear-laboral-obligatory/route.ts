import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { LaboralFinancialDocs } from "@/lib/supabase/types";

/**
 * Clear laboral_financial_docs.obligatory: delete files from storage and set obligatory to {}.
 * Called when employment_status or employment_contract_type changes.
 */

const BUCKET = "leads-restricted-docs";

function extractStoragePath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(
      /\/(?:public|sign)\/([^/]+)\/(.+)$/
    );
    if (pathMatch) return pathMatch[2];
    const parts = urlObj.pathname.split("/");
    const bucketIndex = parts.findIndex(
      (p) => p === "public" || p === "sign"
    );
    if (bucketIndex >= 0 && bucketIndex < parts.length - 1) {
      return parts.slice(bucketIndex + 2).join("/");
    }
    return null;
  } catch {
    const pathMatch = url.match(
      /\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)$/
    );
    return pathMatch ? pathMatch[1] : null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    if (!leadId) {
      return NextResponse.json(
        { error: "Missing leadId" },
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
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: leadRow, error: fetchError } = await supabase
      .from("leads")
      .select("laboral_financial_docs")
      .eq("id", leadId)
      .single();

    if (fetchError || !leadRow) {
      return NextResponse.json(
        { error: "Failed to fetch lead" },
        { status: 500 }
      );
    }

    const current = (leadRow.laboral_financial_docs as LaboralFinancialDocs) || {};
    const obligatory = current.obligatory || {};
    const complementary = current.complementary || [];

    // Delete all obligatory files from storage
    const urls = Object.values(obligatory).filter(
      (v): v is string => typeof v === "string" && v.length > 0
    );
    for (const url of urls) {
      const path = extractStoragePath(url);
      if (path) {
        await supabase.storage.from(BUCKET).remove([path]);
      }
    }

    // Update DB: set obligatory to empty object
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        laboral_financial_docs: { obligatory: {}, complementary },
      })
      .eq("id", leadId);

    if (updateError) {
      console.error("Clear laboral obligatory DB error:", updateError);
      return NextResponse.json(
        { error: `Failed to update database: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Obligatory documents cleared",
    });
  } catch (error) {
    console.error("Clear laboral obligatory error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
