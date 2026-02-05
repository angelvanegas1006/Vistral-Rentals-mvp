"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SupplyKanbanColumn } from "./supply-kanban-column";
import { getKanbanConfig, getStatusField, type SupplyKanbanPhase, partnerKanbanColumns, analystKanbanColumns, renoKanbanColumns } from "@/lib/supply-kanban-config";
import { useI18n } from "@/lib/i18n";
import { getAllProperties, updateProperty, saveProperty, Property } from "@/lib/supply-property-storage";
import { validatePropertyComplete } from "@/lib/supply-property-validation";
import { getAllPropertiesFromSupabase } from "@/lib/supply-property-supabase";
import { isDemoMode } from "@/lib/utils";
import { useAppAuth } from "@/lib/auth/app-auth-context";

type KanbanView = "partner" | "analyst" | "reno";

interface SupplyKanbanBoardProps {
  searchQuery: string;
  isLoading?: boolean;
  onEditDraftProperty?: (propertyId: string) => void;
  kanbanView?: KanbanView;
}

export function SupplyKanbanBoard({ searchQuery, isLoading = false, onEditDraftProperty, kanbanView }: SupplyKanbanBoardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { user, role } = useAppAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const boardContainerRef = useRef<HTMLDivElement>(null);
  
  // Load properties from Supabase (with localStorage fallback)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const loadProperties = async () => {
      try {
        let allProperties: Property[] = [];
        
        // Try to load from Supabase first (if not in demo mode)
        if (!isDemoMode()) {
          try {
            const supabaseProperties = await getAllPropertiesFromSupabase(user?.id || null, role || null);
            if (supabaseProperties.length > 0) {
              allProperties = supabaseProperties;
              // Sync to localStorage for offline support
              supabaseProperties.forEach(property => {
                saveProperty(property);
              });
            } else {
              // Fallback to localStorage if Supabase is empty
              allProperties = getAllProperties();
            }
          } catch (error) {
            console.error("[SupplyKanbanBoard] Error loading from Supabase, falling back to localStorage:", error);
            // Fallback to localStorage on error
            allProperties = getAllProperties();
          }
        } else {
          // Demo mode: use localStorage only
          allProperties = getAllProperties();
        }
        
        // Check and update draft properties that are now complete
        let hasUpdates = false;
        allProperties.forEach((property) => {
          if (property.currentStage === "draft") {
            const isComplete = validatePropertyComplete(property.data, property.propertyType);
            if (isComplete) {
              // Auto-move to in-review if complete
              updateProperty(property.id, {
                currentStage: "in-review",
                timeInStage: "0 días",
              });
              hasUpdates = true;
            }
          }
        });
        
        // Reload after potential updates
        if (hasUpdates) {
          const updatedProperties = getAllProperties();
          setProperties(updatedProperties);
        } else {
          setProperties(allProperties);
        }
      } catch (error) {
        console.error("Error loading properties:", error);
        setProperties([]);
      }
    };
    
    loadProperties();
    
    // Listen for storage changes (when properties are updated in other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "vistral_supply_properties") {
        loadProperties();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user?.id, role]);
  
  const setColumnRef = useCallback((key: string, element: HTMLDivElement | null) => {
    if (element) {
      columnRefs.current[key] = element;
    } else {
      delete columnRefs.current[key];
    }
  }, []);

  // Get Kanban configuration based on role or explicit kanbanView
  const kanbanColumns = useMemo(() => {
    if (kanbanView === "partner") return partnerKanbanColumns;
    if (kanbanView === "analyst") return analystKanbanColumns;
    if (kanbanView === "reno") return renoKanbanColumns;
    return getKanbanConfig(role);
  }, [role, kanbanView]);

  // Get status field name based on role or kanbanView
  const statusField = useMemo(() => {
    if (kanbanView === "analyst") return 'analyst_status';
    return 'status';
  }, [kanbanView]);

  // Group properties by phase
  const propertiesByPhase = useMemo(() => {
    // Initialize all possible phases
    const grouped: Record<string, Property[]> = {};
    
    // Initialize phases from current Kanban config
    kanbanColumns.forEach((column) => {
      grouped[column.key] = [];
    });
    
    // Map partner phases to analyst and reno phases
    // IMPORTANT: Only properties in "in-review" appear in backlog of Analyst/Reno
    // Properties in "draft" are only visible to Partners
    const partnerToAnalystPhaseMap: Record<string, string> = {
      'in-review': 'backlog', // When partner completes, goes to analyst backlog
      'needs-correction': 'needs-correction',
      'in-negotiation': 'in-negotiation',
      'arras': 'arras',
      'settlement': 'done',
      'sold': 'done',
      'rejected': 'rejected',
    };

    const partnerToRenoPhaseMap: Record<string, string> = {
      'in-review': 'backlog', // When partner completes, goes to reno backlog
      'needs-correction': 'backlog',
      'in-negotiation': 'in-progress',
      'arras': 'in-progress',
      'settlement': 'completed',
      'sold': 'completed',
      'rejected': 'backlog',
    };

    properties.forEach((property) => {
      let phase: string | undefined;
      
      if (kanbanView === "analyst" || statusField === 'analyst_status') {
        // For analyst Kanban: use analystStatus if available, otherwise map from currentStage
        if (property.analystStatus) {
          phase = property.analystStatus;
        } else if (property.currentStage === 'draft') {
          // Draft properties are not visible to analysts - skip them
          return;
        } else if (property.currentStage && partnerToAnalystPhaseMap[property.currentStage]) {
          phase = partnerToAnalystPhaseMap[property.currentStage];
        } else {
          // If status doesn't map, don't show it (it's probably draft or unknown)
          return;
        }
      } else if (kanbanView === "reno") {
        // For reno Kanban: map from currentStage to reno phases
        if (property.currentStage === 'draft') {
          // Draft properties are not visible to reno - skip them
          return;
        } else if (property.currentStage && partnerToRenoPhaseMap[property.currentStage]) {
          phase = partnerToRenoPhaseMap[property.currentStage];
        } else {
          // If status doesn't map, don't show it (it's probably draft or unknown)
          return;
        }
      } else {
        // For partner Kanban: use currentStage (show all including draft)
        phase = property.currentStage;
      }
      
      if (phase && phase in grouped) {
        grouped[phase].push(property);
      }
    });
    
    return grouped;
  }, [properties, kanbanColumns, statusField, kanbanView]);

  // Filter properties based on search query
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) {
      return propertiesByPhase;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Property[]> = {};

    // Initialize filtered with all phases
    kanbanColumns.forEach((column) => {
      filtered[column.key] = [];
    });

    Object.entries(propertiesByPhase).forEach(([phase, props]) => {
      filtered[phase] = props.filter((prop) => {
        return (
          prop.id?.toLowerCase().includes(query) ||
          prop.fullAddress?.toLowerCase().includes(query) ||
          (prop.price && prop.price.toString().includes(query)) ||
          (prop.address?.toLowerCase().includes(query)) ||
          (prop.tags && prop.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      });
    });

    return filtered;
  }, [searchQuery, propertiesByPhase, kanbanColumns, kanbanView]);

  const handleCardClick = (id: string, stage: SupplyKanbanPhase, isReal: boolean = false) => {
    // If property is in draft, navigate to edit page
    // Otherwise, navigate to detail page (read-only view)
    if (stage === "draft") {
      router.push(`/supply/property/${id}/edit`);
    } else {
      router.push(`/supply/property/${id}`);
    }
  };

  // Get phase label from translations
  const getPhaseLabel = (phaseKey: string): string => {
    const phaseMap: Record<string, string> = {
      // Partner phases
      draft: t.kanban.draft,
      "in-review": t.kanban.inReview,
      "needs-correction": t.kanban.needsCorrection,
      "in-negotiation": t.kanban.inNegotiation,
      arras: t.kanban.arras,
      "pending-to-settlement": t.kanban.pendingToSettlement,
      settlement: t.kanban.settlement,
      rejected: t.kanban.rejected,
      // Supply Analyst phases
      backlog: t.kanban.backlog,
      "under-review": t.kanban.underReview,
      "renovation-estimation": t.kanban.renovationEstimation,
      "financial-analysis": t.kanban.financialAnalysis,
      done: t.kanban.done,
      // Reno phases (backlog is shared with analyst)
      "in-progress": t.kanban.inProgress,
      completed: t.kanban.completed,
    };
    return phaseMap[phaseKey] || phaseKey;
  };

  return (
    <div
      ref={boardContainerRef}
      className={cn(
        "h-full",
        "md:overflow-x-auto pb-4",
        "md:scrollbar-hidden",
        isHovered ? "md:scrollbar-visible" : "md:scrollbar-hidden"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        scrollbarWidth: isHovered ? "thin" : "none",
      }}
    >
      {/* Mobile: Vertical layout */}
      <div className="flex flex-col md:hidden gap-6 pb-20">
        {kanbanColumns.map((column) => {
          const properties = filteredProperties[column.key] || [];
          return (
            <SupplyKanbanColumn
              key={column.key}
              title={getPhaseLabel(column.key)}
              count={properties.length}
              stage={column.stage}
              properties={properties}
              onCardClick={handleCardClick}
              highlightedPropertyId={highlightedPropertyId}
              onColumnRef={(el) => setColumnRef(column.key, el)}
              isLoading={isLoading}
            />
          );
        })}
      </div>

      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex h-full gap-4 px-1" style={{ minWidth: "fit-content" }}>
        {kanbanColumns.map((column) => {
          const properties = filteredProperties[column.key] || [];
          return (
            <SupplyKanbanColumn
              key={column.key}
              title={getPhaseLabel(column.key)}
              count={properties.length}
              stage={column.stage}
              properties={properties}
              onCardClick={handleCardClick}
              highlightedPropertyId={highlightedPropertyId}
              onColumnRef={(el) => setColumnRef(column.key, el)}
              isLoading={isLoading}
            />
          );
        })}
      </div>
    </div>
  );
}
