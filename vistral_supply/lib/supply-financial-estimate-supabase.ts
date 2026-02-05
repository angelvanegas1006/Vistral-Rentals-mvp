/**
 * Supabase functions for Financial Estimates CRUD operations
 */

import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/utils";
import {
  FinancialEstimateData,
  BasicInfo,
  Financing,
  ScenarioDrivers,
  FinancialResults,
} from "./supply-financial-estimate-storage";

export interface FinancialEstimateRow {
  id: string;
  property_id: string;
  version: number;
  is_current: boolean;
  basic_info: BasicInfo;
  financing: Financing;
  scenario_drivers: ScenarioDrivers;
  results: FinancialResults;
  yield_threshold: number;
  meets_threshold: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database row to FinancialEstimateData
 */
function rowToFinancialEstimateData(row: FinancialEstimateRow): FinancialEstimateData {
  return {
    id: row.id,
    propertyId: row.property_id,
    version: row.version,
    isCurrent: row.is_current,
    basicInfo: row.basic_info,
    financing: row.financing,
    scenarioDrivers: row.scenario_drivers,
    results: row.results,
    yieldThreshold: Number(row.yield_threshold),
    meetsThreshold: row.meets_threshold,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get current financial estimate for a property
 */
export async function getCurrentFinancialEstimate(
  propertyId: string
): Promise<FinancialEstimateData | null> {
  if (isDemoMode()) {
    console.warn("[getCurrentFinancialEstimate] Demo mode: Returning null");
    return null;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("financial_estimates")
      .select("*")
      .eq("property_id", propertyId)
      .eq("is_current", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to avoid error when no rows

    if (error) {
      // If table doesn't exist, return null silently
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("Could not find the table")) {
        console.warn("[getCurrentFinancialEstimate] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
        return null;
      }
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("[getCurrentFinancialEstimate] Error:", error);
      // Don't throw, just return null so app continues working
      return null;
    }

    if (!data) return null;

    return rowToFinancialEstimateData(data as FinancialEstimateRow);
  } catch (error: any) {
    // Handle table not found errors
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      console.warn("[getCurrentFinancialEstimate] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
      return null;
    }
    console.error("[getCurrentFinancialEstimate] Unexpected error:", error);
    return null;
  }
}

/**
 * Get all financial estimates for a property
 */
export async function getFinancialEstimates(
  propertyId: string
): Promise<FinancialEstimateData[]> {
  if (isDemoMode()) {
    console.warn("[getFinancialEstimates] Demo mode: Returning empty array");
    return [];
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("financial_estimates")
      .select("*")
      .eq("property_id", propertyId)
      .order("version", { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array silently
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("Could not find the table")) {
        console.warn("[getFinancialEstimates] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
        return [];
      }
      console.error("[getFinancialEstimates] Error:", error);
      // Don't throw, just return empty array
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((row) => rowToFinancialEstimateData(row as FinancialEstimateRow));
  } catch (error: any) {
    // Handle table not found errors
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      console.warn("[getFinancialEstimates] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
      return [];
    }
    console.error("[getFinancialEstimates] Unexpected error:", error);
    return [];
  }
}

/**
 * Create a new financial estimate
 */
export async function createFinancialEstimate(
  propertyId: string,
  basicInfo: BasicInfo,
  financing: Financing,
  scenarioDrivers: ScenarioDrivers,
  results: FinancialResults,
  yieldThreshold: number,
  meetsThreshold: boolean
): Promise<string> {
  if (isDemoMode()) {
    console.warn("[createFinancialEstimate] Demo mode: Skipping Supabase create");
    return "demo-estimate-id";
  }

  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    // Get next version number
    const { data: existingEstimates, error: selectError } = await supabase
      .from("financial_estimates")
      .select("version")
      .eq("property_id", propertyId)
      .order("version", { ascending: false })
      .limit(1);

    // If table doesn't exist, warn and return demo ID
    if (selectError && (selectError.code === "PGRST205" || selectError.code === "42P01" || selectError.message?.includes("Could not find the table"))) {
      console.warn("[createFinancialEstimate] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
      return "demo-estimate-id";
    }

    const nextVersion = existingEstimates && existingEstimates.length > 0
      ? existingEstimates[0].version + 1
      : 1;

    const { data, error } = await supabase
      .from("financial_estimates")
      .insert({
        property_id: propertyId,
        version: nextVersion,
        is_current: true,
        basic_info: basicInfo,
        financing: financing,
        scenario_drivers: scenarioDrivers,
        results: results,
        yield_threshold: yieldThreshold,
        meets_threshold: meetsThreshold,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      // If table doesn't exist, warn and return demo ID
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("Could not find the table")) {
        console.warn("[createFinancialEstimate] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
        return "demo-estimate-id";
      }
      console.error("[createFinancialEstimate] Error:", error);
      throw new Error(`Error al crear financial estimate: ${error.message}`);
    }

    if (!data) {
      throw new Error("No se retornó ID del financial estimate creado");
    }

    return data.id;
  } catch (error: any) {
    // Handle table not found errors
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      console.warn("[createFinancialEstimate] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
      return "demo-estimate-id";
    }
    console.error("[createFinancialEstimate] Unexpected error:", error);
    throw error;
  }
}

/**
 * Update an existing financial estimate
 */
export async function updateFinancialEstimate(
  estimateId: string,
  updates: {
    basicInfo?: BasicInfo;
    financing?: Financing;
    scenarioDrivers?: ScenarioDrivers;
    results?: FinancialResults;
    yieldThreshold?: number;
    meetsThreshold?: boolean;
  }
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[updateFinancialEstimate] Demo mode: Skipping Supabase update");
    return;
  }

  try {
    const supabase = createClient();
    
    const updateData: any = {};
    
    if (updates.basicInfo !== undefined) {
      updateData.basic_info = updates.basicInfo;
    }
    if (updates.financing !== undefined) {
      updateData.financing = updates.financing;
    }
    if (updates.scenarioDrivers !== undefined) {
      updateData.scenario_drivers = updates.scenarioDrivers;
    }
    if (updates.results !== undefined) {
      updateData.results = updates.results;
    }
    if (updates.yieldThreshold !== undefined) {
      updateData.yield_threshold = updates.yieldThreshold;
    }
    if (updates.meetsThreshold !== undefined) {
      updateData.meets_threshold = updates.meetsThreshold;
    }

    const { error } = await supabase
      .from("financial_estimates")
      .update(updateData)
      .eq("id", estimateId);

    if (error) {
      // If table doesn't exist, warn and return silently
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("Could not find the table")) {
        console.warn("[updateFinancialEstimate] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
        return;
      }
      console.error("[updateFinancialEstimate] Error:", error);
      // Don't throw, just log the error
      return;
    }
  } catch (error: any) {
    // Handle table not found errors
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      console.warn("[updateFinancialEstimate] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
      return;
    }
    console.error("[updateFinancialEstimate] Unexpected error:", error);
    // Don't throw, just log the error
  }
}

/**
 * Set a financial estimate as current (and deactivate others)
 */
export async function setCurrentFinancialEstimate(
  propertyId: string,
  estimateId: string
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[setCurrentFinancialEstimate] Demo mode: Skipping Supabase update");
    return;
  }

  try {
    const supabase = createClient();
    
    // First, deactivate all current estimates for this property
    const { error: deactivateError } = await supabase
      .from("financial_estimates")
      .update({ is_current: false })
      .eq("property_id", propertyId)
      .eq("is_current", true);

    if (deactivateError) {
      // If table doesn't exist, warn and return silently
      if (deactivateError.code === "PGRST205" || deactivateError.code === "42P01" || deactivateError.message?.includes("Could not find the table")) {
        console.warn("[setCurrentFinancialEstimate] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
        return;
      }
      console.error("[setCurrentFinancialEstimate] Error deactivating:", deactivateError);
      // Don't throw, just log the error
      return;
    }

    // Then, set the specified estimate as current
    const { error: activateError } = await supabase
      .from("financial_estimates")
      .update({ is_current: true })
      .eq("id", estimateId)
      .eq("property_id", propertyId);

    if (activateError) {
      // If table doesn't exist, warn and return silently
      if (activateError.code === "PGRST205" || activateError.code === "42P01" || activateError.message?.includes("Could not find the table")) {
        console.warn("[setCurrentFinancialEstimate] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
        return;
      }
      console.error("[setCurrentFinancialEstimate] Error activating:", activateError);
      // Don't throw, just log the error
      return;
    }
  } catch (error: any) {
    // Handle table not found errors
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      console.warn("[setCurrentFinancialEstimate] Table financial_estimates does not exist. Please run migration 026_create_financial_estimates.sql");
      return;
    }
    console.error("[setCurrentFinancialEstimate] Unexpected error:", error);
    // Don't throw, just log the error
  }
}
