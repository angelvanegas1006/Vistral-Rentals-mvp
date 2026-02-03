/**
 * Centralized document field labels to ensure consistency across all tabs.
 * Use these constants instead of hardcoded strings to avoid confusion.
 */

export const DOCUMENT_LABELS = {
  // Legal Documents
  PURCHASE_CONTRACT: "Contrato de compraventa de la propiedad",
  LAND_REGISTRY_NOTE: "Nota Simple de la propiedad",
  PROPERTY_MANAGEMENT_CONTRACT: "Contrato Property Management",
  
  // Technical Documents
  ENERGY_CERTIFICATE: "Certificado de eficiencia energética",
  RENOVATION_FILES: "Documentos de la reforma",
  
  // Insurance
  HOME_INSURANCE_POLICY: "Póliza del Seguro de Hogar",
  
  // Financial
  BANK_CERTIFICATE: "Certificado de titularidad bancaria",
  
  // Supplies - Contracts
  CONTRACT_ELECTRICITY: "Contrato Electricidad",
  CONTRACT_WATER: "Contrato Agua",
  CONTRACT_GAS: "Contrato Gas",
  
  // Supplies - Bills
  BILL_ELECTRICITY: "Factura Electricidad",
  BILL_WATER: "Factura Agua",
  BILL_GAS: "Factura Gas",
} as const;

/**
 * Map database field names to their standard labels
 */
export const FIELD_TO_LABEL: Record<string, string> = {
  // Documents
  doc_purchase_contract: DOCUMENT_LABELS.PURCHASE_CONTRACT,
  doc_land_registry_note: DOCUMENT_LABELS.LAND_REGISTRY_NOTE,
  property_management_plan_contract_url: DOCUMENT_LABELS.PROPERTY_MANAGEMENT_CONTRACT,
  doc_energy_cert: DOCUMENT_LABELS.ENERGY_CERTIFICATE,
  doc_renovation_files: DOCUMENT_LABELS.RENOVATION_FILES,
  home_insurance_policy_url: DOCUMENT_LABELS.HOME_INSURANCE_POLICY,
  client_bank_certificate_url: DOCUMENT_LABELS.BANK_CERTIFICATE,
  doc_contract_electricity: DOCUMENT_LABELS.CONTRACT_ELECTRICITY,
  doc_contract_water: DOCUMENT_LABELS.CONTRACT_WATER,
  doc_contract_gas: DOCUMENT_LABELS.CONTRACT_GAS,
  doc_bill_electricity: DOCUMENT_LABELS.BILL_ELECTRICITY,
  doc_bill_water: DOCUMENT_LABELS.BILL_WATER,
  doc_bill_gas: DOCUMENT_LABELS.BILL_GAS,
  // Text fields
  admin_name: "Administrador de la propiedad",
  keys_location: "Localización de las llaves",
  client_iban: "Cuenta bancaria del propietario (IBAN)",
  property_manager: "Property Manager asignado",
};

/**
 * Get the standard label for a database field
 */
export function getDocumentLabel(fieldName: string): string {
  return FIELD_TO_LABEL[fieldName] || fieldName;
}

/**
 * Get the standard label for any field (document or text field)
 */
export function getFieldLabel(fieldName: string): string {
  return FIELD_TO_LABEL[fieldName] || fieldName;
}
