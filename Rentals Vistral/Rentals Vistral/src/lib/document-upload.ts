/**
 * Document Upload Utility
 * 
 * Handles uploading documents to Supabase Storage, updating the database,
 * and cleaning up old files when replacing documents.
 */

import { createClient } from "@/lib/supabase/client";

// Field to bucket/folder mapping based on docs/docs-architecture.md
interface FieldMapping {
  bucket: "properties-public-docs" | "properties-restricted-docs";
  folder: string;
}

const FIELD_MAPPINGS: Record<string, FieldMapping> = {
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
  // Supplies - Electricity
  doc_contract_electricity: {
    bucket: "properties-restricted-docs",
    folder: "property/supplies/electricity",
  },
  doc_bill_electricity: {
    bucket: "properties-restricted-docs",
    folder: "property/supplies/electricity",
  },
  // Supplies - Water
  doc_contract_water: {
    bucket: "properties-restricted-docs",
    folder: "property/supplies/water",
  },
  doc_bill_water: {
    bucket: "properties-restricted-docs",
    folder: "property/supplies/water",
  },
  // Supplies - Gas
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
  tenant_custom_identity_documents: {
    bucket: "properties-restricted-docs",
    folder: "tenant/identity",
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
 * Returns null if URL is not a Supabase Storage URL
 */
function extractStoragePath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Supabase Storage URLs typically have format:
    // https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    // or signed URLs with /sign/{bucket}/{path}
    const pathMatch = urlObj.pathname.match(
      /\/(?:public|sign)\/([^/]+)\/(.+)$/
    );
    if (pathMatch) {
      return pathMatch[2]; // Return the path part after bucket name
    }
    // Fallback: try to extract from pathname directly
    const parts = urlObj.pathname.split("/");
    const bucketIndex = parts.findIndex(
      (p) => p === "public" || p === "sign"
    );
    if (bucketIndex >= 0 && bucketIndex < parts.length - 1) {
      return parts.slice(bucketIndex + 2).join("/");
    }
    return null;
  } catch {
    // If URL parsing fails, try to extract path from string
    const pathMatch = url.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)$/);
    return pathMatch ? pathMatch[1] : null;
  }
}

/**
 * Delete old file from Supabase Storage if it exists
 */
async function deleteOldFile(
  supabase: ReturnType<typeof createClient>,
  oldUrl: string | null | undefined,
  bucket: string
): Promise<void> {
  if (!oldUrl) return;

  const storagePath = extractStoragePath(oldUrl);
  if (!storagePath) {
    console.warn(`Could not extract storage path from URL: ${oldUrl}`);
    return;
  }

  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  if (error) {
    console.error(`Failed to delete old file ${storagePath} from ${bucket}:`, error);
    // Don't throw - deletion failure shouldn't block upload
  }
}

/**
 * Upload a document to Supabase Storage and update the database
 * Uses server-side API route to bypass RLS policies
 * 
 * @param fieldName - The database column name (e.g., "doc_purchase_contract")
 * @param propertyId - The property unique ID
 * @param file - The file to upload
 * @param oldValue - The current URL value (for cleanup if replacing)
 * @returns The new document URL
 */
export async function uploadDocument(
  fieldName: string,
  propertyId: string,
  file: File,
  oldValue?: string | null
): Promise<string> {
  // Use server-side API route to bypass RLS policies
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fieldName", fieldName);
  formData.append("propertyId", propertyId);
  if (oldValue) {
    formData.append("oldValue", oldValue);
  }

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.url;
}

/**
 * Delete a document from Supabase Storage and update the database
 * Uses server-side API route to bypass RLS policies
 * 
 * For JSONB array fields (doc_renovation_files, pics_urls): Removes the URL from the array
 * For single text fields: Sets the field to null
 * 
 * @param fieldName - The database column name (e.g., "doc_purchase_contract")
 * @param propertyId - The property unique ID
 * @param fileUrl - The URL of the file to delete
 */
export async function deleteDocument(
  fieldName: string,
  propertyId: string,
  fileUrl: string
): Promise<void> {
  // Use server-side API route to bypass RLS policies
  const response = await fetch("/api/documents/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fieldName,
      propertyId,
      fileUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `Delete failed with status ${response.status}`);
  }
}
