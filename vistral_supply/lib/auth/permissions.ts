import type { Database } from '@/lib/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type Property = Database['public']['Tables']['properties']['Row'];

/**
 * Determina si un usuario puede ver una propiedad
 */
export function canViewProperty(
  userRole: AppRole | null,
  property: Property | null,
  userId: string | null
): boolean {
  if (!userRole || !property || !userId) {
    return false;
  }

  // Partners solo pueden ver propiedades que crearon
  if (userRole === 'supply_partner') {
    return property.created_by === userId;
  }

  // Otros roles pueden ver todas las propiedades
  return [
    'supply_analyst',
    'supply_admin',
    'supply_lead',
    'renovator_analyst',
    'reno_lead',
  ].includes(userRole);
}

/**
 * Determina si un usuario puede editar una propiedad
 */
export function canEditProperty(
  userRole: AppRole | null,
  property: Property | null,
  userId: string | null
): boolean {
  if (!userRole || !property || !userId) {
    return false;
  }

  // Partners solo pueden editar propiedades que crearon
  // Si created_by es null (propiedades antiguas), permitir edición si es el único usuario
  if (userRole === 'supply_partner') {
    // Si created_by es null, asumir que puede editar (propiedades creadas antes del campo)
    if (property.created_by === null) {
      return true;
    }
    return property.created_by === userId;
  }

  // Supply Analyst, Supply Lead y Supply Admin pueden editar todas las propiedades
  if (['supply_analyst', 'supply_admin', 'supply_lead'].includes(userRole)) {
    return true;
  }

  // Renovator Analyst y Reno Lead pueden ver pero no editar propiedades de Supply
  // (solo pueden crear presupuestos)
  return false;
}

/**
 * Determina si un usuario puede cambiar la fase de una propiedad
 */
export function canChangePhase(
  userRole: AppRole | null,
  property: Property | null
): boolean {
  if (!userRole || !property) {
    return false;
  }

  // Partners solo pueden cambiar fase a "in-review" cuando completan (ya implementado)
  // No pueden cambiar fases manualmente
  if (userRole === 'supply_partner') {
    return false;
  }

  // Supply Analyst, Supply Lead y Supply Admin pueden cambiar fases
  if (['supply_analyst', 'supply_admin', 'supply_lead'].includes(userRole)) {
    return true;
  }

  // Renovator Analyst y Reno Lead no pueden cambiar fases de propiedades de Supply
  return false;
}

/**
 * Determina si un usuario puede asignar propiedades a otros usuarios
 */
export function canAssignProperty(userRole: AppRole | null): boolean {
  if (!userRole) {
    return false;
  }

  // Solo Leads y Admins pueden asignar propiedades
  return ['supply_lead', 'reno_lead', 'supply_admin'].includes(userRole);
}

/**
 * Determina si un usuario puede crear presupuestos
 */
export function canCreateBudget(userRole: AppRole | null): boolean {
  if (!userRole) {
    return false;
  }

  // Renovator Analyst y Reno Lead pueden crear presupuestos
  return ['renovator_analyst', 'reno_lead', 'supply_admin'].includes(userRole);
}

/**
 * Determina si un usuario puede ver todas las propiedades (sin filtro por created_by)
 */
export function canViewAllProperties(userRole: AppRole | null): boolean {
  if (!userRole) {
    return false;
  }

  // Partners solo ven sus propias propiedades
  if (userRole === 'supply_partner') {
    return false;
  }

  // Otros roles ven todas las propiedades
  return true;
}

/**
 * Determina si un usuario tiene acceso a la sección de Reno
 */
export function hasRenoAccess(userRole: AppRole | null): boolean {
  if (!userRole) {
    return false;
  }

  return ['renovator_analyst', 'reno_lead', 'supply_admin'].includes(userRole);
}

/**
 * Determina si un usuario tiene acceso a la sección de Supply
 */
export function hasSupplyAccess(userRole: AppRole | null): boolean {
  if (!userRole) {
    return false;
  }

  return [
    'supply_partner',
    'supply_analyst',
    'supply_admin',
    'supply_lead',
    'renovator_analyst',
    'reno_lead',
    'scouter',
    'supply_project_analyst',
    'supply_project_lead',
  ].includes(userRole);
}

/**
 * Determina si un usuario tiene acceso a la sección Proyecto (/proyecto)
 */
export function hasProyectoAccess(userRole: AppRole | null): boolean {
  if (!userRole) {
    return false;
  }

  return [
    'scouter',
    'supply_project_analyst',
    'supply_project_lead',
    'supply_admin',
  ].includes(userRole);
}
