# Configuración de Drag & Drop para Leads Kanban

## Instalación de dependencias

Ejecuta el siguiente comando para instalar las librerías necesarias para drag & drop:

```bash
cd "/Users/manuelgomezvega/Desktop/Vistral-Rentals/Rentals Vistral"
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Si tienes problemas de permisos, intenta con:

```bash
sudo npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Funcionalidad implementada

### ✅ Características

1. **Drag & Drop entre columnas**: Puedes arrastrar leads de una fase a otra
2. **Reordenamiento dentro de columnas**: Puedes reordenar leads dentro de la misma columna
3. **Actualización automática en Supabase**: Cuando mueves un lead, se actualiza automáticamente en la base de datos
4. **Feedback visual**: 
   - La tarjeta se vuelve semi-transparente mientras se arrastra
   - Se muestra un overlay con la tarjeta mientras se arrastra
   - Notificaciones toast cuando se completa el movimiento
5. **Reset de días en fase**: Al mover un lead a otra fase, los días en fase se resetean a 0

### 🎯 Cómo usar

1. **Arrastrar entre columnas**: 
   - Haz clic y mantén presionado sobre una tarjeta de lead
   - Arrástrala a otra columna (fase)
   - Suelta para moverla

2. **Reordenar dentro de una columna**:
   - Arrastra una tarjeta sobre otra en la misma columna
   - Suelta para reordenar

3. **Click para ver detalles**:
   - Si haces un clic rápido (sin arrastrar), se abre la página de detalle del lead

### ⚙️ Configuración técnica

- **Activación del drag**: Requiere 8px de movimiento antes de activar (evita conflictos con clicks)
- **Sensores**: Soporta mouse/touch y teclado
- **Colisiones**: Usa `closestCenter` para detectar sobre qué columna se suelta
- **Actualización optimista**: Actualiza la UI inmediatamente, luego sincroniza con Supabase

### 🔧 Archivos modificados

- `src/components/rentals/rentals-leads-kanban-board.tsx` - Componente principal con drag & drop
- `src/components/rentals/rentals-lead-card.tsx` - Ajustes menores para compatibilidad
- `package.json` - Dependencias añadidas

### 📝 Notas

- Si la actualización en Supabase falla, se revierte el cambio en la UI
- Los leads se ordenan automáticamente por días en fase (menos días primero)
- El drag & drop funciona tanto con datos de Supabase como con datos mock
