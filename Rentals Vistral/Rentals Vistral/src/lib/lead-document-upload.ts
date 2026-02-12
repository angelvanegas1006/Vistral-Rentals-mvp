/**
 * Lead document upload/delete (identity document).
 * Bucket: lead-restricted-docs. Path: {leadId}/identity/
 */

export async function uploadLeadIdentityDocument(
  leadId: string,
  file: File,
  oldValue?: string | null
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (oldValue) formData.append("oldValue", oldValue);

  const response = await fetch(`/api/leads/${encodeURIComponent(leadId)}/documents/upload`, {
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

export async function deleteLeadIdentityDocument(
  leadId: string,
  fileUrl: string
): Promise<void> {
  const response = await fetch(`/api/leads/${encodeURIComponent(leadId)}/documents/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `Delete failed with status ${response.status}`);
  }
}
