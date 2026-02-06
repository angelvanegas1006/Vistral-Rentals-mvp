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
  // Tenant custom documents
  tenant_custom_identity_documents: {
    bucket: "properties-restricted-docs",
    folder: "tenant/identity",
  },
  tenant_custom_financial_documents: {
    bucket: "properties-restricted-docs",
    folder: "tenant/financial",
  },
  tenant_custom_other_documents: {
    bucket: "properties-restricted-docs",
    folder: "tenant/other",
  },
  // Rental Data (Phase 4: Inquilino aceptado)
  signed_lease_contract_url: {
    bucket: "properties-restricted-docs",
    folder: "rental/lease_contract",
  },
  // Guarantee file (Phase 5: Pendiente de trámites)
  guarantee_file_url: {
    bucket: "properties-restricted-docs",
    folder: "rental/non-payment_insurance",
  },
  // Property Marketing Photos (Listo para Alquilar phase)
  marketing_photos_common_areas: {
    bucket: "properties-public-docs",
    folder: "photos/marketing/common_areas",
  },
  marketing_photos_entry_hallways: {
    bucket: "properties-public-docs",
    folder: "photos/marketing/entry_hallways",
  },
  marketing_photos_bedrooms: {
    bucket: "properties-public-docs",
    folder: "photos/marketing/bedrooms",
  },
  marketing_photos_living_room: {
    bucket: "properties-public-docs",
    folder: "photos/marketing/living_room",
  },
  marketing_photos_bathrooms: {
    bucket: "properties-public-docs",
    folder: "photos/marketing/bathrooms",
  },
  marketing_photos_kitchen: {
    bucket: "properties-public-docs",
    folder: "photos/marketing/kitchen",
  },
  marketing_photos_exterior: {
    bucket: "properties-public-docs",
    folder: "photos/marketing/exterior",
  },
  marketing_photos_garage: {
    bucket: "properties-public-docs",
    folder: "photos/marketing/garage",
  },
  marketing_photos_storage: {
    bucket: "properties-public-docs",
    folder: "photos/marketing/storage",
  },
  marketing_photos_terrace: {
    bucket: "properties-public-docs",
    folder: "photos/marketing/terrace",
  },
  // Property Incident Photos (Fotos de incidencias - diferentes de fotos comerciales)
  incident_photos_common_areas: {
    bucket: "properties-public-docs",
    folder: "photos/incidents/common_areas",
  },
  incident_photos_entry_hallways: {
    bucket: "properties-public-docs",
    folder: "photos/incidents/entry_hallways",
  },
  incident_photos_bedrooms: {
    bucket: "properties-public-docs",
    folder: "photos/incidents/bedrooms",
  },
  incident_photos_living_room: {
    bucket: "properties-public-docs",
    folder: "photos/incidents/living_room",
  },
  incident_photos_bathrooms: {
    bucket: "properties-public-docs",
    folder: "photos/incidents/bathrooms",
  },
  incident_photos_kitchen: {
    bucket: "properties-public-docs",
    folder: "photos/incidents/kitchen",
  },
  incident_photos_exterior: {
    bucket: "properties-public-docs",
    folder: "photos/incidents/exterior",
  },
  incident_photos_garage: {
    bucket: "properties-public-docs",
    folder: "photos/incidents/garage",
  },
  incident_photos_terrace: {
    bucket: "properties-public-docs",
    folder: "photos/incidents/terrace",
  },
  incident_photos_storage: {
    bucket: "properties-public-docs",
    folder: "photos/incidents/storage",
  },
};

// JSONB array fields that need special handling
const JSONB_ARRAY_FIELDS = [
  "doc_renovation_files",
  "pics_urls",
  "marketing_photos_common_areas",
  "marketing_photos_entry_hallways",
  "marketing_photos_bedrooms",
  "marketing_photos_living_room",
  "marketing_photos_bathrooms",
  "marketing_photos_kitchen",
  "marketing_photos_exterior",
  "marketing_photos_garage",
  "marketing_photos_storage",
  "marketing_photos_terrace",
  "incident_photos_common_areas",
  "incident_photos_entry_hallways",
  "incident_photos_bedrooms",
  "incident_photos_living_room",
  "incident_photos_bathrooms",
  "incident_photos_kitchen",
  "incident_photos_exterior",
  "incident_photos_garage",
  "incident_photos_terrace",
  "incident_photos_storage",
];
const CUSTOM_DOCUMENT_FIELDS = ["custom_legal_documents", "custom_insurance_documents", "custom_supplies_documents", "custom_investor_documents", "tenant_custom_identity_documents", "tenant_custom_financial_documents", "tenant_custom_other_documents"];

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
    } else if (fieldName.startsWith("marketing_photos_") || fieldName.startsWith("incident_photos_")) {
      // Handle technical inspection photos - write to technical_inspection_report JSONB
      const fieldToRoomMap: Record<string, { roomType: string; photoType: "marketing_photos" | "incident_photos" }> = {
        "marketing_photos_common_areas": { roomType: "common_areas", photoType: "marketing_photos" },
        "marketing_photos_entry_hallways": { roomType: "entry_hallways", photoType: "marketing_photos" },
        "marketing_photos_living_room": { roomType: "living_room", photoType: "marketing_photos" },
        "marketing_photos_kitchen": { roomType: "kitchen", photoType: "marketing_photos" },
        "marketing_photos_exterior": { roomType: "exterior", photoType: "marketing_photos" },
        "marketing_photos_garage": { roomType: "garage", photoType: "marketing_photos" },
        "marketing_photos_terrace": { roomType: "terrace", photoType: "marketing_photos" },
        "marketing_photos_storage": { roomType: "storage", photoType: "marketing_photos" },
        "marketing_photos_bedrooms": { roomType: "bedrooms", photoType: "marketing_photos" },
        "marketing_photos_bathrooms": { roomType: "bathrooms", photoType: "marketing_photos" },
        "incident_photos_common_areas": { roomType: "common_areas", photoType: "incident_photos" },
        "incident_photos_entry_hallways": { roomType: "entry_hallways", photoType: "incident_photos" },
        "incident_photos_living_room": { roomType: "living_room", photoType: "incident_photos" },
        "incident_photos_kitchen": { roomType: "kitchen", photoType: "incident_photos" },
        "incident_photos_exterior": { roomType: "exterior", photoType: "incident_photos" },
        "incident_photos_garage": { roomType: "garage", photoType: "incident_photos" },
        "incident_photos_terrace": { roomType: "terrace", photoType: "incident_photos" },
        "incident_photos_storage": { roomType: "storage", photoType: "incident_photos" },
        "incident_photos_bedrooms": { roomType: "bedrooms", photoType: "incident_photos" },
        "incident_photos_bathrooms": { roomType: "bathrooms", photoType: "incident_photos" },
      };

      const roomMapping = fieldToRoomMap[fieldName];
      if (!roomMapping) {
        return NextResponse.json(
          { error: `Unknown photo field: ${fieldName}` },
          { status: 400 }
        );
      }

      // Get current technical_inspection_report
      const { data: currentProperty } = await supabase
        .from("properties")
        .select("technical_inspection_report")
        .eq("property_unique_id", propertyId)
        .single();

      if (!currentProperty) {
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        );
      }

      // Parse the JSONB field
      let report = currentProperty.technical_inspection_report;
      if (typeof report === 'string') {
        try {
          report = JSON.parse(report);
        } catch {
          report = {};
        }
      }
      if (!report || typeof report !== 'object') {
        report = {};
      }

      const updatedReport = { ...report };

      // Handle bedrooms and bathrooms (arrays)
      if ((roomMapping.roomType === "bedrooms" || roomMapping.roomType === "bathrooms") && roomIndex !== undefined && roomIndex !== null) {
        const roomIdx = typeof roomIndex === "string" ? parseInt(roomIndex, 10) : roomIndex;
        if (isNaN(roomIdx)) {
          return NextResponse.json(
            { error: "Invalid roomIndex" },
            { status: 400 }
          );
        }

        const roomArray = roomMapping.roomType === "bedrooms" ? "bedrooms" : "bathrooms";
        const rooms = Array.isArray(updatedReport[roomArray]) ? [...updatedReport[roomArray]] : [];
        
        if (rooms[roomIdx] && Array.isArray(rooms[roomIdx]?.[roomMapping.photoType])) {
          rooms[roomIdx] = {
            ...rooms[roomIdx],
            [roomMapping.photoType]: rooms[roomIdx][roomMapping.photoType].filter((url: string) => url !== fileUrl)
          };
          updatedReport[roomArray] = rooms;
        }
      } else {
        // Handle simple rooms (single objects)
        const roomKey = roomMapping.roomType as keyof typeof updatedReport;
        const currentRoom = updatedReport[roomKey];
        if (currentRoom && Array.isArray(currentRoom[roomMapping.photoType])) {
          updatedReport[roomKey] = {
            ...currentRoom,
            [roomMapping.photoType]: currentRoom[roomMapping.photoType].filter((url: string) => url !== fileUrl)
          };
        }
      }

      updateData = { technical_inspection_report: updatedReport };
    } else if (JSONB_ARRAY_FIELDS.includes(fieldName)) {
      // For other JSONB arrays: remove the URL from the array
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
