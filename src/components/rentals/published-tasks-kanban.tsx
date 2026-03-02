"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  called?: "Si" | "No";
  discarded?: "Si" | "No";
  scheduledDate?: string;
  visitDate?: string;
  qualified?: "Si" | "No";
}

interface PublishedTasksKanbanProps {
  unguidedLeads: Lead[];
  scheduledLeads: Lead[];
  visitedLeads: Lead[];
  discardedLeads: Lead[];
  onUnguidedLeadsChange: (leads: Lead[]) => void;
  onScheduledLeadsChange: (leads: Lead[]) => void;
  onVisitedLeadsChange: (leads: Lead[]) => void;
  onDiscardedLeadsChange: (leads: Lead[]) => void;
  onAddLead: (list: "unguided" | "scheduled" | "visited" | "discarded") => void;
}

// Componente de tarjeta ordenable
function SortableLeadCard({
  lead,
  onClick,
}: {
  lead: Lead;
  onClick: () => void;
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

  // Convertir Lead a formato de RentalsLeadCard
  const leadCardData = {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email || "",
    interestedProperty: undefined,
    zone: undefined,
    currentPhase: "",
    daysInPhase: 0,
    isHighlighted: false,
    needsUpdate: false,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <div className="bg-card border-2 border-border rounded-lg p-4 shadow-sm hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.6)] transition-all duration-200">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">{lead.name}</h4>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </p>
            </div>
          </div>
          {lead.email && (
            <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de columna droppable
function DroppableColumn({
  columnId,
  title,
  leads,
  onAddLead,
  children,
}: {
  columnId: string;
  title: string;
  leads: Lead[];
  onAddLead: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full min-w-[260px] md:min-w-[280px] w-[260px] md:w-[280px] flex-shrink-0",
        isOver && "bg-accent/50"
      )}
    >
      {/* Header */}
      <div className="mb-3 md:mb-4">
        <div className="flex items-center justify-between">
          <h3 className={cn(
            "font-semibold text-foreground",
            columnId === "visited" ? "text-sm md:text-base" : "text-base md:text-lg"
          )}>
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5">
              {leads.length}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={onAddLead}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Contenedor de leads con scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {children}
      </div>
    </div>
  );
}

export function PublishedTasksKanban({
  unguidedLeads,
  scheduledLeads,
  visitedLeads,
  discardedLeads,
  onUnguidedLeadsChange,
  onScheduledLeadsChange,
  onVisitedLeadsChange,
  onDiscardedLeadsChange,
  onAddLead,
}: PublishedTasksKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mapeo de columnas
  const columns = [
    { id: "unguided", title: "Interesados sin gestionar", leads: unguidedLeads, onChange: onUnguidedLeadsChange },
    { id: "scheduled", title: "Interesados Agendados", leads: scheduledLeads, onChange: onScheduledLeadsChange },
    { id: "visited", title: "Visita Hecha / Pend. Doc.", leads: visitedLeads, onChange: onVisitedLeadsChange },
    { id: "discarded", title: "Descartados", leads: discardedLeads, onChange: onDiscardedLeadsChange },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Encontrar la columna origen y destino
    let sourceColumn = columns.find((col) => col.leads.some((l) => l.id === activeId));
    let targetColumn = columns.find((col) => col.id === overId || col.leads.some((l) => l.id === overId));

    // Si el destino es una columna (no un lead), usar esa columna
    if (columns.find((col) => col.id === overId)) {
      targetColumn = columns.find((col) => col.id === overId);
    } else {
      // Si el destino es un lead, encontrar su columna
      targetColumn = columns.find((col) => col.leads.some((l) => l.id === overId));
    }

    if (!sourceColumn || !targetColumn) return;

    const sourceIndex = sourceColumn.leads.findIndex((l) => l.id === activeId);
    const lead = sourceColumn.leads[sourceIndex];

    if (sourceColumn.id === targetColumn.id) {
      // Reordenar dentro de la misma columna
      const newLeads = arrayMove(sourceColumn.leads, sourceIndex, sourceColumn.leads.findIndex((l) => l.id === overId) || 0);
      sourceColumn.onChange(newLeads);
    } else {
      // Mover entre columnas
      const newSourceLeads = sourceColumn.leads.filter((l) => l.id !== activeId);
      const newTargetLeads = [...targetColumn.leads, lead];
      
      sourceColumn.onChange(newSourceLeads);
      targetColumn.onChange(newTargetLeads);
    }
  };

  // Obtener el lead activo para el overlay
  const activeLead = activeId
    ? columns
        .flatMap((col) => col.leads)
        .find((lead) => lead.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 h-full min-w-max overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent -ml-1 pl-1">
        {columns.map((column) => (
          <SortableContext
            key={column.id}
            id={column.id}
            items={column.leads.map((lead) => lead.id)}
            strategy={verticalListSortingStrategy}
          >
            <DroppableColumn
              columnId={column.id}
              title={column.title}
              leads={column.leads}
              onAddLead={() => onAddLead(column.id as "unguided" | "scheduled" | "visited" | "discarded")}
            >
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
                    onClick={() => {
                      // TODO: Navegar a detalle del lead si es necesario
                    }}
                  />
                ))
              )}
            </DroppableColumn>
          </SortableContext>
        ))}
      </div>

      {/* Overlay para mostrar la tarjeta mientras se arrastra */}
      <DragOverlay>
        {activeLead ? (
          <div className="opacity-90 rotate-2 bg-card border-2 border-border rounded-lg p-4 shadow-lg w-[280px]">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">{activeLead.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {activeLead.phone}
                  </p>
                </div>
              </div>
              {activeLead.email && (
                <p className="text-xs text-muted-foreground truncate">{activeLead.email}</p>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
