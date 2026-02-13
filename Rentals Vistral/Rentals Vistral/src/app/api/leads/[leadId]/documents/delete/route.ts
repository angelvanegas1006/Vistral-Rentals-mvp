import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Lead identity document delete.
 *
 * Bucket:  lead-restricted-docs
 * DB col:  leads.identity_doc_url → set to null
 *
 * Same pattern as /api/documents/delete (properties) but targets the leads table.
 */

const BUCKET = "leads-restricted-docs";
const DB_COLUMN = "identity_doc_url";

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
    const { fileUrl } = body as { fileUrl?: string };
    if (!fileUrl) {
      return NextResponse.json(
        { error: "Missing required field: fileUrl" },
        { status: 400 }
      );
    }

    // --- Supabase client with service role key (bypasses RLS) ---
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

    // --- Step 1: Set identity_doc_url to null in DB ---
    const { error: updateError } = await supabase
      .from("leads")
      .update({ [DB_COLUMN]: null })
      .eq("id", leadId);

    if (updateError) {
      console.error("Lead doc delete DB error:", updateError);
      return NextResponse.json(
        { error: `Failed to update database: ${updateError.message}` },
        { status: 500 }
      );
    }

    // --- Step 2: Remove file from storage ---
    const storagePath = extractStoragePath(fileUrl);
    if (storagePath) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
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
