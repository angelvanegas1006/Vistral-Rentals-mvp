"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionProgress } from "@/lib/supply-property-validation";
import { useI18n } from "@/lib/i18n";

interface EditSidebarProps {
  address: string | { main: string; secondary: string };
  overallProgress: number;
  sections: SectionProgress[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
  onSave: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  canSubmit: boolean;
  hasUnsavedChanges: boolean;
  showInquilino?: boolean;
  habitacionesCount?: number;
  banosCount?: number;
  checklist?: any;
}

export function EditSidebar({
  address,
  overallProgress,
  sections,
  activeSection,
  onSectionClick,
  onSave,
  onSubmit,
  onDelete,
  canSubmit,
  hasUnsavedChanges,
  showInquilino = false,
  habitacionesCount = 0,
  banosCount = 0,
  checklist,
}: EditSidebarProps) {
  const { t } = useI18n();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "datos-basicos",
    "propietario-ocupacion",
    "estado-caracteristicas",
  ]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const grupos = [
    {
      id: "datos-basicos",
      name: t.sidebar.basicData,
      sections: sections.filter((s) =>
        ["info-propiedad", "info-economica", "estado-legal", "documentacion"].includes(s.sectionId)
      ),
    },
    {
      id: "propietario-ocupacion",
      name: t.sidebar.ownerOccupation,
      sections: [
        ...(showInquilino
          ? sections.filter((s) => s.sectionId === "datos-inquilino")
          : []),
        ...sections.filter((s) => s.sectionId === "datos-vendedor"),
      ].sort((a, b) => {
        // Show inquilino first if visible, then vendedor
        if (showInquilino) {
          if (a.sectionId === "datos-inquilino") return -1;
          if (b.sectionId === "datos-inquilino") return 1;
        }
        return 0;
      }),
    },
    {
    id: "estado-caracteristicas",
      name: t.sidebar.statusCharacteristics,
      sections: [
        // Map checklist sections from prop to sidebar IDs
        {
          sectionId: "checklist-entorno-zonas-comunes",
          name: t.checklist.sections.entornoZonasComunes.title,
          progress: sections.find(s => s.sectionId === "entorno-zonas-comunes")?.progress || 0,
          requiredFieldsCount: sections.find(s => s.sectionId === "entorno-zonas-comunes")?.requiredFieldsCount || 0,
          completedRequiredFieldsCount: sections.find(s => s.sectionId === "entorno-zonas-comunes")?.completedRequiredFieldsCount || 0,
          optionalFieldsCount: sections.find(s => s.sectionId === "entorno-zonas-comunes")?.optionalFieldsCount || 0,
          completedOptionalFieldsCount: sections.find(s => s.sectionId === "entorno-zonas-comunes")?.completedOptionalFieldsCount || 0,
        },
        {
          sectionId: "checklist-estado-general",
          name: t.checklist.sections.estadoGeneral.title,
          progress: sections.find(s => s.sectionId === "estado-general")?.progress || 0,
          requiredFieldsCount: sections.find(s => s.sectionId === "estado-general")?.requiredFieldsCount || 0,
          completedRequiredFieldsCount: sections.find(s => s.sectionId === "estado-general")?.completedRequiredFieldsCount || 0,
          optionalFieldsCount: sections.find(s => s.sectionId === "estado-general")?.optionalFieldsCount || 0,
          completedOptionalFieldsCount: sections.find(s => s.sectionId === "estado-general")?.completedOptionalFieldsCount || 0,
        },
        {
          sectionId: "checklist-entrada-pasillos",
          name: t.checklist.sections.entradaPasillos.title,
          progress: sections.find(s => s.sectionId === "entrada-pasillos")?.progress || 0,
          requiredFieldsCount: sections.find(s => s.sectionId === "entrada-pasillos")?.requiredFieldsCount || 0,
          completedRequiredFieldsCount: sections.find(s => s.sectionId === "entrada-pasillos")?.completedRequiredFieldsCount || 0,
          optionalFieldsCount: sections.find(s => s.sectionId === "entrada-pasillos")?.optionalFieldsCount || 0,
          completedOptionalFieldsCount: sections.find(s => s.sectionId === "entrada-pasillos")?.completedOptionalFieldsCount || 0,
        },
        {
          sectionId: "checklist-habitaciones",
          name: t.checklist.sections.habitaciones.title,
          progress: sections.find(s => s.sectionId === "habitaciones")?.progress || 0,
          requiredFieldsCount: sections.find(s => s.sectionId === "habitaciones")?.requiredFieldsCount || 0,
          completedRequiredFieldsCount: sections.find(s => s.sectionId === "habitaciones")?.completedRequiredFieldsCount || 0,
          optionalFieldsCount: sections.find(s => s.sectionId === "habitaciones")?.optionalFieldsCount || 0,
          completedOptionalFieldsCount: sections.find(s => s.sectionId === "habitaciones")?.completedOptionalFieldsCount || 0,
        },
        {
          sectionId: "checklist-salon",
          name: t.checklist.sections.salon.title,
          progress: sections.find(s => s.sectionId === "salon")?.progress || 0,
          requiredFieldsCount: sections.find(s => s.sectionId === "salon")?.requiredFieldsCount || 0,
          completedRequiredFieldsCount: sections.find(s => s.sectionId === "salon")?.completedRequiredFieldsCount || 0,
          optionalFieldsCount: sections.find(s => s.sectionId === "salon")?.optionalFieldsCount || 0,
          completedOptionalFieldsCount: sections.find(s => s.sectionId === "salon")?.completedOptionalFieldsCount || 0,
        },
        {
          sectionId: "checklist-banos",
          name: t.checklist.sections.banos.title,
          progress: sections.find(s => s.sectionId === "banos")?.progress || 0,
          requiredFieldsCount: sections.find(s => s.sectionId === "banos")?.requiredFieldsCount || 0,
          completedRequiredFieldsCount: sections.find(s => s.sectionId === "banos")?.completedRequiredFieldsCount || 0,
          optionalFieldsCount: sections.find(s => s.sectionId === "banos")?.optionalFieldsCount || 0,
          completedOptionalFieldsCount: sections.find(s => s.sectionId === "banos")?.completedOptionalFieldsCount || 0,
        },
        {
          sectionId: "checklist-cocina",
          name: t.checklist.sections.cocina.title,
          progress: sections.find(s => s.sectionId === "cocina")?.progress || 0,
          requiredFieldsCount: sections.find(s => s.sectionId === "cocina")?.requiredFieldsCount || 0,
          completedRequiredFieldsCount: sections.find(s => s.sectionId === "cocina")?.completedRequiredFieldsCount || 0,
          optionalFieldsCount: sections.find(s => s.sectionId === "cocina")?.optionalFieldsCount || 0,
          completedOptionalFieldsCount: sections.find(s => s.sectionId === "cocina")?.completedOptionalFieldsCount || 0,
        },
        {
          sectionId: "checklist-exteriores",
          name: t.checklist.sections.exteriores.title,
          progress: sections.find(s => s.sectionId === "exteriores")?.progress || 0,
          requiredFieldsCount: sections.find(s => s.sectionId === "exteriores")?.requiredFieldsCount || 0,
          completedRequiredFieldsCount: sections.find(s => s.sectionId === "exteriores")?.completedRequiredFieldsCount || 0,
          optionalFieldsCount: sections.find(s => s.sectionId === "exteriores")?.optionalFieldsCount || 0,
          completedOptionalFieldsCount: sections.find(s => s.sectionId === "exteriores")?.completedOptionalFieldsCount || 0,
        },
      ],
    },
  ];

  // Handle both string and object address formats
  const addressMain = typeof address === 'string' ? address.split(',')[0] : address.main;
  const addressSecondary = typeof address === 'string' 
    ? address.split(',').slice(1).join(',').trim() 
    : address.secondary;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          {/* Progress Circle */}
          <div className="relative w-[60px] h-[60px] flex-shrink-0">
            <svg className="w-[60px] h-[60px] transform -rotate-90" viewBox="0 0 60 60">
              {/* Background circle */}
              <circle
                cx="30"
                cy="30"
                r="26"
                fill="none"
                stroke="#EEF4FF"
                strokeWidth="4"
              />
              {/* Progress circle */}
              <circle
                cx="30"
                cy="30"
                r="26"
                fill="none"
                stroke="#2050F6"
                strokeWidth="4"
                strokeDasharray={`${(overallProgress / 100) * 163.36} ${163.36 - (overallProgress / 100) * 163.36}`}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-[#212121] dark:text-white">{overallProgress}%</span>
            </div>
          </div>
          
          {/* Address Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#212121] dark:text-white leading-tight mb-0.5 truncate">
              {addressMain}
            </p>
            {addressSecondary && (
              <p className="text-xs text-[#71717A] dark:text-[#71717A] leading-tight truncate">
                {addressSecondary}
              </p>
            )}
          </div>
          
          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="flex-shrink-0 p-1.5 rounded-md hover:bg-[var(--prophero-gray-100)] dark:hover:bg-[var(--prophero-gray-800)] transition-colors"
            aria-label={t.property.delete}
          >
            <Trash2 className="h-4 w-4 text-[#B91C1C]" />
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {grupos.map((grupo) => {
          const isExpanded = expandedGroups.includes(grupo.id);
          
          return (
            <div key={grupo.id}>
              <button
                onClick={() => toggleGroup(grupo.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{grupo.name}</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {isExpanded && (
                <div className="ml-2 mt-1 space-y-0.5">
                  {grupo.sections.map((section) => {
                    // Check if this is a dynamic section (habitaciones or banos) with multiple items
                    const isHabitaciones = section.sectionId === "checklist-habitaciones";
                    const isBanos = section.sectionId === "checklist-banos";
                    const dynamicCount = isHabitaciones ? habitacionesCount : isBanos ? banosCount : 0;
                    const showSubItems = dynamicCount > 1;
                    
                    return (
                      <div key={section.sectionId}>
                        <button
                          onClick={() => onSectionClick(section.sectionId)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                            activeSection === section.sectionId && !showSubItems
                              ? "bg-[var(--prophero-blue-50)] dark:bg-[var(--prophero-blue-950)] text-[var(--prophero-blue-600)] dark:text-[var(--prophero-blue-400)] font-medium"
                              : "text-muted-foreground hover:bg-[var(--prophero-gray-100)] dark:hover:bg-[var(--prophero-gray-800)] hover:text-foreground"
                          )}
                        >
                          <span>{section.name}</span>
                          <span className="text-xs">{section.progress}%</span>
                        </button>
                        {/* Show sub-items for habitaciones or banos when count > 1 */}
                        {showSubItems && (
                          <div className="ml-4 mt-0.5 space-y-0.5">
                            {Array.from({ length: dynamicCount }, (_, i) => {
                              const subItemId = isHabitaciones 
                                ? `checklist-habitaciones-${i + 1}`
                                : `checklist-banos-${i + 1}`;
                              const subItemName = isHabitaciones
                                ? `${t.checklist.sections.habitaciones.bedroom} ${i + 1}`
                                : `${t.checklist.sections.banos.bathroom} ${i + 1}`;
                              
                              return (
                                <button
                                  key={subItemId}
                                  onClick={() => onSectionClick(subItemId)}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                                    activeSection === subItemId
                                      ? "bg-[var(--prophero-blue-50)] dark:bg-[var(--prophero-blue-950)] text-[var(--prophero-blue-600)] dark:text-[var(--prophero-blue-400)] font-medium"
                                      : "text-muted-foreground hover:bg-[var(--prophero-gray-100)] dark:hover:bg-[var(--prophero-gray-800)] hover:text-foreground"
                                  )}
                                >
                                  <span>{subItemName}</span>
                                  <span className="text-xs">0%</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
