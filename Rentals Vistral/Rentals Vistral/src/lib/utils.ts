import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera iniciales desde un nombre completo
 * Ejemplos:
 * - "Juan Pérez" -> "JP"
 * - "María García López" -> "MG"
 * - "John" -> "JO"
 */
export function generateInitials(name: string | null | undefined): string | undefined {
  if (!name || typeof name !== "string") return undefined;
  
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  
  const words = trimmed.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) return undefined;
  
  // Si solo hay una palabra, tomar las primeras 2 letras (o 1 si es muy corta)
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  // Si hay múltiples palabras, tomar la primera letra de las primeras 2 palabras
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Detecta si la app está en modo demo (sin credenciales Supabase válidas).
 * Usar para mostrar datos mock o deshabilitar llamadas reales.
 */
export function isDemoMode(): boolean {
  if (typeof window !== "undefined") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return !url || !anonKey || url === "your_supabase_project_url" || anonKey === "your_supabase_anon_key";
  }
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
