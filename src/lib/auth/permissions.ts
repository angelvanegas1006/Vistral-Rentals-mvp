/**
 * Role-based permission helpers.
 * Roles: "admin" (standard), "developer" (admin + dev cards visibility).
 */

const PRIVILEGED_ROLES = ["admin", "developer"];

function hasPrivilegedRole(role: string | null): boolean {
  return role !== null && PRIVILEGED_ROLES.includes(role);
}

export function canViewProperty(role: string | null): boolean {
  return hasPrivilegedRole(role);
}

export function canEditProperty(role: string | null): boolean {
  return hasPrivilegedRole(role);
}

export function canDeleteProperty(role: string | null): boolean {
  return hasPrivilegedRole(role);
}

export function canManageUsers(role: string | null): boolean {
  return hasPrivilegedRole(role);
}

export function canViewAllProperties(role: string | null): boolean {
  return hasPrivilegedRole(role);
}

export function isAdmin(role: string | null): boolean {
  return hasPrivilegedRole(role);
}

export function isDeveloper(role: string | null): boolean {
  return role === "developer";
}

export function canViewDevCards(role: string | null): boolean {
  return role === "developer";
}
