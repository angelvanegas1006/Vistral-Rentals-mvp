import type { Database, PropheroSectionReviews } from "./types";
import { generateInitials } from "@/lib/utils";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

// Mapear Property de Supabase a la interfaz Property del frontend
// NOTA: Supabase usa "current_stage" y "days_in_stage", pero el frontend usa "currentPhase" y "daysInPhase"
// NOTA: property_unique_id es el identificador principal para routing
export function mapPropertyFromSupabase(row: any) {
  return {
    property_unique_id: row.property_unique_id || row.id, // Usar property_unique_id como primario
    address: row.address,
    city: row.city || undefined,
    region: row.area_cluster || row.region || undefined, // Mantener compatibilidad con region antiguo
    areaCluster: row.area_cluster || row.region || undefined,
    // Mapear current_stage a currentPhase
    daysInPhase: row.days_in_stage ?? row.days_in_phase ?? row.time_in_stage ?? 0,
    currentPhase: row.current_stage || row.current_phase || "",
    // Usar ?? para preservar valores booleanos false
    isExpired: row.is_expired ?? undefined,
    needsUpdate: row.needs_update ?? undefined,
    propertyType: row.property_asset_type || undefined,
    managerName: row.admin_name || undefined, // Manager/Administrador de la propiedad
    rentalType: row.rental_type || undefined, // Tipo de alquiler
    propertyManager: row.property_manager || undefined, // Property Manager asignado
    rentalsAnalyst: row.rentals_analyst || undefined, // Analista de rentals asignado
    writingDate: row.writing_date || undefined,
    visitDate: row.visit_date || undefined,
    daysToVisit: row.days_to_visit ? Number(row.days_to_visit) : undefined,
    daysToStart: row.days_to_start || undefined,
    renoEndDate: row.reno_end_date || undefined,
    propertyReadyDate: row.property_ready_date || undefined,
    daysToPublishRent: row.days_to_publish_rent !== null && row.days_to_publish_rent !== undefined ? Number(row.days_to_publish_rent) : undefined,
    // Campos para tareas "Listo para Alquilar"
    technicalValidation: row.technical_validation ?? undefined,
    monthlyRent: row.monthly_rent !== null && row.monthly_rent !== undefined ? Number(row.monthly_rent) : undefined,
    announcementPrice: row.announcement_price !== null && row.announcement_price !== undefined ? Number(row.announcement_price) : undefined,
    ownerNotified: row.owner_notified ?? undefined,
    publishOnline: row.publish_online || undefined,
    idealistaPrice: row.idealista_price !== null && row.idealista_price !== undefined ? Number(row.idealista_price) : undefined,
    idealistaDescription: row.idealista_description || undefined,
    idealistaAddress: row.idealista_address || undefined,
    idealistaCity: row.idealista_city || undefined,
    idealistaPhotos: row.idealista_photos || undefined,
    // Sección 1: Presentación al Cliente
    clientPresentationDone: row.client_presentation_done ?? undefined,
    clientPresentationDate: row.client_presentation_date || undefined,
    clientPresentationChannel: row.client_presentation_channel || undefined,
    // Sección 2: Estrategia de Precio
    priceApproval: row.price_approval ?? undefined,
    // Prophero section reviews
    propheroSectionReviews: row.prophero_section_reviews ? (
      typeof row.prophero_section_reviews === 'string' 
        ? JSON.parse(row.prophero_section_reviews) 
        : row.prophero_section_reviews
    ) : undefined,
  };
}

// Mapear Lead de Supabase a la interfaz Lead del frontend
export function mapLeadFromSupabase(row: LeadRow) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    zone: row.zone || undefined,
    currentPhase: row.current_phase,
    daysInPhase: row.days_in_phase,
    called: row.called || undefined,
    discarded: row.discarded || undefined,
    scheduledDate: row.scheduled_date || undefined,
    visitDate: row.visit_date || undefined,
    qualified: row.qualified || undefined,
    averageIncome: row.average_income ? Number(row.average_income) : undefined,
    finaerStatus: row.finaer_status || undefined,
    numberOfOccupants: row.number_of_occupants || undefined,
    needsUpdate: row.needs_update,
  };
}

// Mapear Property del frontend a formato de Supabase para insert/update
export function mapPropertyToSupabase(property: {
  property_unique_id: string;
  address: string;
  city?: string;
  region?: string;
  areaCluster?: string;
  daysInPhase?: number;
  currentPhase?: string;
  isExpired?: boolean;
  needsUpdate?: boolean;
  propertyType?: "Project" | "New Build" | "Building" | "Unit" | "WIP";
  writingDate?: string;
  visitDate?: string;
  daysToVisit?: number;
  daysToStart?: number;
  renoEndDate?: string;
  propertyReadyDate?: string;
  daysToPublishRent?: number;
  // Campos para tareas "Listo para Alquilar"
  technicalValidation?: boolean;
  monthlyRent?: number;
  announcementPrice?: number;
  ownerNotified?: boolean;
  publishOnline?: "yes" | "no";
  idealistaPrice?: number;
  idealistaDescription?: string;
  idealistaAddress?: string;
  idealistaCity?: string;
  idealistaPhotos?: string[];
  // Sección 1: Presentación al Cliente
  clientPresentationDone?: boolean;
  clientPresentationDate?: string;
  clientPresentationChannel?: string;
  // Sección 2: Estrategia de Precio
  priceApproval?: boolean;
  propheroSectionReviews?: PropheroSectionReviews;
}) {
  return {
    id: property.property_unique_id, // Usar property_unique_id como id
    property_unique_id: property.property_unique_id,
    address: property.address,
    city: property.city || null,
    area_cluster: property.areaCluster || property.region || null, // Usar area_cluster, mantener compatibilidad con region
    current_stage: property.currentPhase, // Usar current_stage (no current_phase)
    days_in_stage: property.daysInPhase ?? 0, // Usar days_in_stage (no days_in_phase)
    is_expired: property.isExpired || null,
    needs_update: property.needsUpdate || null,
    property_asset_type: property.propertyType || null,
    writing_date: property.writingDate || null,
    visit_date: property.visitDate || null,
    days_to_visit: property.daysToVisit || null,
    days_to_start: property.daysToStart || null,
    reno_end_date: property.renoEndDate || null,
    property_ready_date: property.propertyReadyDate || null,
    days_to_publish_rent: property.daysToPublishRent || null,
    // Campos para tareas "Listo para Alquilar"
    technical_validation: property.technicalValidation ?? null,
    monthly_rent: property.monthlyRent || null,
    announcement_price: property.announcementPrice || null,
    owner_notified: property.ownerNotified ?? null,
    publish_online: property.publishOnline || null,
    idealista_price: property.idealistaPrice || null,
    idealista_description: property.idealistaDescription || null,
    idealista_address: property.idealistaAddress || null,
    idealista_city: property.idealistaCity || null,
    idealista_photos: property.idealistaPhotos || null,
    // Sección 1: Presentación al Cliente
    client_presentation_done: property.clientPresentationDone ?? null,
    client_presentation_date: property.clientPresentationDate || null,
    client_presentation_channel: property.clientPresentationChannel || null,
    // Sección 2: Estrategia de Precio
    price_approval: property.priceApproval ?? null,
    // Prophero section reviews
    prophero_section_reviews: property.propheroSectionReviews || null,
  };
}

// Mapear Lead del frontend a formato de Supabase para insert/update
export function mapLeadToSupabase(lead: {
  name: string;
  phone: string;
  email?: string;
  zone?: string;
  currentPhase?: string;
  daysInPhase?: number;
  called?: "Si" | "No";
  discarded?: "Si" | "No";
  scheduledDate?: string;
  visitDate?: string;
  qualified?: "Si" | "No";
  averageIncome?: number;
  finaerStatus?: string;
  numberOfOccupants?: number;
  needsUpdate?: boolean;
}) {
  return {
    name: lead.name,
    phone: lead.phone,
    email: lead.email || null,
    zone: lead.zone || null,
    current_phase: lead.currentPhase || "Sin Contactar",
    days_in_phase: lead.daysInPhase ?? 0,
    called: lead.called || null,
    discarded: lead.discarded || null,
    scheduled_date: lead.scheduledDate || null,
    visit_date: lead.visitDate || null,
    qualified: lead.qualified || null,
    average_income: lead.averageIncome || null,
    finaer_status: lead.finaerStatus || null,
    number_of_occupants: lead.numberOfOccupants || null,
    needs_update: lead.needsUpdate ?? false,
  };
}
