import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { LaboralFinancialDocs } from "@/lib/supabase/types";

/**
 * Lead document upload.
 *
 * Bucket:  leads-restricted-docs
 * Paths:
 *   - identity: {leads_unique_id}/identity/{filename} → leads.identity_doc_url
 *   - laboral_financial: {leads_unique_id}/laboral_financial/{filename} → leads.laboral_financial_docs (JSONB)
 */

const BUCKET = "leads-restricted-docs";
const FOLDER_IDENTITY = "identity";
const FOLDER_LABORAL_FINANCIAL = "laboral_financial";
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
    const folder = (formData.get("folder") as string) || FOLDER_IDENTITY;

    if (!file || !leadsUniqueId) {
      return NextResponse.json(
        { error: "Missing required fields: file, leadsUniqueId" },
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

    if (folder === FOLDER_IDENTITY) {
      // --- Identity document (existing flow) ---
      const oldValue = formData.get("oldValue") as string | null;
      const fileName = `${DB_COLUMN_IDENTITY}_${timestamp}.${fileExt}`;
      const storagePath = `${leadsUniqueId}/${FOLDER_IDENTITY}/${fileName}`;

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

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
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
        .update({ [DB_COLUMN_IDENTITY]: documentUrl })
        .eq("id", leadId);

      if (updateError) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        console.error("Lead doc upload DB error:", updateError);
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
    }

    if (folder === FOLDER_LABORAL_FINANCIAL) {
      // --- Laboral/Financial document ---
      const fieldKey = formData.get("fieldKey") as string | null;
      const docType = formData.get("docType") as string | null;
      const docTitle = formData.get("docTitle") as string | null;

      const isObligatory = !!fieldKey;
      const isComplementary = !!docType && !!docTitle;

      if (!isObligatory && !isComplementary) {
        return NextResponse.json(
          {
            error:
              "For laboral_financial: provide fieldKey (obligatory) or docType+docTitle (complementary)",
          },
          { status: 400 }
        );
      }

      const fileName = isObligatory
        ? `${fieldKey}_${timestamp}.${fileExt}`
        : `complementary_${timestamp}.${fileExt}`;
      const storagePath = `${leadsUniqueId}/${FOLDER_LABORAL_FINANCIAL}/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        console.error("Lead laboral doc upload storage error:", uploadError);
        return NextResponse.json(
          { error: `Failed to upload file: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
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

      // Fetch current laboral_financial_docs
      const { data: leadRow, error: fetchError } = await supabase
        .from("leads")
        .select(DB_COLUMN_LABORAL)
        .eq("id", leadId)
        .single();

      if (fetchError || !leadRow) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        return NextResponse.json(
          { error: "Failed to fetch lead" },
          { status: 500 }
        );
      }

      const current = (leadRow[DB_COLUMN_LABORAL] as LaboralFinancialDocs) || {};
      const obligatory = { ...(current.obligatory || {}) };
      const complementary = [...(current.complementary || [])];

      if (isObligatory) {
        const oldValue = obligatory[fieldKey!];
        obligatory[fieldKey!] = documentUrl;

        const { error: updateError } = await supabase
          .from("leads")
          .update({
            [DB_COLUMN_LABORAL]: { obligatory, complementary },
          })
          .eq("id", leadId);

        if (updateError) {
          await supabase.storage.from(BUCKET).remove([storagePath]);
          console.error("Lead laboral doc upload DB error:", updateError);
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
      } else {
        complementary.push({
          type: docType!,
          title: docTitle!,
          url: documentUrl,
          createdAt: new Date().toISOString(),
        });

        const { error: updateError } = await supabase
          .from("leads")
          .update({
            [DB_COLUMN_LABORAL]: { obligatory, complementary },
          })
          .eq("id", leadId);

        if (updateError) {
          await supabase.storage.from(BUCKET).remove([storagePath]);
          console.error("Lead laboral doc upload DB error:", updateError);
          return NextResponse.json(
            { error: `Failed to update database: ${updateError.message}` },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ success: true, url: documentUrl });
    }

    return NextResponse.json(
      { error: `Unknown folder: ${folder}` },
      { status: 400 }
    );
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
