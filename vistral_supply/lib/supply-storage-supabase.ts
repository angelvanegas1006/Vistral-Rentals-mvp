import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "./utils";

const STORAGE_BUCKET = "property-files";

export interface StorageFileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // URL pública del archivo en Supabase Storage
  uploadedAt: string;
  path: string; // Ruta del archivo en el bucket
}

/**
 * Upload a file to Supabase Storage
 * @param file - File object to upload
 * @param propertyId - Property ID to organize files
 * @param folder - Optional folder name (e.g., "checklist", "documentation", "owners", "tenants")
 * @returns StorageFileUpload object with URL
 */
export async function uploadFileToStorage(
  file: File,
  propertyId: string,
  folder?: string
): Promise<StorageFileUpload> {
  if (isDemoMode()) {
    console.warn("[uploadFileToStorage] Demo mode: Returning mock file");
    // Return mock data for demo mode
    return {
      id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // Blob URL for demo
      uploadedAt: new Date().toISOString(),
      path: `demo/${propertyId}/${folder || "files"}/${file.name}`,
    };
  }

  const supabase = createClient();

  // Generate unique file path
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const fileExtension = file.name.split(".").pop();
  const fileName = `${timestamp}-${randomId}.${fileExtension}`;
  const filePath = folder
    ? `${propertyId}/${folder}/${fileName}`
    : `${propertyId}/${fileName}`;

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error("[uploadFileToStorage] Error uploading file:", error);
      throw new Error(`Error al subir el archivo: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error("No se pudo obtener la URL pública del archivo");
    }

    return {
      id: `${timestamp}-${randomId}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      uploadedAt: new Date().toISOString(),
      path: filePath,
    };
  } catch (error: any) {
    console.error("[uploadFileToStorage] Unexpected error:", error);
    throw error;
  }
}

/**
 * Upload multiple files to Supabase Storage
 */
export async function uploadFilesToStorage(
  files: File[],
  propertyId: string,
  folder?: string
): Promise<StorageFileUpload[]> {
  return Promise.all(
    files.map((file) => uploadFileToStorage(file, propertyId, folder))
  );
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFileFromStorage(filePath: string): Promise<void> {
  if (isDemoMode()) {
    console.warn("[deleteFileFromStorage] Demo mode: Skipping delete");
    return;
  }

  const supabase = createClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error("[deleteFileFromStorage] Error deleting file:", error);
    throw new Error(`Error al eliminar el archivo: ${error.message}`);
  }
}

/**
 * Delete multiple files from Supabase Storage
 */
export async function deleteFilesFromStorage(filePaths: string[]): Promise<void> {
  if (isDemoMode()) {
    console.warn("[deleteFilesFromStorage] Demo mode: Skipping delete");
    return;
  }

  if (filePaths.length === 0) return;

  const supabase = createClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(filePaths);

  if (error) {
    console.error("[deleteFilesFromStorage] Error deleting files:", error);
    throw new Error(`Error al eliminar los archivos: ${error.message}`);
  }
}

/**
 * Get public URL for a file in storage
 */
export function getStorageFileUrl(filePath: string): string {
  if (isDemoMode()) {
    return `demo://${filePath}`;
  }

  const supabase = createClient();
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data?.publicUrl || "";
}
