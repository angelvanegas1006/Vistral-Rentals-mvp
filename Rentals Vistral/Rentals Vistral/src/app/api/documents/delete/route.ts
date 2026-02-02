import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Field to bucket mapping (same as upload route)
const FIELD_MAPPINGS: Record<string, { bucket: string; folder: string }> = {
  client_identity_doc_url: {
    bucket: "properties-restricted-docs",
    folder: "owner_identity",
  },
  client_bank_certificate_url: {
    bucket: "properties-restricted-docs",
    folder: "owner_financial",
  },
  doc_purchase_contract: {
    bucket: "properties-restricted-docs",
    folder: "legal",
  },
  doc_land_registry_note: {
    bucket: "properties-restricted-docs",
    folder: "legal",
  },
  doc_energy_cert: {
    bucket: "properties-restricted-docs",
    folder: "technical",
  },
  doc_renovation_files: {
    bucket: "properties-restricted-docs",
    folder: "technical/reforma",
  },
  home_insurance_policy_url: {
    bucket: "properties-restricted-docs",
    folder: "insurance",
  },
  doc_contract_electricity: {
    bucket: "properties-restricted-docs",
    folder: "supplies/electricity",
  },
  doc_bill_electricity: {
    bucket: "properties-restricted-docs",
    folder: "supplies/electricity",
  },
  doc_contract_water: {
    bucket: "properties-restricted-docs",
    folder: "supplies/water",
  },
  doc_bill_water: {
    bucket: "properties-restricted-docs",
    folder: "supplies/water",
  },
  doc_contract_gas: {
    bucket: "properties-restricted-docs",
    folder: "supplies/gas",
  },
  doc_bill_gas: {
    bucket: "properties-restricted-docs",
    folder: "supplies/gas",
  },
  doc_contract_other: {
    bucket: "properties-restricted-docs",
    folder: "supplies/other",
  },
  doc_bill_other: {
    bucket: "properties-restricted-docs",
    folder: "supplies/other",
  },
  pics_urls: {
    bucket: "properties-public-docs",
    folder: "gallery",
  },
  // Custom documents - use category-based folders
  custom_legal_documents: {
    bucket: "properties-restricted-docs",
    folder: "legal/custom",
  },
  custom_insurance_documents: {
    bucket: "properties-restricted-docs",
    folder: "insurance/custom",
  },
  custom_supplies_documents: {
    bucket: "properties-restricted-docs",
    folder: "supplies/custom",
  },
  custom_investor_documents: {
    bucket: "properties-restricted-docs",
    folder: "owner_financial/custom",
  },
  // Property Photos (Listo para Alquilar phase)
  photos_common_areas: {
    bucket: "properties-public-docs",
    folder: "photos/common_areas",
  },
  photos_entry_hallways: {
    bucket: "properties-public-docs",
    folder: "photos/entry_hallways",
  },
  photos_bedrooms: {
    bucket: "properties-public-docs",
    folder: "photos/bedrooms",
  },
  photos_living_room: {
    bucket: "properties-public-docs",
    folder: "photos/living_room",
  },
  photos_bathrooms: {
    bucket: "properties-public-docs",
    folder: "photos/bathrooms",
  },
  photos_kitchen: {
    bucket: "properties-public-docs",
    folder: "photos/kitchen",
  },
  photos_exterior: {
    bucket: "properties-public-docs",
    folder: "photos/exterior",
  },
  photos_garage: {
    bucket: "properties-public-docs",
    folder: "photos/garage",
  },
  photos_storage: {
    bucket: "properties-public-docs",
    folder: "photos/storage",
  },
  photos_terrace: {
    bucket: "properties-public-docs",
    folder: "photos/terrace",
  },
};

// JSONB array fields that need special handling
const JSONB_ARRAY_FIELDS = [
  "doc_renovation_files",
  "pics_urls",
  "photos_common_areas",
  "photos_entry_hallways",
  "photos_bedrooms",
  "photos_living_room",
  "photos_bathrooms",
  "photos_kitchen",
  "photos_exterior",
  "photos_garage",
  "photos_storage",
  "photos_terrace",
];
const CUSTOM_DOCUMENT_FIELDS = ["custom_legal_documents", "custom_insurance_documents", "custom_supplies_documents", "custom_investor_documents"];

/**
 * Extract storage path from a Supabase Storage URL
 */
function extractStoragePath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (pathMatch) {
      return pathMatch[2];
    }
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { fieldName, propertyId, fileUrl, roomIndex } = body;

    if (!fieldName || !propertyId || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields: fieldName, propertyId, fileUrl" },
        { status: 400 }
      );
    }

    // Get mapping
    const mapping = FIELD_MAPPINGS[fieldName];
    if (!mapping) {
      return NextResponse.json(
        { error: `Unknown field name: ${fieldName}` },
        { status: 400 }
      );
    }

    const { bucket } = mapping;

    // Create Supabase client with service role key (bypasses RLS)
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

    // Step 1: Update database
    // Check if this is a JSONB array field, custom document field, or single text field
    let updateData: Record<string, unknown>;
    
    if (CUSTOM_DOCUMENT_FIELDS.includes(fieldName)) {
      // For custom documents: remove the document object from the array by URL
      const { data: currentProperty } = await supabase
        .from("properties")
        .select(fieldName)
        .eq("property_unique_id", propertyId)
        .single();

      if (!currentProperty) {
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        );
      }

      const currentArray = Array.isArray(currentProperty[fieldName])
        ? currentProperty[fieldName]
        : [];

      // Remove the document object from the array by URL
      const updatedArray = currentArray.filter(
        (doc: { url: string; title?: string }) => doc.url !== fileUrl
      );
      
      updateData = { [fieldName]: updatedArray };
    } else if (JSONB_ARRAY_FIELDS.includes(fieldName)) {
      // Special handling for bedrooms and bathrooms (arrays of arrays)
      if ((fieldName === "photos_bedrooms" || fieldName === "photos_bathrooms") && roomIndex !== undefined && roomIndex !== null) {
        const roomIdx = typeof roomIndex === "string" ? parseInt(roomIndex, 10) : roomIndex;
        if (isNaN(roomIdx)) {
          return NextResponse.json(
            { error: "Invalid roomIndex" },
            { status: 400 }
          );
        }

        // Get current array of arrays
        const { data: currentProperty } = await supabase
          .from("properties")
          .select(fieldName)
          .eq("property_unique_id", propertyId)
          .single();

        if (!currentProperty) {
          return NextResponse.json(
            { error: "Property not found" },
            { status: 404 }
          );
        }

        const currentArrayOfArrays = Array.isArray(currentProperty[fieldName])
          ? (currentProperty[fieldName] as string[][])
          : [];

        // Ensure array has enough elements
        if (currentArrayOfArrays[roomIdx]) {
          // Remove the URL from the specific room's array
          currentArrayOfArrays[roomIdx] = currentArrayOfArrays[roomIdx].filter(
            (url: string) => url !== fileUrl
          );
        }

        updateData = { [fieldName]: currentArrayOfArrays };
      } else {
        // For simple JSONB arrays: remove the URL from the array
        const { data: currentProperty } = await supabase
          .from("properties")
          .select(fieldName)
          .eq("property_unique_id", propertyId)
          .single();

        if (!currentProperty) {
          return NextResponse.json(
            { error: "Property not found" },
            { status: 404 }
          );
        }

        const currentArray = Array.isArray(currentProperty[fieldName])
          ? currentProperty[fieldName]
          : [];

        // Remove the URL from the array
        const updatedArray = currentArray.filter((url: string) => url !== fileUrl);
        
        updateData = { [fieldName]: updatedArray };
      }
    } else {
      // For single text fields: set to null
      updateData = { [fieldName]: null };
    }

    const { error: updateError } = await supabase
      .from("properties")
      .update(updateData)
      .eq("property_unique_id", propertyId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update database: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Step 2: Delete file from storage
    const storagePath = extractStoragePath(fileUrl);
    if (storagePath) {
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([storagePath]);

      if (deleteError) {
        console.error(`Failed to delete file from storage: ${deleteError.message}`);
        // Don't fail the request if storage deletion fails
        // The database has been updated successfully
      }
    } else {
      console.warn(`Could not extract storage path from URL: ${fileUrl}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Document deleted successfully" 
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
