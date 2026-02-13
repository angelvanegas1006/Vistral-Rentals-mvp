import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Lead identity document upload.
 *
 * Bucket:  leads-restricted-docs
 * Path:    {leads_unique_id}/identity/{filename}
 * DB col:  leads.identity_doc_url  (TEXT — single value, not array)
 *
 * Same pattern as /api/documents/upload (properties) but targets the leads table.
 */

const BUCKET = "leads-restricted-docs";
const FOLDER = "identity";
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const leadsUniqueId = formData.get("leadsUniqueId") as string;
    const oldValue = formData.get("oldValue") as string | null;

    if (!file || !leadsUniqueId) {
      return NextResponse.json(
        { error: "Missing required fields: file, leadsUniqueId" },
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

    // --- Build storage path: {leads_unique_id}/identity/{filename} ---
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop() || "";
    const sanitizedColumn = DB_COLUMN.replace(/[^a-zA-Z0-9_]/g, "_");
    const fileName = `${sanitizedColumn}_${timestamp}.${fileExt}`;
    const storagePath = `${leadsUniqueId}/${FOLDER}/${fileName}`;

    // --- Step 1: Upload file to Supabase Storage ---
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Lead doc upload storage error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // --- Step 2: Get signed URL (private bucket) ---
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 315360000); // 10 years

    if (signedUrlError || !signedUrlData) {
      // Cleanup uploaded file
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json(
        {
          error: `Failed to create signed URL: ${signedUrlError?.message || "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    const documentUrl = signedUrlData.signedUrl;

    // --- Step 3: Update leads table ---
    const { error: updateError } = await supabase
      .from("leads")
      .update({ [DB_COLUMN]: documentUrl })
      .eq("id", leadId);

    if (updateError) {
      // Cleanup uploaded file
      await supabase.storage.from(BUCKET).remove([storagePath]);
      console.error("Lead doc upload DB error:", updateError);
      return NextResponse.json(
        { error: `Failed to update database: ${updateError.message}` },
        { status: 500 }
      );
    }

    // --- Step 4: Cleanup old file (if replacing) ---
    if (oldValue) {
      const oldStoragePath = extractStoragePath(oldValue);
      if (oldStoragePath) {
        await supabase.storage.from(BUCKET).remove([oldStoragePath]);
      }
    }

    return NextResponse.json({ success: true, url: documentUrl });
  } catch (error) {
    console.error("Lead document upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
