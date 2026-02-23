# Máquina de Estados: Mini-tarjetas de Propiedades

> Representa la relación entre un **Lead** (Interesado) y una **Propiedad** específica.

## Diagrama de Estados

```mermaid
stateDiagram-v2
    %% 1. Origen de la Mini-Tarjeta
    [*] --> INTERESADO : Entrada por Idealista / PM añade desde Buscador

    %% 2. El flujo hacia la visita
    INTERESADO --> VISITA_AGENDADA : PM asigna fecha de visita

    %% 3. Descartes tempranos (Válvulas de escape)
    INTERESADO --> DESCARTADA : PM pulsa "Descartar"
    VISITA_AGENDADA --> DESCARTADA : PM pulsa "Descartar" (Cancela)
```

## Estados definidos

| Estado | Descripción |
|--------|-------------|
| **INTERESADO** | Estado inicial. El lead muestra interés en la propiedad (vía Idealista o añadido manualmente por el PM). |
| **VISITA_AGENDADA** | El PM ha asignado una fecha de visita para esa propiedad. |
| **DESCARTADA** | Válvula de escape. El PM descarta la propiedad para ese lead (antes o después de agendar visita). |

## Transiciones

| Desde | Hacia | Acción |
|-------|-------|--------|
| `[*]` | INTERESADO | Entrada por Idealista o PM añade desde Buscador |
| INTERESADO | VISITA_AGENDADA | PM asigna fecha de visita |
| INTERESADO | DESCARTADA | PM pulsa "Descartar" |
| VISITA_AGENDADA | DESCARTADA | PM pulsa "Descartar" (Cancela visita) |
