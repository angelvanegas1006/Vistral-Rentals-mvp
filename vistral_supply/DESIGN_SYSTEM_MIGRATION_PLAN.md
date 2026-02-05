# Plan de Migración: Vistral Design System

## Objetivo
Migrar gradualmente los componentes locales de `components/ui/` al design system `@vistral/design-system`, manteniendo compatibilidad durante la transición.

---

## Estado Actual

### Componentes Locales en `vistral_supply/components/ui/`
1. ✅ `alert-dialog.tsx` - **Disponible en DS** (Dialog)
2. ✅ `badge.tsx` - **Disponible en DS** (Badge, DotBadge, BadgeContainer)
3. ✅ `button.tsx` - **Disponible en DS** (Button)
4. ✅ `card.tsx` - **Disponible en DS** (Card)
5. ✅ `checkbox.tsx` - **Disponible en DS** (Checkbox)
6. ✅ `combobox.tsx` - **Disponible en DS** (Combobox)
7. ✅ `dialog.tsx` - **Disponible en DS** (Dialog)
8. ✅ `dropdown-menu.tsx` - **Disponible en DS** (DropdownMenu)
9. ✅ `form.tsx` - **Necesita evaluación** (react-hook-form integration)
10. ✅ `input.tsx` - **Disponible en DS** (Input, Textarea)
11. ✅ `label.tsx` - **Disponible en DS** (Label)
12. ✅ `progress.tsx` - **Disponible en DS** (ProgressBar, ProgressCircle)
13. ✅ `select.tsx` - **Disponible en DS** (Select)
14. ✅ `switch.tsx` - **Disponible en DS** (Switch)
15. ✅ `table.tsx` - **Disponible en DS** (Table)
16. ✅ `tabs.tsx` - **Disponible en DS** (Tabs, TabsList, TabsTrigger, TabsContent)
17. ✅ `textarea.tsx` - **Disponible en DS** (Textarea dentro de Input)
18. ⚠️ `sonner.tsx` - **Evaluar** (ToastProvider del DS puede reemplazar)
19. ⚠️ `collapsible.tsx` - **Evaluar** (puede estar en DS como Accordion)
20. ⚠️ `separator.tsx` - **Disponible en DS** (Divider)
21. ⚠️ `scroll-area.tsx` - **No disponible en DS** (mantener local o crear en DS)

### Componentes Adicionales en Design System (no migrados aún)
- Alert, AlertTitle, AlertDescription
- Avatar, AvatarGroup
- Autocomplete
- Banner, PromoBanner
- Breadcrumb
- Calendar
- Carousel
- Chip, ChipGroup
- ColorPicker
- ContextMenu
- DataBlock, DataBlockGrid
- DatePicker
- EmptyState
- FileUpload
- FooterActions, PageFooter
- Header (PageHeader, SectionHeader)
- Lightbox
- List, ListItem
- MediaHero
- Navbar, BottomNav
- NumberInput
- Pagination
- PhoneInput
- PinCode
- Popover
- PropertyCard, PropertyCardGrid
- Radio, RadioGroup
- Rating
- SearchInput
- SideNav
- Skeleton
- Slider, RangeSlider
- Stepper
- TagInput
- Timeline
- ToggleGroup
- Tooltip

---

## Estrategia de Migración

### Fase 1: Preparación (Completado ✅)
- [x] Instalar `@vistral/design-system`
- [x] Integrar tokens CSS en `globals.css`

### Fase 2: Migración Gradual por Prioridad

#### Prioridad Alta (Componentes más usados)
1. **Button** - Usado en múltiples lugares
2. **Input/Textarea** - Formularios críticos
3. **Select** - Formularios críticos
4. **Dialog** - Modales importantes
5. **Badge** - Indicadores visuales

#### Prioridad Media
6. **Card** - Contenedores
7. **Tabs** - Navegación por pestañas
8. **Checkbox** - Formularios
9. **Switch** - Toggles
10. **Table** - Tablas de datos

#### Prioridad Baja
11. **Progress** - Indicadores de progreso
12. **Combobox** - Búsqueda avanzada
13. **DropdownMenu** - Menús contextuales
14. **AlertDialog** - Confirmaciones
15. **Separator** → **Divider** - Separadores visuales

### Fase 3: Componentes Especiales
- **Form** (react-hook-form): Evaluar si el DS tiene integración o mantener wrapper local
- **Sonner** → **ToastProvider**: Migrar sistema de notificaciones
- **ScrollArea**: Decidir si agregar al DS o mantener local

---

## Plan de Ejecución por Componente

### Template de Migración

Para cada componente:

1. **Auditar uso actual**
   ```bash
   grep -r "from.*@/components/ui/[component]" --include="*.tsx" --include="*.ts"
   ```

2. **Comparar APIs**
   - Revisar props del componente local vs DS
   - Identificar diferencias
   - Documentar breaking changes potenciales

3. **Crear alias temporal (opcional)**
   ```typescript
   // components/ui/button.tsx (temporal)
   export { Button } from "@vistral/design-system"
   export type { ButtonProps } from "@vistral/design-system"
   ```

4. **Migrar imports gradualmente**
   - Empezar con componentes nuevos
   - Migrar componentes existentes uno por uno
   - Validar visualmente cada migración

5. **Eliminar componente local**
   - Solo después de validar que todo funciona
   - Mantener backup en git

---

## Checklist de Migración por Componente

### Button
- [ ] Auditar todos los usos de `Button`
- [ ] Comparar props: `variant`, `size`, `disabled`, etc.
- [ ] Verificar estilos visuales (puede haber diferencias)
- [ ] Migrar imports
- [ ] Validar en diferentes pantallas
- [ ] Eliminar componente local

### Input/Textarea
- [ ] Auditar todos los usos
- [ ] Comparar props: `type`, `placeholder`, `error`, etc.
- [ ] Verificar integración con react-hook-form
- [ ] Migrar imports
- [ ] Validar formularios críticos
- [ ] Eliminar componente local

### Select
- [ ] Auditar todos los usos
- [ ] Comparar API (puede ser diferente)
- [ ] Verificar integración con formularios
- [ ] Migrar imports
- [ ] Validar selects complejos
- [ ] Eliminar componente local

---

## Consideraciones Importantes

### Compatibilidad
- Mantener `prophero.css` durante la transición
- Los tokens de Vistral (`--vistral-*`) pueden coexistir con Prophero (`--prophero-*`)
- Migrar gradualmente el uso de variables CSS

### Testing
- Validar visualmente cada componente migrado
- Probar en diferentes breakpoints (responsive)
- Verificar dark mode
- Probar interacciones (hover, focus, disabled)

### Breaking Changes Potenciales
- **Estilos**: Los componentes del DS pueden tener estilos ligeramente diferentes
- **Props**: Algunos props pueden tener nombres diferentes
- **Comportamiento**: Algunos componentes pueden comportarse diferente

### Rollback Plan
- Cada componente migrado debe tener commit separado
- Mantener componentes locales en git history
- Si hay problemas, revertir commit específico

---

## Próximos Pasos

1. ✅ **Completado**: Integrar tokens CSS
2. 🔄 **En progreso**: Auditar componentes
3. ⏭️ **Siguiente**: Migrar Button (componente de prueba)
4. ⏭️ **Luego**: Continuar con Input, Select, etc.

---

## Referencias

- **Design System Storybook**: https://vistral-design-system.vercel.app/
- **Repositorio DS**: `@vistral/design-system`
- **Tokens CSS**: `@vistral/design-system/tokens.css`
- **Componentes**: `@vistral/design-system`
