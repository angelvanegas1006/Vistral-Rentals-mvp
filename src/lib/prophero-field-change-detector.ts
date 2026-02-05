import { createClient } from "@/lib/supabase/client";
import type { PropheroSectionReviews, PropheroSectionReview } from "@/lib/supabase/types";

// Mapeo de campos de Supabase a IDs de sección Prophero
const FIELD_TO_SECTION_MAP: Record<string, string> = {
  // property-management-info
  admin_name: "property-management-info",
  keys_location: "property-management-info",
  
  // technical-documents
  doc_energy_cert: "technical-documents",
  doc_renovation_files: "technical-documents",
  
  // legal-documents
  doc_purchase_contract: "legal-documents",
  doc_land_registry_note: "legal-documents",
  
  // client-financial-info
  client_iban: "client-financial-info",
  client_bank_certificate_url: "client-financial-info",
  
  // supplies-contracts
  doc_contract_electricity: "supplies-contracts",
  doc_contract_water: "supplies-contracts",
  doc_contract_gas: "supplies-contracts",
  
  // supplies-bills
  doc_bill_electricity: "supplies-bills",
  doc_bill_water: "supplies-bills",
  doc_bill_gas: "supplies-bills",
  
  // home-insurance
  home_insurance_type: "home-insurance",
  home_insurance_policy_url: "home-insurance",
  
  // property-management
  property_management_plan: "property-management",
  property_management_plan_contract_url: "property-management",
  property_manager: "property-management",
};

// Mapeo de secciones a campos (para comparación con snapshot)
const SECTION_FIELDS_MAP: Record<string, string[]> = {
  "property-management-info": ["admin_name", "keys_location"],
  "technical-documents": ["doc_energy_cert", "doc_renovation_files"],
  "legal-documents": ["doc_purchase_contract", "doc_land_registry_note"],
  "client-financial-info": ["client_iban", "client_bank_certificate_url"],
  "supplies-contracts": ["doc_contract_electricity", "doc_contract_water", "doc_contract_gas"],
  "supplies-bills": ["doc_bill_electricity", "doc_bill_water", "doc_bill_gas"],
  "home-insurance": ["home_insurance_type", "home_insurance_policy_url"],
  "property-management": ["property_management_plan", "property_management_plan_contract_url", "property_manager"],
};

/**
 * Detecta si un campo actualizado pertenece a una sección Prophero con estado "No"
 * y si hay cambios comparados con el snapshot, resetea la sección a NULL
 */
export async function detectAndResetPropheroSection(
  propertyId: string,
  updatedFields: Record<string, any>
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Obtener la propiedad completa desde Supabase
    const { data: property, error: fetchError } = await supabase
      .from("properties")
      .select("prophero_section_reviews, current_stage")
      .eq("property_unique_id", propertyId)
      .single();
    
    if (fetchError || !property) {
      console.error("Error fetching property for field change detection:", fetchError);
      return false;
    }
    
    // Solo procesar si la propiedad está en fase "Viviendas Prophero"
    if (property.current_stage !== "Viviendas Prophero") {
      return false;
    }
    
    // Parsear prophero_section_reviews
    let reviews: PropheroSectionReviews = {};
    if (property.prophero_section_reviews) {
      try {
        reviews = typeof property.prophero_section_reviews === 'string'
          ? JSON.parse(property.prophero_section_reviews)
          : property.prophero_section_reviews;
      } catch (error) {
        console.error("Error parsing prophero_section_reviews:", error);
        return false;
      }
    }
    
    // Verificar cada campo actualizado
    const sectionsToReset: string[] = [];
    
    for (const [fieldName, newValue] of Object.entries(updatedFields)) {
      // Obtener la sección a la que pertenece este campo
      const sectionId = FIELD_TO_SECTION_MAP[fieldName];
      if (!sectionId) {
        // Este campo no pertenece a una sección Prophero
        continue;
      }
      
      // Verificar si la sección tiene estado "No" y un snapshot
      const review = reviews[sectionId] as PropheroSectionReview | undefined;
      if (!review || review.isCorrect !== false || !review.snapshot) {
        // La sección no tiene estado "No" o no tiene snapshot
        continue;
      }
      
      // Comparar el nuevo valor con el snapshot
      const snapshotValue = review.snapshot[fieldName];
      const hasChanged = compareValues(newValue, snapshotValue);
      
      if (hasChanged && !sectionsToReset.includes(sectionId)) {
        sectionsToReset.push(sectionId);
      }
    }
    
    // Si hay secciones para resetear, actualizar prophero_section_reviews
    if (sectionsToReset.length > 0) {
      const updatedReviews: PropheroSectionReviews = { ...reviews };
      
      for (const sectionId of sectionsToReset) {
        const review = reviews[sectionId] as PropheroSectionReview;
        updatedReviews[sectionId] = {
          ...review,
          isCorrect: null,
          reviewed: false,
          comments: null,
          // Mantener submittedComments y snapshot (histórico)
        };
      }
      
      // Guardar los cambios en Supabase
      const { error: updateError } = await supabase
        .from("properties")
        .update({ prophero_section_reviews: updatedReviews })
        .eq("property_unique_id", propertyId);
      
      if (updateError) {
        console.error("Error updating prophero_section_reviews:", updateError);
        return false;
      }
      
      // Disparar evento para actualizar el kanban
      window.dispatchEvent(new CustomEvent('prophero-reviews-updated', {
        detail: {
          propertyId,
          propheroSectionReviews: updatedReviews
        }
      }));
      
      console.log(`✅ Secciones reseteadas automáticamente: ${sectionsToReset.join(", ")}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error in detectAndResetPropheroSection:", error);
    return false;
  }
}

/**
 * Compara dos valores para detectar cambios
 */
function compareValues(newValue: any, snapshotValue: any): boolean {
  // Manejar arrays (como doc_renovation_files)
  if (Array.isArray(newValue) || Array.isArray(snapshotValue)) {
    const newArray = Array.isArray(newValue) ? newValue : [];
    const snapshotArray = Array.isArray(snapshotValue) ? snapshotValue : [];
    return JSON.stringify(newArray.sort()) !== JSON.stringify(snapshotArray.sort());
  }
  
  // Comparación normal
  const normalizedNew = newValue !== null && newValue !== undefined ? newValue : null;
  const normalizedSnapshot = snapshotValue !== null && snapshotValue !== undefined ? snapshotValue : null;
  
  return normalizedNew !== normalizedSnapshot;
}
