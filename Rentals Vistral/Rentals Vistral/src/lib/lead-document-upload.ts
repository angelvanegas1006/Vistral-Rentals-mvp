/**
 * Lead Document Upload Utility
 *
 * Handles uploading / deleting identity documents for leads.
 * Bucket: leads-restricted-docs
 * Path:   {leads_unique_id}/identity/{filename}
 *
 * Uses server-side API route (/api/leads/[leadId]/documents/*) to bypass RLS,
 * following the same pattern as the property document-upload.ts utility.
 */

/**
 * Upload a lead identity document to Supabase Storage and update leads.identity_doc_url.
 *
 * @param leadId         - The lead UUID (id column, used to identify the DB row)
 * @param leadsUniqueId  - The leads_unique_id (e.g. "LEAD-001"), used as the storage folder name
 * @param file           - The file to upload
 * @param oldValue       - Current URL (for cleanup when replacing)
 * @returns The new signed document URL
 */
export async function uploadLeadIdentityDocument(
  leadId: string,
  leadsUniqueId: string,
  file: File,
  oldValue?: string | null
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("leadsUniqueId", leadsUniqueId);
  if (oldValue) {
    formData.append("oldValue", oldValue);
  }

  const response = await fetch(
    `/api/leads/${encodeURIComponent(leadId)}/documents/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      errorData.error || `Upload failed with status ${response.status}`
    );
  }

  const data = await response.json();
  return data.url;
}

/**
 * Delete a lead identity document from Supabase Storage and set leads.identity_doc_url to null.
 *
 * @param leadId  - The lead UUID (id column)
 * @param fileUrl - The URL of the file to delete
 */
export async function deleteLeadIdentityDocument(
  leadId: string,
  fileUrl: string
): Promise<void> {
  const response = await fetch(
    `/api/leads/${encodeURIComponent(leadId)}/documents/delete`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    }
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      errorData.error || `Delete failed with status ${response.status}`
    );
  }
}
