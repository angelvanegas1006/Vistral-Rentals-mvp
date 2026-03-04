/**
 * Role-based permission helpers.
 * Currently only "admin" role exists. Extend as new roles are added.
 */

export function canViewProperty(role: string | null): boolean {
  return role === "admin";
}

export function canEditProperty(role: string | null): boolean {
  return role === "admin";
}

export function canDeleteProperty(role: string | null): boolean {
  return role === "admin";
}

export function canManageUsers(role: string | null): boolean {
  return role === "admin";
}

export function canViewAllProperties(role: string | null): boolean {
  return role === "admin";
}

export function isAdmin(role: string | null): boolean {
  return role === "admin";
}
