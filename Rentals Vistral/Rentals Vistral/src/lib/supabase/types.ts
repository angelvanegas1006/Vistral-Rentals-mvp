// Tipos TypeScript para las tablas de Supabase
// Estos tipos se generarán automáticamente más adelante usando supabase gen types
// Por ahora, definimos tipos básicos basados en nuestras interfaces

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Types for Prophero section reviews
export interface PropheroSectionReview {
  reviewed: boolean;
  isCorrect: boolean | null; // true = Sí, false = No, null = no revisado/reseteado
  comments: string | null; // Editable comments (always exists)
  hasIssue: boolean; // Historical flag: true when isCorrect === false, never reverts to false
  submittedComments?: string | null; // Snapshot of submitted comments (read-only after submission)
  snapshot?: Record<string, any> | null; // Field values when marked as "No"
}

export interface CommentSubmissionHistoryEntry {
  sectionId: string;
  sectionTitle: string;
  comments: string;
  submittedAt: string; // ISO timestamp
  fieldValues: Record<string, any>; // Snapshot of field values at submission time
}

export interface PropheroSectionReviewsMeta {
  commentsSubmitted?: boolean; // Flag: true when comments were submitted
  commentsSubmittedAt?: string; // ISO timestamp of when comments were first submitted
  commentSubmissionHistory?: CommentSubmissionHistoryEntry[]; // Complete history of all comment submissions
}

export type PropheroSectionReviews = {
  [sectionId: string]: PropheroSectionReview;
  _meta?: PropheroSectionReviewsMeta;
};

// Enum for Client Presentation Channel (Section 1: Presentación al Cliente)
export enum ClientPresentationChannel {
  PHONE = "Llamada telefónica",
  EMAIL = "Correo electrónico",
  BOTH = "Ambos",
}

// Types for Technical Inspection Report (Section 3: Inspección Técnica)
export interface RoomInspectionData {
  status: "good" | "incident" | null;
  comment: string | null;
  affects_commercialization: boolean | null;
  incident_photos: string[];
  marketing_photos: string[];
}

export interface TechnicalInspectionReport {
  common_areas?: RoomInspectionData;
  entry_hallways?: RoomInspectionData;
  living_room?: RoomInspectionData;
  kitchen?: RoomInspectionData;
  exterior?: RoomInspectionData;
  garage?: RoomInspectionData;
  terrace?: RoomInspectionData;
  storage?: RoomInspectionData;
  bedrooms?: RoomInspectionData[];
  bathrooms?: RoomInspectionData[];
}

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          property_unique_id: string; // Primary identifier for routing
          address: string;
          city: string | null;
          area_cluster: string | null;
          current_stage: string; // NOTA: En Supabase se llama "current_stage", no "current_phase"
          days_in_stage: number; // NOTA: En Supabase se llama "days_in_stage", no "days_in_phase"
          // Mantener compatibilidad con nombres antiguos
          current_phase?: string;
          is_expired: boolean | null;
          needs_update: boolean | null;
          property_asset_type: "Project" | "New Build" | "Building" | "Unit" | "WIP" | null;
          writing_date: string | null;
          visit_date: string | null;
          days_to_visit: number | null;
          days_to_start: number | null;
          reno_end_date: string | null; // Fecha de fin de renovación (DATE)
          property_ready_date: string | null; // Fecha en que la propiedad está lista (DATE)
          days_to_publish_rent: number | null; // Días para publicar el alquiler (INTEGER)
          // Campos económicos
          target_rent_price: number | null; // Precio objetivo de alquiler mensual (NUMERIC)
          expected_yield: number | null; // Rentabilidad esperada en porcentaje (NUMERIC)
          days_in_phase: number | null; // Días en la fase actual (INTEGER, alternativa a days_in_stage)
          actual_yield: number | null; // Rentabilidad real obtenida en porcentaje (NUMERIC)
          vacancy_gap_days: number | null; // Días de vacancia (gap entre alquileres) (INTEGER)
          // Campos para tareas "Listo para Alquilar"
          technical_validation: boolean | null;
          monthly_rent: number | null;
          announcement_price: number | null;
          owner_notified: boolean | null;
          publish_online: boolean | null;
          idealista_description: string | null;
          // Sección 1: Presentación al Cliente
          client_presentation_done: boolean | null; // ¿Se ha realizado la presentación del servicio al cliente?
          client_presentation_date: string | null; // Fecha de presentación (DATE)
          client_presentation_channel: ClientPresentationChannel | null; // Canal de comunicación utilizado para la presentación
          // Sección 2: Estrategia de Precio
          price_approval: boolean | null; // ¿Ha aprobado el cliente este precio de publicación?
          // Sección 3: Inspección Técnica y Reportaje
          technical_inspection_report: Json | null; // Reporte completo de inspección técnica agrupado por estancia (JSONB)
          // Property Details
          square_meters: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          floor_number: number | null;
          construction_year: number | null;
          orientation: string | null;
          garage: string | null;
          has_elevator: boolean | null;
          has_terrace: boolean | null;
          keys_location: string | null;
          admin_name: string | null;
          community_fees_paid: boolean | null;
          taxes_paid: boolean | null;
          itv_passed: boolean | null;
          // Documents & Media
          pics_urls: Json | null; // JSONB array of strings
          doc_renovation_files: Json | null; // JSONB array of strings
          doc_energy_cert: string | null;
          doc_purchase_contract: string | null;
          doc_land_registry_note: string | null;
          // Supplies Documents
          doc_contract_electricity: string | null;
          doc_bill_electricity: string | null;
          doc_contract_water: string | null;
          doc_bill_water: string | null;
          doc_contract_gas: string | null;
          doc_bill_gas: string | null;
          doc_contract_other: string | null;
          doc_bill_other: string | null;
          // Insurance
          home_insurance_type: string | null;
          home_insurance_policy_url: string | null;
          // Rental Management Fields
          rental_type: "Larga estancia" | "Corta estancia" | "Vacacional" | null; // Tipo de alquiler
          property_management_plan: "Premium" | "Basic" | null; // Plan PM
          property_manager: "JJ" | null; // Property Manager asignado (único valor por ahora)
          rentals_analyst: "Luis Martín" | "Alice Ruggieri" | null; // Analista de alquileres asignado
          property_management_plan_contract_url: string | null; // URL del contrato del plan de gestión
          has_existing_tenant: boolean | null; // ¿Tiene ya inquilino?
          // Investor/Owner Fields
          client_full_name: string | null;
          client_identity_doc_number: string | null;
          client_identity_doc_url: string | null;
          client_phone: string | null;
          client_email: string | null;
          client_iban: string | null;
          client_bank_certificate_url: string | null;
          // Rent receiving bank account fields (Phase 4: Inquilino aceptado)
          client_rent_receiving_iban: string | null;
          client_rent_receiving_bank_certificate_url: string | null;
          client_wants_to_change_bank_account: boolean | null;
          // Custom documents JSONB fields
          custom_legal_documents: Json | null;
          custom_insurance_documents: Json | null;
          custom_supplies_documents: Json | null;
          custom_investor_documents: Json | null;
          // Tenant fields
          tenant_full_name: string | null;
          tenant_email: string | null;
          tenant_phone: string | null;
          tenant_nif: string | null;
          tenant_iban: string | null;
          tenant_custom_identity_documents: Json | null;
          tenant_custom_financial_documents: Json | null;
          tenant_custom_other_documents: Json | null;
          // Contract fields (Inquilino aceptado phase)
          contract_signed: boolean | null;
          contract_signature_date: string | null;
          signed_lease_contract_url: string | null;
          final_rent_amount: number | null;
          lease_start_date: string | null;
          lease_end_date: string | null;
          lease_duration: string | null;
          lease_duration_unit: "months" | "years" | null;
          // Legacy contract fields (deprecated, kept for compatibility)
          contract_start_date: string | null;
          contract_duration: string | null;
          contract_duration_unit: string | null;
          final_rent_price: number | null;
          guarantee_id: string | null;
          guarantee_signed: boolean | null;
          guarantee_sent_to_signature: boolean | null;
          contract_file_url: string | null;
          guarantee_file_url: string | null;
          // Tenant supply contracts (Phase 5: Pendiente de trámites - Cambio de suministros)
          tenant_contract_electricity: string | null;
          tenant_contract_water: string | null;
          tenant_contract_gas: string | null;
          tenant_contract_other: Json | null; // JSONB array: [{title: string, url: string, createdAt: string}]
          tenant_supplies_toggles: Json | null; // JSONB object: {electricity: boolean, water: boolean, gas: boolean, other: boolean}
          // Pending procedures fields (Pendiente de trámites phase)
          utilities_validated: boolean | null;
          ownership_changed: boolean | null;
          deposit_verified: boolean | null;
          liquidation_completed: boolean | null;
          documents_closed: boolean | null;
          utilities_files_urls: Json | null;
          deposit_responsible: "Prophero" | "Inversor" | null;
          deposit_receipt_file_url: string | null;
          first_rent_payment_file_url: string | null;
          payment_receipt_file_url: string | null;
          // Rented phase fields
          is_vacant: boolean | null;
          // IPC Update phase fields
          ipc_index_type: string | null;
          ipc_new_rent_amount: number | null;
          ipc_official_communication: boolean | null;
          ipc_notification_date: string | null;
          ipc_system_updated: boolean | null;
          ipc_confirmation: boolean | null;
          ipc_tenant_accepted: boolean | null;
          // Renewal Management phase fields
          renewal_owner_intention: string | null;
          renewal_new_conditions: string | null;
          renewal_tenant_negotiated: boolean | null;
          renewal_negotiation_notes: string | null;
          renewal_formalized: boolean | null;
          renewal_new_start_date: string | null;
          renewal_new_end_date: string | null;
          renewal_deadlines_updated: boolean | null;
          renewal_no_agreement: boolean | null;
          renewal_document_file_url: string | null;
          // Finalization phase fields
          finalization_notice_received: boolean | null;
          finalization_checkout_completed: boolean | null;
          finalization_checkout_notes: string | null;
          finalization_inventory_checked: boolean | null;
          finalization_keys_collected: boolean | null;
          finalization_deposit_liquidated: boolean | null;
          finalization_deductions: string | null;
          finalization_deposit_amount: number | null;
          finalization_deposit_returned: boolean | null;
          finalization_deposit_retained: boolean | null;
          finalization_reactivated: boolean | null;
          finalization_notice_document_file_url: string | null;
          // Prophero section reviews (Fase 1)
          prophero_section_reviews: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["properties"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };
      property_tenants: {
        Row: {
          id: string;
          property_id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          nif: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["property_tenants"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_tenants"]["Insert"]>;
      };
      property_rentals: {
        Row: {
          id: string;
          property_id: string;
          rent_price: number | null;
          start_date: string | null;
          duration: string | null;
          security_deposit: number | null;
          legal_contract_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["property_rentals"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_rentals"]["Insert"]>;
      };
      property_tasks: {
        Row: {
          id: string;
          property_id: string;
          phase: string;
          task_type: string;
          task_data: Json;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["property_tasks"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_tasks"]["Insert"]>;
      };
      property_visits: {
        Row: {
          id: string;
          property_id: string;
          visit_date: string;
          visit_type: "renovation-end" | "contract-end" | "scheduled-visit" | "ipc-update";
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["property_visits"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_visits"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          zone: string | null;
          current_phase: string;
          days_in_phase: number;
          called: "Si" | "No" | null;
          discarded: "Si" | "No" | null;
          scheduled_date: string | null;
          visit_date: string | null;
          qualified: "Si" | "No" | null;
          average_income: number | null;
          finaer_status: string | null;
          number_of_occupants: number | null;
          needs_update: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["leads"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      lead_properties: {
        Row: {
          id: string;
          lead_id: string;
          property_id: string; // References properties.property_unique_id
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["lead_properties"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_properties"]["Insert"]>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
