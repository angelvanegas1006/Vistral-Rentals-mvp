# Cursor Rules - Vistral Lab

Este directorio contiene las reglas modulares de Cursor para el proyecto Rentals Vistral.

## Estructura

Las reglas están organizadas por número y tema:

- `00-core.mdc` - Reglas base (stack, estructura, seguridad básica, workflow)
- `01-security.mdc` - Guardrails de seguridad y protección de credenciales
- `02-design-system.mdc` - Design system (Prophero, tokens, componentes)
- `03-supabase.mdc` - Clientes Supabase, tipos, migraciones
- `04-auth-permissions.mdc` - Autenticación, roles, permisos
- `05-forms-ui.mdc` - Formularios (react-hook-form + Zod) y patrones UI
- `06-api-routes.mdc` - Rutas API, seguridad, respuestas
- `07-domain-boundaries.mdc` - Límites de dominio y aislamiento

## Formato de Archivos

Cada archivo `.mdc` incluye YAML frontmatter (version, owner, lastUpdated, glob, alwaysApply, description) y contenido en markdown.

## Documento maestro

Para documentación completa para humanos, ver:
- `docs/project-setup/` en este proyecto

Este README es solo para las reglas modulares de Cursor.
