import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "lead-restricted-docs";
const FIELD_NAME = "identity_doc_url";

function extractStoragePath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (pathMatch) return pathMatch[2];
    const parts = urlObj.pathname.split("/");
    const bucketIndex = parts.findIndex((p) => p === "public" || p === "sign");
    if (bucketIndex >= 0 && bucketIndex < parts.length - 1) {
      return parts.slice(bucketIndex + 2).join("/");
    }
    return null;
  } catch {
    const pathMatch = url.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)$/);
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
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const oldValue = formData.get("oldValue") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Missing required field: file" },
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

    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop() || "";
    const fileName = `${FIELD_NAME}_${timestamp}.${fileExt}`;
    const storagePath = `${leadId}/identity/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 315360000);

    if (signedUrlError || !signedUrlData) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json(
        {
          error: `Failed to create signed URL: ${signedUrlError?.message || "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    const documentUrl = signedUrlData.signedUrl;

    const { error: updateError } = await supabase
      .from("leads")
      .update({
        [FIELD_NAME]: documentUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (updateError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json(
        { error: `Failed to update database: ${updateError.message}` },
        { status: 500 }
      );
    }

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
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
