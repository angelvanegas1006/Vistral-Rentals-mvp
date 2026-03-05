# Kanban de Interesados – Fases

Documentación de las fases del pipeline de Interesados (Kanban de leads).

## Fases (orden)

### Flujo principal

| # | Fase | ID interno | Descripción |
|---|------|------------|-------------|
| 1 | Interesado Cualificado | `interesado-cualificado` | Interesado con perfil inicial cualificado |
| 2 | Visita Agendada | `visita-agendada` | Visita a la propiedad ya agendada |
| 3 | Recogiendo Información | `recogiendo-informacion` | Recopilando datos personales, laborales y financieros |
| 4 | Calificación en Curso | `calificacion-en-curso` | En proceso de evaluación de solvencia |
| 5 | Interesado Presentado | `calificacion-aprobada` | Calificación aprobada; interesado presentado al inversor |
| 6 | Interesado Aceptado | `inquilino-aceptado` | Interesado aceptado por el inversor |

### Fases terminales

Las tarjetas en estas fases se muestran **desactivadas** (opacidad reducida, sin click) y las columnas se diferencian visualmente del flujo principal (fondo más suave, separador).

| # | Fase | ID interno | Descripción |
|---|------|------------|-------------|
| 7 | Interesado Perdido | `interesado-perdido` | Interesado perdido / sin seguimiento |
| 8 | Interesado Rechazado | `interesado-rechazado` | Interesado rechazado por el inversor |

## Campo en base de datos

Las fases se guardan en `leads.current_phase` con el nombre exacto de la columna (ej: `"Interesado Presentado"`, `"Interesado Aceptado"`, `"Interesado Perdido"`, `"Interesado Rechazado"`).

## Compatibilidad

El código mantiene compatibilidad con valores antiguos en BD:
- `"Perfil cualificado"` → se muestra como "Interesado Cualificado"
- `"Interesado cualificado"` → se muestra como "Interesado Cualificado"
- `"Calificación aprobada"` → se muestra como "Interesado Presentado"
- `"Inquilino presentado"` → se muestra como "Interesado Presentado"
- `"Inquilino aceptado"` → se muestra como "Interesado Aceptado"
- `"Interesado perdido"` → se muestra como "Interesado Perdido"
- `"Interesado rechazado"` → se muestra como "Interesado Rechazado"

## Referencias

- Componente: `src/components/rentals/rentals-leads-kanban-board.tsx`
- Constantes: `LEAD_PHASE_IDS`, `LEAD_PHASE_TITLES`, `LEAD_TERMINAL_PHASE_IDS`
- Seed: `scripts/seed-leads.ts` (no inserta leads en fases terminales)
