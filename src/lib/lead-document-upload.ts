/**
 * Lead Document Upload Utility
 *
 * Handles uploading / deleting documents for leads.
 * Bucket: leads-restricted-docs
 * Paths:
 *   - identity: {leads_unique_id}/identity/{filename}
 *   - laboral_financial: {leads_unique_id}/laboral_financial/{filename}
 *
 * Uses server-side API route (/api/leads/[leadId]/documents/*) to bypass RLS.
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
 * Upload a laboral/financial obligatory document.
 *
 * @param leadId         - The lead UUID
 * @param leadsUniqueId  - The leads_unique_id (e.g. "LEAD-001")
 * @param fieldKey       - Obligatory field key (e.g. "ultima_nomina", "vida_laboral")
 * @param file           - The file to upload
 * @param oldValue       - Current URL (for cleanup when replacing)
 */
export async function uploadLeadLaboralObligatoryDocument(
  leadId: string,
  leadsUniqueId: string,
  fieldKey: string,
  file: File,
  oldValue?: string | null
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("leadsUniqueId", leadsUniqueId);
  formData.append("folder", "laboral_financial");
  formData.append("fieldKey", fieldKey);
  if (oldValue) {
    formData.append("oldValue", oldValue);
  }

  const response = await fetch(
    `/api/leads/${encodeURIComponent(leadId)}/documents/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.url;
}

/**
 * Upload a laboral/financial complementary document.
 *
 * @param leadId         - The lead UUID
 * @param leadsUniqueId  - The leads_unique_id
 * @param docType        - Type from dropdown (e.g. "Saldo en cuenta bancaria", "Otros")
 * @param docTitle       - Title (required for "Otros")
 * @param file           - The file to upload
 */
export async function uploadLeadLaboralComplementaryDocument(
  leadId: string,
  leadsUniqueId: string,
  docType: string,
  docTitle: string,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("leadsUniqueId", leadsUniqueId);
  formData.append("folder", "laboral_financial");
  formData.append("docType", docType);
  formData.append("docTitle", docTitle);

  const response = await fetch(
    `/api/leads/${encodeURIComponent(leadId)}/documents/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.url;
}

/**
 * Delete a laboral/financial document (obligatory or complementary).
 *
 * @param leadId   - The lead UUID
 * @param fileUrl  - The URL of the file to delete
 * @param fieldKey - For obligatory docs: the field key. Omit for complementary.
 */
export async function deleteLeadLaboralDocument(
  leadId: string,
  fileUrl: string,
  fieldKey?: string
): Promise<void> {
  const body: { fileUrl: string; fieldType: string; fieldKey?: string } = {
    fileUrl,
    fieldType: "laboral_financial",
  };
  if (fieldKey) {
    body.fieldKey = fieldKey;
  }

  const response = await fetch(
    `/api/leads/${encodeURIComponent(leadId)}/documents/delete`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `Delete failed with status ${response.status}`);
  }
}

/**
 * Clear laboral_financial_docs.obligatory: delete all obligatory files from storage and set obligatory to {}.
 * Call when employment_status or employment_contract_type changes.
 */
export async function clearLeadLaboralObligatoryDocs(leadId: string): Promise<void> {
  const response = await fetch(
    `/api/leads/${encodeURIComponent(leadId)}/documents/clear-laboral-obligatory`,
    { method: "POST" }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `Clear failed with status ${response.status}`);
  }
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
