import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Field to bucket/folder mapping
const FIELD_MAPPINGS: Record<string, { bucket: string; folder: string }> = {
  // Client Data (V2.1 Architecture)
  client_identity_doc_url: {
    bucket: "properties-restricted-docs",
    folder: "client/identity",
  },
  client_bank_certificate_url: {
    bucket: "properties-restricted-docs",
    folder: "client/financial",
  },
  // Property Legal (V2.1 Architecture)
  doc_purchase_contract: {
    bucket: "properties-restricted-docs",
    folder: "property/legal/purchase_contract",
  },
  doc_land_registry_note: {
    bucket: "properties-restricted-docs",
    folder: "property/legal/land_registry_note",
  },
  property_management_plan_contract_url: {
    bucket: "properties-restricted-docs",
    folder: "property/legal/property_management_plan_contract",
  },
  // Property Technical (V2.1 Architecture)
  doc_energy_cert: {
    bucket: "properties-restricted-docs",
    folder: "property/technical/energy_certificate",
  },
  doc_renovation_files: {
    bucket: "properties-restricted-docs",
    folder: "property/technical/renovation",
  },
  // Property Insurance (V2.1 Architecture)
  home_insurance_policy_url: {
    bucket: "properties-restricted-docs",
    folder: "property/insurance",
  },
  doc_contract_electricity: {
    bucket: "properties-restricted-docs",
    folder: "property/supplies/electricity",
  },
  doc_bill_electricity: {
    bucket: "properties-restricted-docs",
    folder: "property/supplies/electricity",
  },
  doc_contract_water: {
    bucket: "properties-restricted-docs",
    folder: "property/supplies/water",
  },
  doc_bill_water: {
    bucket: "properties-restricted-docs",
    folder: "property/supplies/water",
  },
  doc_contract_gas: {
    bucket: "properties-restricted-docs",
    folder: "property/supplies/gas",
  },
  doc_bill_gas: {
    bucket: "properties-restricted-docs",
    folder: "property/supplies/gas",
  },
  // Custom documents (V2.1 Architecture)
  client_custom_identity_documents: {
    bucket: "properties-restricted-docs",
    folder: "client/identity",
  },
  client_custom_financial_documents: {
    bucket: "properties-restricted-docs",
    folder: "client/financial",
  },
  client_rent_receiving_bank_certificate_url: {
    bucket: "properties-restricted-docs",
    folder: "client/financial",
  },
  client_custom_other_documents: {
    bucket: "properties-restricted-docs",
    folder: "client/other",
  },
  // Tenant Data (V2.1 Architecture)
  tenant_identity_doc_url: {
    bucket: "properties-restricted-docs",
    folder: "tenant/identity",
  },
  // Tenant custom documents (V2.1 Architecture)
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
  // Rental Data (Folder 1: rental) - contractual_financial (Folder 2)
  signed_lease_contract_url: {
    bucket: "properties-restricted-docs",
    folder: "rental/contractual_financial/lease_contract",
  },
  guarantee_file_url: {
    bucket: "properties-restricted-docs",
    folder: "rental/contractual_financial/non-payment_insurance",
  },
  deposit_receipt_file_url: {
    bucket: "properties-restricted-docs",
    folder: "rental/contractual_financial/deposit",
  },
  first_rent_payment_file_url: {
    bucket: "properties-restricted-docs",
    folder: "rental/contractual_financial/first_rent_payment",
  },
  rental_custom_contractual_financial_documents: {
    bucket: "properties-restricted-docs",
    folder: "rental/contractual_financial/other",
  },
  // Rental - utilities (Folder 2)
  tenant_contract_electricity: {
    bucket: "properties-restricted-docs",
    folder: "rental/utilities",
  },
  tenant_contract_water: {
    bucket: "properties-restricted-docs",
    folder: "rental/utilities",
  },
  tenant_contract_gas: {
    bucket: "properties-restricted-docs",
    folder: "rental/utilities",
  },
  rental_custom_utilities_documents: {
    bucket: "properties-restricted-docs",
    folder: "rental/utilities",
  },
  // Rental - other (Folder 2)
  rental_custom_other_documents: {
    bucket: "properties-restricted-docs",
    folder: "rental/other",
  },
  custom_insurance_documents: {
    bucket: "properties-restricted-docs",
    folder: "property/insurance",
  },
  custom_technical_documents: {
    bucket: "properties-restricted-docs",
    folder: "property/technical/custom",
  },
  custom_legal_documents: {
    bucket: "properties-restricted-docs",
    folder: "property/legal/custom",
  },
  custom_supplies_documents: {
    bucket: "properties-restricted-docs",
    folder: "property/supplies/other",
  },
  property_custom_other_documents: {
    bucket: "properties-restricted-docs",
    folder: "property/other",
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fieldName = formData.get("fieldName") as string;
    const propertyId = formData.get("propertyId") as string;
    const oldValue = formData.get("oldValue") as string | null;
    const customTitle = formData.get("customTitle") as string | null;
    const roomIndex = formData.get("roomIndex") as string | null; // Para habitaciones y baños dinámicos

    if (!file || !fieldName || !propertyId) {
      return NextResponse.json(
        { error: "Missing required fields: file, fieldName, propertyId" },
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

    const { bucket, folder } = mapping;

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

    // Generate file name
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop() || "";
    const sanitizedFieldName = fieldName.replace(/[^a-zA-Z0-9_]/g, "_");
    const fileName = `${sanitizedFieldName}_${timestamp}.${fileExt}`;
    const storagePath = `${propertyId}/${folder}/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
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

    // Step 2: Get signed URL (for private buckets)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 315360000); // 10 years

    if (signedUrlError || !signedUrlData) {
      // Try to clean up uploaded file
      await supabase.storage.from(bucket).remove([storagePath]);
      return NextResponse.json(
        {
          error: `Failed to create signed URL: ${signedUrlError?.message || "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    const documentUrl = signedUrlData.signedUrl;

    // Step 3: Update database
    // Special handling for JSONB array fields and custom documents
    let updateData: Record<string, unknown>;
    
    // Check if this is a custom document field (requires title from formData)
    // Custom document fields can start with: custom_, property_custom_, client_custom_, tenant_custom_, rental_custom_
    const isCustomDocument = fieldName.startsWith("custom_") || 
                             fieldName.startsWith("property_custom_") || 
                             fieldName.startsWith("client_custom_") ||
                             fieldName.startsWith("tenant_custom_") ||
                             fieldName.startsWith("rental_custom_");
    
    if (isCustomDocument && customTitle) {
      // Custom documents: add to JSONB array with title
      const { data: currentProperty } = await supabase
        .from("properties")
        .select(fieldName)
        .eq("property_unique_id", propertyId)
        .single();

      const currentArray = Array.isArray(currentProperty?.[fieldName])
        ? currentProperty[fieldName]
        : [];

      const newDocument = {
        title: customTitle,
        url: documentUrl,
        createdAt: new Date().toISOString(),
      };

      // If oldValue is provided (editing existing file), replace it
      if (oldValue) {
        const updatedArray = currentArray.map((doc: { url: string; title?: string }) =>
          doc.url === oldValue ? newDocument : doc
        );
        updateData = { [fieldName]: updatedArray };
      } else {
        // Append new document to array
        updateData = {
          [fieldName]: [...currentArray, newDocument],
        };
      }
    } else if (fieldName === "doc_renovation_files") {
      // Get current array value for simple array fields
      const { data: currentProperty } = await supabase
        .from("properties")
        .select(fieldName)
        .eq("property_unique_id", propertyId)
        .single();

      const currentArray = Array.isArray(currentProperty?.[fieldName])
        ? currentProperty[fieldName]
        : [];

      // If oldValue is provided (editing existing file), replace it in the array
      // Otherwise, append new URL to array
      if (oldValue && currentArray.includes(oldValue)) {
        // Replace the old URL with the new one
        const updatedArray = currentArray.map((url: string) =>
          url === oldValue ? documentUrl : url
        );
        updateData = { [fieldName]: updatedArray };
      } else {
        // Append new URL to array (or create new array if empty)
        updateData = {
          [fieldName]: [...currentArray, documentUrl],
        };
      }
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
      if ((roomMapping.roomType === "bedrooms" || roomMapping.roomType === "bathrooms") && roomIndex !== null) {
        const roomIdx = parseInt(roomIndex, 10);
        if (isNaN(roomIdx)) {
          return NextResponse.json(
            { error: "Invalid roomIndex" },
            { status: 400 }
          );
        }

        const roomArray = roomMapping.roomType === "bedrooms" ? "bedrooms" : "bathrooms";
        const rooms = Array.isArray(updatedReport[roomArray]) ? [...updatedReport[roomArray]] : [];
        
        // Ensure array has enough elements
        while (rooms.length <= roomIdx) {
          rooms.push({ status: null, comment: null, affects_commercialization: null, incident_photos: [], marketing_photos: [] });
        }

        // Get current photos array
        const currentPhotos = Array.isArray(rooms[roomIdx]?.[roomMapping.photoType]) 
          ? [...rooms[roomIdx][roomMapping.photoType]] 
          : [];

        // If oldValue is provided, replace it; otherwise append
        if (oldValue && currentPhotos.includes(oldValue)) {
          currentPhotos[currentPhotos.indexOf(oldValue)] = documentUrl;
        } else {
          currentPhotos.push(documentUrl);
        }

        rooms[roomIdx] = { ...rooms[roomIdx], [roomMapping.photoType]: currentPhotos };
        updatedReport[roomArray] = rooms;
      } else {
        // Handle simple rooms (single objects)
        const roomKey = roomMapping.roomType as keyof typeof updatedReport;
        const currentRoom = updatedReport[roomKey] || { status: null, comment: null, affects_commercialization: null, incident_photos: [], marketing_photos: [] };
        const currentPhotos = Array.isArray(currentRoom[roomMapping.photoType]) ? [...currentRoom[roomMapping.photoType]] : [];

        // If oldValue is provided, replace it; otherwise append
        if (oldValue && currentPhotos.includes(oldValue)) {
          currentPhotos[currentPhotos.indexOf(oldValue)] = documentUrl;
        } else {
          currentPhotos.push(documentUrl);
        }

        updatedReport[roomKey] = { ...currentRoom, [roomMapping.photoType]: currentPhotos };
      }

      updateData = { technical_inspection_report: updatedReport };
    } else {
      // Single string value for other fields
      updateData = { [fieldName]: documentUrl };
    }

    const { error: updateError } = await supabase
      .from("properties")
      .update(updateData)
      .eq("property_unique_id", propertyId);

    if (updateError) {
      // Try to clean up uploaded file
      await supabase.storage.from(bucket).remove([storagePath]);
      return NextResponse.json(
        { error: `Failed to update database: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Detectar cambios en campos de secciones Prophero y resetear si es necesario
    // Esto se ejecuta incluso si la tarjeta no está abierta
    try {
      const { detectAndResetPropheroSection } = await import("@/lib/prophero-field-change-detector");
      await detectAndResetPropheroSection(propertyId, updateData);
    } catch (error) {
      // No fallar la request si hay error en la detección de cambios
      console.error("Error detecting prophero field changes:", error);
    }

    // Step 4: Cleanup old file (if replacing)
    // Delete the old file when replacing (both for single values and array replacements)
    if (oldValue) {
      const oldStoragePath = extractStoragePath(oldValue);
      if (oldStoragePath) {
        await supabase.storage.from(bucket).remove([oldStoragePath]);
      }
    }

    return NextResponse.json({ success: true, url: documentUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
