import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { LaboralFinancialDocs } from "@/lib/supabase/types";

/**
 * Lead document delete.
 *
 * Supports:
 *   - identity: leads.identity_doc_url → set to null
 *   - laboral_financial: remove from laboral_financial_docs (obligatory by fieldKey, or complementary by url)
 */

const BUCKET = "leads-restricted-docs";
const DB_COLUMN_IDENTITY = "identity_doc_url";
const DB_COLUMN_LABORAL = "laboral_financial_docs";

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

export async function DELETE(
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

    const body = await request.json().catch(() => ({}));
    const {
      fileUrl,
      fieldType = "identity",
      fieldKey,
    } = body as {
      fileUrl?: string;
      fieldType?: "identity" | "laboral_financial";
      fieldKey?: string;
    };

    if (!fileUrl) {
      return NextResponse.json(
        { error: "Missing required field: fileUrl" },
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

    const storagePath = extractStoragePath(fileUrl);

    if (fieldType === "identity") {
      const { error: updateError } = await supabase
        .from("leads")
        .update({ [DB_COLUMN_IDENTITY]: null })
        .eq("id", leadId);

      if (updateError) {
        console.error("Lead doc delete DB error:", updateError);
        return NextResponse.json(
          { error: `Failed to update database: ${updateError.message}` },
          { status: 500 }
        );
      }

      if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }

      return NextResponse.json({
        success: true,
        message: "Document deleted successfully",
      });
    }

    if (fieldType === "laboral_financial") {
      const { data: leadRow, error: fetchError } = await supabase
        .from("leads")
        .select(DB_COLUMN_LABORAL)
        .eq("id", leadId)
        .single();

      if (fetchError || !leadRow) {
        return NextResponse.json(
          { error: "Failed to fetch lead" },
          { status: 500 }
        );
      }

      const current = (leadRow[DB_COLUMN_LABORAL] as LaboralFinancialDocs) || {};
      const obligatory = { ...(current.obligatory || {}) };
      const complementary = [...(current.complementary || [])];

      if (fieldKey) {
        delete obligatory[fieldKey];
      } else {
        const idx = complementary.findIndex((d) => d.url === fileUrl);
        if (idx >= 0) {
          complementary.splice(idx, 1);
        }
      }

      const { error: updateError } = await supabase
        .from("leads")
        .update({
          [DB_COLUMN_LABORAL]: { obligatory, complementary },
        })
        .eq("id", leadId);

      if (updateError) {
        console.error("Lead laboral doc delete DB error:", updateError);
        return NextResponse.json(
          { error: `Failed to update database: ${updateError.message}` },
          { status: 500 }
        );
      }

      if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }

      return NextResponse.json({
        success: true,
        message: "Document deleted successfully",
      });
    }

    return NextResponse.json(
      { error: `Unknown fieldType: ${fieldType}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Lead document delete error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
