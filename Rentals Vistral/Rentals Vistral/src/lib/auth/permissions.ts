import { Database } from "@/lib/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserRole {
  role: AppRole;
  property_id?: string;
}

/**
 * Check if a user can view a property
 */
export function canViewProperty(
  roles: UserRole[],
  propertyId: string
): boolean {
  // Admins can view all properties
  if (roles.some((r) => r.role === "supply_admin")) {
    return true;
  }

  // Analysts can view all properties
  if (roles.some((r) => r.role === "supply_analyst")) {
    return true;
  }

  // Partners can only view their assigned properties
  if (roles.some((r) => r.role === "supply_partner" && r.property_id === propertyId)) {
    return true;
  }

  return false;
}

/**
 * Check if a user can edit a property
 */
export function canEditProperty(
  roles: UserRole[],
  propertyId: string
): boolean {
  // Admins can edit all properties
  if (roles.some((r) => r.role === "supply_admin")) {
    return true;
  }

  // Analysts can edit all properties
  if (roles.some((r) => r.role === "supply_analyst")) {
    return true;
  }

  // Partners can edit their assigned properties
  if (roles.some((r) => r.role === "supply_partner" && r.property_id === propertyId)) {
    return true;
  }

  return false;
}

/**
 * Check if a user can delete a property
 */
export function canDeleteProperty(roles: UserRole[]): boolean {
  // Only admins can delete properties
  return roles.some((r) => r.role === "supply_admin");
}

/**
 * Check if a user can manage users
 */
export function canManageUsers(roles: UserRole[]): boolean {
  // Only admins can manage users
  return roles.some((r) => r.role === "supply_admin");
}

/**
 * Check if a user can view all properties
 */
export function canViewAllProperties(roles: UserRole[]): boolean {
  // Admins and analysts can view all properties
  return roles.some(
    (r) => r.role === "supply_admin" || r.role === "supply_analyst"
  );
}

/**
 * Get all property IDs a user can access
 */
export function getAccessiblePropertyIds(roles: UserRole[]): string[] | "all" {
  // Admins and analysts can access all properties
  if (
    roles.some((r) => r.role === "supply_admin" || r.role === "supply_analyst")
  ) {
    return "all";
  }

  // Partners can only access their assigned properties
  return roles
    .filter((r) => r.role === "supply_partner" && r.property_id)
    .map((r) => r.property_id!);
}

/**
 * Check if a user is an admin
 */
export function isAdmin(roles: UserRole[]): boolean {
  return roles.some((r) => r.role === "supply_admin");
}

/**
 * Check if a user is an analyst
 */
export function isAnalyst(roles: UserRole[]): boolean {
  return roles.some((r) => r.role === "supply_analyst");
}

/**
 * Check if a user is a partner
 */
export function isPartner(roles: UserRole[]): boolean {
  return roles.some((r) => r.role === "supply_partner");
}
