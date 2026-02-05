/**
 * Configuration for Supply Kanban phases by role
 */
import type { Database } from '@/lib/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

// Partner Kanban phases (según primera imagen)
export type PartnerKanbanPhase = 
  | "draft" // Borrador / Drafts
  | "in-review" // En revisión / Under review
  | "needs-correction" // Necesita corrección / Needs correction
  | "in-negotiation" // En negociación / In negotiation
  | "arras" // Arras
  | "settlement" // Escritura / Settlement
  | "sold" // Vendidas / Sold
  | "rejected"; // Rechazadas / Rejected

// Supply Analyst Kanban phases
export type AnalystKanbanPhase =
  | "backlog" // Backlog
  | "under-review" // Under review
  | "needs-correction" // Needs correction
  | "renovation-estimation" // Renovation Estimation
  | "financial-analysis" // Financial Analysis
  | "in-negotiation" // In negotiation
  | "arras" // Arras
  | "done" // Done
  | "rejected"; // Rejected

// Reno Kanban phases
export type RenoKanbanPhase =
  | "backlog" // Backlog (was "pending")
  | "in-progress" // In progress
  | "completed"; // Completed

// Union type for all phases
export type SupplyKanbanPhase = PartnerKanbanPhase | AnalystKanbanPhase | RenoKanbanPhase;

export interface SupplyKanbanColumn {
  key: SupplyKanbanPhase;
  stage: SupplyKanbanPhase;
  translationKey: string;
}

// Partner Kanban columns (según primera imagen: Drafts, Under review, Needs correction, In negotiation, Arras, Escritura, Vendidas, Rechazadas)
export const partnerKanbanColumns: SupplyKanbanColumn[] = [
  { key: "draft", stage: "draft", translationKey: "draft" },
  { key: "in-review", stage: "in-review", translationKey: "inReview" },
  { key: "needs-correction", stage: "needs-correction", translationKey: "needsCorrection" },
  { key: "in-negotiation", stage: "in-negotiation", translationKey: "inNegotiation" },
  { key: "arras", stage: "arras", translationKey: "arras" },
  { key: "settlement", stage: "settlement", translationKey: "settlement" },
  { key: "sold", stage: "sold", translationKey: "sold" },
  { key: "rejected", stage: "rejected", translationKey: "rejected" },
];

// Supply Analyst Kanban columns
export const analystKanbanColumns: SupplyKanbanColumn[] = [
  { key: "backlog", stage: "backlog", translationKey: "backlog" },
  { key: "under-review", stage: "under-review", translationKey: "underReview" },
  { key: "needs-correction", stage: "needs-correction", translationKey: "needsCorrection" },
  { key: "renovation-estimation", stage: "renovation-estimation", translationKey: "renovationEstimation" },
  { key: "financial-analysis", stage: "financial-analysis", translationKey: "financialAnalysis" },
  { key: "in-negotiation", stage: "in-negotiation", translationKey: "inNegotiation" },
  { key: "arras", stage: "arras", translationKey: "arras" },
  { key: "done", stage: "done", translationKey: "done" },
  { key: "rejected", stage: "rejected", translationKey: "rejected" },
];

// Reno Kanban columns
export const renoKanbanColumns: SupplyKanbanColumn[] = [
  { key: "backlog", stage: "backlog", translationKey: "backlog" },
  { key: "in-progress", stage: "in-progress", translationKey: "inProgress" },
  { key: "completed", stage: "completed", translationKey: "completed" },
];

// Legacy support - defaults to partner columns
export const supplyKanbanColumns: SupplyKanbanColumn[] = partnerKanbanColumns;
export const visibleSupplyKanbanColumns: SupplyKanbanColumn[] = partnerKanbanColumns;

/**
 * Get Kanban configuration based on user role
 */
export function getKanbanConfig(role: AppRole | null): SupplyKanbanColumn[] {
  if (!role) {
    return partnerKanbanColumns; // Default to partner
  }

  switch (role) {
    case 'supply_partner':
      return partnerKanbanColumns;
    case 'supply_analyst':
    case 'supply_lead':
      return analystKanbanColumns;
    case 'supply_admin':
      // Admin puede ver todos los Kanbans, pero por defecto muestra el del Partner
      // TODO: En el futuro podríamos agregar un selector para cambiar entre Kanbans
      return partnerKanbanColumns;
    case 'renovator_analyst':
    case 'reno_lead':
      return renoKanbanColumns;
    default:
      return partnerKanbanColumns;
  }
}

/**
 * Get the status field name based on role
 */
export function getStatusField(role: AppRole | null): 'status' | 'analyst_status' {
  if (!role) {
    return 'status';
  }

  switch (role) {
    case 'supply_analyst':
    case 'supply_lead':
      return 'analyst_status';
    case 'supply_admin':
      // Admin usa 'status' porque ve el Kanban del Partner por defecto
      return 'status';
    default:
      return 'status';
  }
}
