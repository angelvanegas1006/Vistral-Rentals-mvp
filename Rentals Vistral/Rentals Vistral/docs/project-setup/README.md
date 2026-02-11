# Project Setup - Vistral Lab

Documentación del **Cursor Project SetUp** y bases del proyecto. Cada sección principal tiene su propio documento en esta carpeta.

## Índice de documentos

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Objetivo y sistema de reglas modulares](./01-objetivo-y-reglas-modulares.md) | Objetivo del documento, reglas en `.cursor/rules/` |
| 02 | [Stack y dependencias base](./02-stack-y-dependencias.md) | Next.js, TypeScript, React, Supabase, Tailwind, etc. |
| 03 | [Estructura de carpetas](./03-estructura-carpetas.md) | app/, components/, lib/, hooks/, supabase/ |
| 04 | [Design system](./04-design-system.md) | Prophero, tokens, Tailwind, grid responsivo |
| 05 | [Patrones de componentes (UI)](./05-patrones-componentes-ui.md) | cn(), CVA, forwardRef, Radix, Form |
| 06 | [Supabase](./06-supabase.md) | Clientes, tipos, migraciones, env, demo mode |
| 07 | [Autenticación y permisos](./07-autenticacion-permisos.md) | Capas auth, roles, permisos, providers |
| 08 | [Formularios y validación](./08-formularios-validacion.md) | react-hook-form, Zod, Form components |
| 09 | [Hooks y datos](./09-hooks-y-datos.md) | Patrón de datos, hooks por recurso, servicios |
| 10 | [API Routes](./10-api-routes.md) | Estructura, seguridad, respuestas |
| 11 | [Configuración de proyecto](./11-configuracion-proyecto.md) | TypeScript, Next.js, env, scripts |
| 12 | [Vercel y Git](./12-vercel-y-git.md) | Deploy, ramas, .gitignore, migraciones |
| 13 | [Cursor Configuration](./13-cursor-configuration.md) | Models, mode, context, workflow, security |
| 14 | [Seguridad](./14-seguridad.md) | Reglas críticas de credenciales y service role |
| 15 | [Zonas protegidas](./15-zonas-protegidas.md) | Archivos que no modificar sin solicitud explícita |
| 16 | [Workflow de planificación](./16-workflow-planificacion.md) | Antes y después de codificar |
| 17 | [Límites de dominio](./17-limites-dominio.md) | supply, admin, reno, aislamiento |
| 18 | [Uso del documento y checklist](./18-uso-documento-y-checklist.md) | Cómo usar, checklist nuevo proyecto, versión |

## Configuración requerida: `.cursorignore`

Crea un archivo **`.cursorignore`** en la raíz del proyecto (junto a `package.json`) con este contenido, para no indexar secretos ni carpetas pesadas:

```
# Dependencies
node_modules/
.next/
dist/
build/

# Environment & Secrets
.env*
**/*.pem
**/*.key
**/credentials*
**/*secret*
**/*password*

# Logs & Temp
*.log
*.tmp
.cache/
.temp/

# Supabase temp
node_modules/supabase/.temp/

# Large assets (opcional)
public/assets/large/
```

## Documento maestro

Para humanos: la referencia completa es el **Cursor Project SetUp** (origen de estos documentos).  
Para Cursor: las reglas activas están en `.cursor/rules/*.mdc`.

**Versión:** 1.0  
**Última actualización:** 2026-02-11  
**Propietario:** Vistral Lab
