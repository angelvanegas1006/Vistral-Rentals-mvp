# 1. Objetivo y sistema de reglas modulares

## Objetivo

Este documento define los **patrones de diseño**, **design system**, **conexiones** (Supabase, Vercel, Git) y **configuraciones de proyecto** que debe seguir todo el equipo.

**IMPORTANTE:** Este documento es para **humanos**. Las reglas para Cursor están en `.cursor/rules/*.mdc` (ver sección "Sistema de Reglas Modulares" abajo).

---

## Sistema de reglas modulares

Las reglas de Cursor están divididas en archivos modulares en `.cursor/rules/` para mejor rendimiento y mantenibilidad:

| Archivo | Contenido |
|---------|-----------|
| **`00-core.mdc`** | Reglas base (stack, estructura, seguridad básica, workflow) |
| **`01-security.mdc`** | Guardrails de seguridad y protección de credenciales |
| **`02-design-system.mdc`** | Design system (Prophero, tokens, componentes) |
| **`03-supabase.mdc`** | Clientes Supabase, tipos, migraciones |
| **`04-auth-permissions.mdc`** | Autenticación, roles, permisos |
| **`05-forms-ui.mdc`** | Formularios (react-hook-form + Zod) y patrones UI |
| **`06-api-routes.mdc`** | Rutas API, seguridad, respuestas |
| **`07-domain-boundaries.mdc`** | Límites de dominio y aislamiento |

Ver `.cursor/rules/README.md` para más detalles sobre el sistema de reglas.
