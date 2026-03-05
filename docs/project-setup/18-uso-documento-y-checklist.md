# 18. Uso del documento y checklist

## Cómo usar este documento

1. **Para humanos:** Este documento (y los de esta carpeta) son la referencia para el equipo.
2. **Para Cursor:** Las reglas modulares en `.cursor/rules/*.mdc` son leídas automáticamente según los glob patterns.
3. **Nuevo proyecto:** Al iniciar un proyecto nuevo, referenciar esta documentación y las reglas en `.cursor/rules/`.
4. **Actualizar reglas:** Modificar archivos `.mdc` individuales según necesidad; actualizar versión y `lastUpdated` en frontmatter.

---

## Checklist rápido para nuevo proyecto

- [ ] Next.js 16 + TypeScript + App Router
- [ ] Estructura `app/`, `components/`, `lib/`, `hooks/`, `supabase/`
- [ ] `lib/config/environment.ts` y `lib/utils.ts` (cn, isDemoMode si aplica)
- [ ] Supabase: `lib/supabase/client.ts`, `server.ts`, `types.ts`
- [ ] Auth: SupabaseAuthProvider + AppAuthProvider + permissions
- [ ] Design system: prophero.css + globals.css + BREAKPOINTS/SPACING en constants
- [ ] UI: componentes con CVA + cn; Form con react-hook-form + Zod
- [ ] tsconfig paths `@/*`, next.config con alias e images
- [ ] `.env.local.example` y `.gitignore` actualizados (sin service role key)
- [ ] `.cursorignore` creado con exclusiones de seguridad
- [ ] Reglas modulares en `.cursor/rules/*.mdc` configuradas
- [ ] Repo conectado a Vercel; env configurados por entorno (service role solo en Vercel)

---

## Versión

**Versión:** 1.0  
**Última actualización:** 2026-02-02  
**Propietario:** Vistral Lab
