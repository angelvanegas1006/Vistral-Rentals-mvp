"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RentalsLeadCard } from "./rentals-lead-card";
import { RentalsHomeLoader } from "./rentals-home-loader";
import { useLeads } from "@/hooks/use-leads";
import { mapLeadFromSupabase } from "@/lib/supabase/mappers";
import { useUpdateLead } from "@/hooks/use-update-lead";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

interface Lead {
  id: string;
  leadsUniqueId?: string;
  name: string;
  phone: string;
  email?: string;
  interestedProperty?: {
    id: string;
    address: string;
    city?: string;
  };
  zone?: string;
  currentPhase: string;
  daysInPhase?: number;
  isHighlighted?: boolean;
  needsUpdate?: boolean;
}

interface LeadsKanbanColumn {
  id: string;
  title: string;
  leads: Lead[];
}

interface RentalsLeadsKanbanBoardProps {
  columns?: LeadsKanbanColumn[];
  searchQuery?: string;
  filters?: Record<string, any>;
  loading?: boolean;
}

// Fases del Kanban de Interesados (orden fijo) - exportadas para uso en detalle del lead
export const LEAD_PHASE_IDS = [
  "perfil-cualificado",
  "visita-agendada",
  "recogiendo-informacion",
  "calificacion-en-curso",
  "calificacion-aprobada",
  "inquilino-aceptado",
] as const;

export const LEAD_PHASE_TITLES: Record<(typeof LEAD_PHASE_IDS)[number], string> = {
  "perfil-cualificado": "Perfil cualificado",
  "visita-agendada": "Visita agendada",
  "recogiendo-informacion": "Recogiendo Información",
  "calificacion-en-curso": "Calificación en curso",
  "calificacion-aprobada": "Inquilino presentado",
  "inquilino-aceptado": "Inquilino aceptado",
};

// Mapeo de phaseId a nombre de fase
const phaseIdToPhaseName: Record<string, string> = { ...LEAD_PHASE_TITLES };

// Datos mock para el Kanban de Interesados (tarjetas repartidas en las 7 fases)
const MOCK_LEADS_BY_PHASE: Record<string, Lead[]> = {
  "perfil-cualificado": [
    { id: "LEAD-001", name: "Juan Pérez", phone: "+34 600 123 456", email: "juan.perez@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Perfil cualificado", daysInPhase: 1 },
    { id: "LEAD-002", name: "María García", phone: "+34 611 234 567", email: "maria.garcia@email.com", zone: "Chamberí", currentPhase: "Perfil cualificado", daysInPhase: 3 },
  ],
  "visita-agendada": [
    { id: "LEAD-003", name: "Carlos López", phone: "+34 622 345 678", email: "carlos.lopez@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Visita agendada", daysInPhase: 2 },
  ],
  "recogiendo-informacion": [
    { id: "LEAD-004", name: "Ana Martínez", phone: "+34 633 456 789", email: "ana.martinez@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Recogiendo Información", daysInPhase: 5 },
    { id: "LEAD-008", name: "Sofía Martín", phone: "+34 677 890 123", email: "sofia.martin@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Recogiendo Información", daysInPhase: 1 },
    { id: "LEAD-009", name: "Pablo Ruiz", phone: "+34 688 901 234", email: "pablo.ruiz@email.com", zone: "Retiro", currentPhase: "Recogiendo Información", daysInPhase: 2 },
  ],
  "calificacion-en-curso": [
    { id: "LEAD-010", name: "Elena Torres", phone: "+34 699 012 345", email: "elena.torres@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Calificación en curso", daysInPhase: 4 },
  ],
  "calificacion-aprobada": [
    { id: "LEAD-005", name: "Pedro Sánchez", phone: "+34 644 567 890", email: "pedro.sanchez@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Inquilino presentado", daysInPhase: 7 },
  ],
  "inquilino-aceptado": [
    { id: "LEAD-006", name: "Laura Fernández", phone: "+34 655 678 901", email: "laura.fernandez@email.com", zone: "Salamanca", currentPhase: "Inquilino aceptado", daysInPhase: 10 },
    { id: "LEAD-007", name: "Roberto Silva", phone: "+34 666 789 012", email: "roberto.silva@email.com", zone: "Retiro", currentPhase: "Inquilino aceptado", daysInPhase: 0 },
  ],
};

export const mockLeadsColumns: LeadsKanbanColumn[] = LEAD_PHASE_IDS.map((id) => ({
  id,
  title: LEAD_PHASE_TITLES[id],
  leads: MOCK_LEADS_BY_PHASE[id] || [],
}));

// Componente de tarjeta ordenable
function SortableLeadCard({
  lead,
  onClick,
  searchQuery,
}: {
  lead: Lead;
  onClick: () => void;
  searchQuery: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <RentalsLeadCard
        lead={lead}
        onClick={onClick}
        searchQuery={searchQuery}
        disabled={isDragging}
      />
    </div>
  );
}

// Componente de columna droppable
function DroppableColumn({
  column,
  children,
}: {
  column: LeadsKanbanColumn;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      data-column-id={column.id}
      className={cn(
        "flex flex-col flex-shrink-0 min-w-[320px] md:min-w-[320px] w-full md:w-[320px] pt-[7px] pb-[7px]",
        isOver && "ring-2 ring-[var(--vistral-blue-500)] ring-offset-2 rounded-lg"
      )}
    >
      {children}
    </div>
  );
}

export function RentalsLeadsKanbanBoard({
  columns: providedColumns,
  searchQuery = "",
  filters = {},
  loading = false,
}: RentalsLeadsKanbanBoardProps) {
  const router = useRouter();
  const { updateLead } = useUpdateLead();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState<LeadsKanbanColumn[]>([]);
  const [originalColumns, setOriginalColumns] = useState<LeadsKanbanColumn[]>([]);

  // Fases del Kanban de Interesados (mismo orden que LEAD_PHASE_IDS / LEAD_PHASE_TITLES)
  const leadPhases = LEAD_PHASE_IDS.map((id) => LEAD_PHASE_TITLES[id]);

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere mover al menos 8px antes de activar el drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cargar todos los leads desde Supabase (sin filtrar por fase)
  const { leads: allSupabaseLeads, loading: allLeadsLoading } = useLeads({
    searchQuery,
    filters,
  });

  // Convertir leads de Supabase a columnas del Kanban
  const supabaseColumns = useMemo(() => {
    if (!allSupabaseLeads || allSupabaseLeads.length === 0) {
      return null;
    }

    const columnsMap: Record<string, Lead[]> = {};

    // Agrupar leads por fase (por nombre de fase; si no coincide, a la primera)
    // Compatibilidad: en BD puede seguir "Calificación aprobada" → se asigna a la columna "Inquilino presentado"
    allSupabaseLeads.forEach((leadRow) => {
      const mappedLead = mapLeadFromSupabase(leadRow);
      const phaseNameForIndex =
        mappedLead.currentPhase === "Calificación aprobada"
          ? "Inquilino presentado"
          : mappedLead.currentPhase;
      const phaseIndex = leadPhases.indexOf(phaseNameForIndex);
      const phaseId = phaseIndex >= 0 ? LEAD_PHASE_IDS[phaseIndex] : LEAD_PHASE_IDS[0];

      if (!columnsMap[phaseId]) {
        columnsMap[phaseId] = [];
      }
      columnsMap[phaseId].push(mappedLead);
    });

    // Convertir a formato de columnas (todas las fases en orden)
    return LEAD_PHASE_IDS.map((phaseId) => ({
      id: phaseId,
      title: LEAD_PHASE_TITLES[phaseId],
      leads: columnsMap[phaseId] || [],
    }));
  }, [allSupabaseLeads]);

  // Seleccionar columnas: Supabase primero, luego mock como fallback
  const columns = useMemo(() => {
    if (providedColumns) return providedColumns;
    if (supabaseColumns && supabaseColumns.length > 0) {
      return supabaseColumns;
    }
    // Fallback a datos mock
    return mockLeadsColumns;
  }, [providedColumns, supabaseColumns]);

  // Sincronizar columnas con estado local cuando cambian desde Supabase
  // Usar useRef para evitar loops infinitos
  const prevColumnsRef = useRef<string>("");
  
  useEffect(() => {
    // Crear una firma única de las columnas basada en IDs de leads
    const columnsSignature = JSON.stringify(
      columns.map(c => ({ 
        id: c.id, 
        leadIds: c.leads.map(l => l.id).sort() 
      }))
    );
    
    // Solo actualizar si realmente cambiaron los datos desde Supabase
    if (columnsSignature !== prevColumnsRef.current) {
      console.log("Columnas cambiaron desde Supabase, sincronizando...");
      prevColumnsRef.current = columnsSignature;
      setLocalColumns(columns);
      setOriginalColumns(columns);
    }
  }, [columns]);

  // Filtrar y ordenar leads según searchQuery y días en fase
  const filteredColumns = useMemo(() => {
    const processLeads = (leads: Lead[], highlight: boolean) => {
      // Ordenar por días en fase (ascendente: menos días primero)
      return [...leads]
        .sort((a, b) => {
          const daysA = a.daysInPhase ?? Infinity;
          const daysB = b.daysInPhase ?? Infinity;
          return daysA - daysB;
        })
        .map((lead) => ({
          ...lead,
          isHighlighted: highlight,
        }));
    };

    const cols = searchQuery.trim()
      ? localColumns.map((col) => {
          const query = searchQuery.toLowerCase();
          return {
            ...col,
            leads: processLeads(
              col.leads.filter((lead) => {
                const matchesName = lead.name.toLowerCase().includes(query);
                const matchesPhone = lead.phone.toLowerCase().includes(query);
                const matchesProperty =
                  lead.interestedProperty?.address.toLowerCase().includes(query) ||
                  lead.interestedProperty?.city?.toLowerCase().includes(query);
                const matchesZone = lead.zone?.toLowerCase().includes(query);
                return matchesName || matchesPhone || matchesProperty || matchesZone;
              }),
              true
            ),
          };
        })
      : localColumns.map((col) => ({
          ...col,
          leads: processLeads(col.leads, false),
        }));

    return cols;
  }, [localColumns, searchQuery]);

  // Handler para cuando empieza el drag
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Guardar el estado original al inicio del drag
    setOriginalColumns(localColumns);
  };

  // Handler para cuando se arrastra sobre otra columna (solo para feedback visual)
  const handleDragOver = (event: DragOverEvent) => {
    // No hacemos cambios aquí, solo dejamos que el droppable muestre el feedback visual
    // El movimiento real se hace en handleDragEnd
  };

  // Handler para cuando termina el drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    setActiveId(null);

    if (!over) {
      // Si se suelta fuera, no hacer nada (mantener estado actual)
      console.log("Drag cancelado: se soltó fuera");
      return;
    }

    const overId = over.id as string;
    console.log("Drag end:", { activeId, overId });

    // Buscar el lead en el estado actual (localColumns)
    const sourceColumn = localColumns.find((col) =>
      col.leads.some((lead) => lead.id === activeId)
    );

    if (!sourceColumn) {
      console.warn("No se encontró la columna origen para el lead:", activeId);
      console.log("Columnas disponibles:", localColumns.map(c => ({ id: c.id, leads: c.leads.map(l => l.id) })));
      return;
    }

    const sourceIndex = sourceColumn.leads.findIndex((lead) => lead.id === activeId);
    if (sourceIndex === -1) {
      console.warn("No se encontró el lead en la columna origen:", activeId);
      return;
    }

    const lead = sourceColumn.leads[sourceIndex];
    console.log("Lead encontrado:", { leadId: lead.id, sourceColumn: sourceColumn.id, sourceIndex });

    // Buscar columna destino
    // El overId puede ser:
    // 1. El id de la columna droppable (cuando se suelta sobre el área de la columna)
    // 2. El id de otro lead (cuando se suelta sobre otra tarjeta)
    const targetColumn = localColumns.find((col) => {
      // Si el overId es el id de la columna directamente
      if (col.id === overId) {
        console.log("Columna destino encontrada por id directo:", col.id);
        return true;
      }
      // Si el overId es un lead, buscar en qué columna está
      const found = col.leads.some((l) => l.id === overId);
      if (found) {
        console.log("Columna destino encontrada por lead:", col.id);
      }
      return found;
    });

    if (!targetColumn) {
      console.warn("No se encontró la columna destino:", overId);
      console.log("Columnas disponibles:", localColumns.map(c => ({ id: c.id, leads: c.leads.map(l => l.id) })));
      return;
    }

    console.log("Columna destino:", { id: targetColumn.id, title: targetColumn.title });

    // Si es la misma columna, solo reordenar
    if (sourceColumn.id === targetColumn.id) {
      console.log("Misma columna, solo reordenar");
      const targetIndex = targetColumn.leads.findIndex((l) => l.id === overId);
      if (targetIndex === -1 || targetIndex === sourceIndex) {
        // No hay cambio de posición
        return;
      }

      setLocalColumns((prev) => {
        const newColumns = [...prev];
        const colIndex = newColumns.findIndex((col) => col.id === sourceColumn.id);
        if (colIndex === -1) return prev;

        const newLeads = arrayMove(
          newColumns[colIndex].leads,
          sourceIndex,
          targetIndex
        );
        newColumns[colIndex] = {
          ...newColumns[colIndex],
          leads: newLeads,
        };

        return newColumns;
      });
    } else {
      // Si es diferente columna, mover y actualizar fase
      console.log("Diferente columna, mover lead");
      const targetIndex = targetColumn.leads.findIndex((l) => l.id === overId);
      const newPhase = phaseIdToPhaseName[targetColumn.id];
      
      if (!newPhase) {
        console.warn("No se encontró el nombre de fase para:", targetColumn.id);
        console.log("Fases disponibles:", Object.keys(phaseIdToPhaseName));
        return;
      }

      console.log("Nueva fase:", newPhase);

      const newLead = {
        ...lead,
        currentPhase: newPhase,
        daysInPhase: 0,
      };

      // Actualizar el estado local primero (optimistic update)
      setLocalColumns((prev) => {
        const newColumns = [...prev];
        const sourceColIndex = newColumns.findIndex((col) => col.id === sourceColumn.id);
        const targetColIndex = newColumns.findIndex((col) => col.id === targetColumn.id);

        if (sourceColIndex === -1 || targetColIndex === -1) return prev;

        // Remover de origen
        const sourceCol = newColumns[sourceColIndex];
        const newSourceLeads = [...sourceCol.leads];
        newSourceLeads.splice(sourceIndex, 1);
        newColumns[sourceColIndex] = {
          ...sourceCol,
          leads: newSourceLeads,
        };

        // Añadir a destino
        const targetCol = newColumns[targetColIndex];
        const newTargetLeads = [...targetCol.leads];
        // Si se suelta sobre otra tarjeta, insertar en esa posición, si no, al final
        const insertIndex = targetIndex >= 0 ? targetIndex : newTargetLeads.length;
        newTargetLeads.splice(insertIndex, 0, newLead);
        newColumns[targetColIndex] = {
          ...targetCol,
          leads: newTargetLeads,
        };

        return newColumns;
      });

      // Actualizar en Supabase solo si el lead viene de Supabase (tiene UUID)
      // Los datos mock tienen IDs como "LEAD-001" que no son UUIDs válidos
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lead.id);
      
      if (isUUID) {
        // Actualizar en Supabase
        const success = await updateLead(lead.id, {
          current_phase: newPhase,
          days_in_phase: 0,
        });

        if (success) {
          toast.success(`Lead movido a "${newPhase}"`);
          // Actualizar el estado original para futuros drags
          setOriginalColumns((prev) => {
            const newColumns = [...prev];
            const sourceColIndex = newColumns.findIndex((col) => col.id === sourceColumn.id);
            const targetColIndex = newColumns.findIndex((col) => col.id === targetColumn.id);

            if (sourceColIndex === -1 || targetColIndex === -1) return prev;

            const originalSourceCol = newColumns[sourceColIndex];
            const originalSourceIndex = originalSourceCol.leads.findIndex((l) => l.id === activeId);
            if (originalSourceIndex === -1) return prev;

            const newSourceLeads = [...originalSourceCol.leads];
            newSourceLeads.splice(originalSourceIndex, 1);
            newColumns[sourceColIndex] = {
              ...originalSourceCol,
              leads: newSourceLeads,
            };

            const targetCol = newColumns[targetColIndex];
            const newTargetLeads = [...targetCol.leads];
            const originalTargetIndex = targetCol.leads.findIndex((l) => l.id === overId);
            const insertIndex = originalTargetIndex >= 0 ? originalTargetIndex : newTargetLeads.length;
            newTargetLeads.splice(insertIndex, 0, newLead);
            newColumns[targetColIndex] = {
              ...targetCol,
              leads: newTargetLeads,
            };

            return newColumns;
          });
        } else {
          toast.error("Error al actualizar el lead");
          // Revertir al estado original si falla
          setLocalColumns(originalColumns);
          return;
        }
      } else {
        // Si es un dato mock, solo mostrar mensaje (no actualizar en Supabase)
        console.log("Lead mock movido (no se actualiza en Supabase):", lead.id);
        toast.success(`Lead movido a "${newPhase}" (modo mock)`);
        // Actualizar el estado original para futuros drags (modo mock)
        setOriginalColumns((prev) => {
          const newColumns = [...prev];
          const sourceColIndex = newColumns.findIndex((col) => col.id === sourceColumn.id);
          const targetColIndex = newColumns.findIndex((col) => col.id === targetColumn.id);

          if (sourceColIndex === -1 || targetColIndex === -1) return prev;

          const originalSourceCol = newColumns[sourceColIndex];
          const originalSourceIndex = originalSourceCol.leads.findIndex((l) => l.id === activeId);
          if (originalSourceIndex === -1) return prev;

          const newSourceLeads = [...originalSourceCol.leads];
          newSourceLeads.splice(originalSourceIndex, 1);
          newColumns[sourceColIndex] = {
            ...originalSourceCol,
            leads: newSourceLeads,
          };

          const targetCol = newColumns[targetColIndex];
          const newTargetLeads = [...targetCol.leads];
          const originalTargetIndex = targetCol.leads.findIndex((l) => l.id === overId);
          const insertIndex = originalTargetIndex >= 0 ? originalTargetIndex : newTargetLeads.length;
          newTargetLeads.splice(insertIndex, 0, newLead);
          newColumns[targetColIndex] = {
            ...targetCol,
            leads: newTargetLeads,
          };

          return newColumns;
        });
      }
    }
  };

  const handleCardClick = (leadId: string) => {
    router.push(`/rentals/leads/${leadId}`);
  };

  // Obtener el lead activo para el overlay
  const activeLead = activeId
    ? filteredColumns
        .flatMap((col) => col.leads)
        .find((lead) => lead.id === activeId)
    : null;

  if (loading || allLeadsLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <RentalsHomeLoader />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-gutter-md lg:gap-gutter-lg xl:gap-gutter-xl h-full min-w-max overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {filteredColumns.map((column) => (
          <SortableContext
            key={column.id}
            id={column.id}
            items={column.leads.map((lead) => lead.id)}
            strategy={verticalListSortingStrategy}
          >
            <DroppableColumn column={column}>
              {/* Header de la columna - mismo estilo que Captación/Cierre */}
              <div className="mb-[7px] flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    {column.title}
                  </h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {column.leads.length}
                  </span>
                </div>
              </div>

              {/* Contenedor de leads con scroll */}
              <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                {column.leads.length === 0 ? (
                  <div className="bg-card dark:bg-[#000000] border border-border rounded-lg p-6 md:border-0 md:bg-transparent text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      No hay interesados
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Los interesados aparecerán aquí
                    </p>
                  </div>
                ) : (
                  column.leads.map((lead) => (
                    <SortableLeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => handleCardClick(lead.id)}
                      searchQuery={searchQuery}
                    />
                  ))
                )}
              </div>
            </DroppableColumn>
          </SortableContext>
        ))}
      </div>

      {/* Overlay para mostrar la tarjeta mientras se arrastra - mismo ancho que columna */}
      <DragOverlay>
        {activeLead ? (
          <div className="opacity-90 rotate-2 w-[320px]">
            <RentalsLeadCard
              lead={activeLead}
              onClick={() => {}}
              searchQuery={searchQuery}
              disabled
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
