"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RentalsKanbanColumn } from "./rentals-kanban-column";
import { RentalsHomeLoader } from "./rentals-home-loader";
import { useProperties } from "@/hooks/use-properties";
import { mapPropertyFromSupabase } from "@/lib/supabase/mappers";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  region?: string;
  daysInPhase: number;
  currentPhase: string;
  isExpired?: boolean;
  needsUpdate?: boolean;
  isHighlighted?: boolean;
  propertyType?: "Project" | "New Build" | "Building" | "Unit" | "WIP";
  writingDate?: string;
  visitDate?: string;
  daysToVisit?: number;
  daysToStart?: number;
  renoEndDate?: string; // Fecha de fin de renovación
  propertyReadyDate?: string; // Fecha en que la propiedad está lista
  daysToPublishRent?: number; // Días para publicar el alquiler
}

interface KanbanColumn {
  id: string;
  title: string;
  properties: Property[];
}

interface RentalsKanbanBoardProps {
  columns?: KanbanColumn[];
  searchQuery?: string;
  filters?: Record<string, any>;
  loading?: boolean;
  kanbanType?: "captacion" | "portfolio";
}

// Datos mock para Captación y Cierre
export const mockColumnsCaptacion: KanbanColumn[] = [
  {
    id: "prophero",
    title: "Viviendas Prophero",
    properties: [
      {
        property_unique_id: "PROP-001",
        address: "Calle Gran Vía 45, 3º B",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 2,
        currentPhase: "Viviendas Prophero",
        propertyType: "light",
        writingDate: "19/12/2025",
        visitDate: "04/12/2025",
        daysToVisit: 25,
      },
      {
        property_unique_id: "PROP-002",
        address: "Avenida de la Paz 12, 1º A",
        city: "Barcelona",
        region: "Barcelona",
        daysInPhase: 4,
        currentPhase: "Viviendas Prophero",
        propertyType: "medium",
        writingDate: "01/12/2025",
        visitDate: "04/12/2025",
        daysToVisit: 43,
      },
    ],
  },
  {
    id: "ready",
    title: "Listo para Alquilar",
    properties: [
      {
        property_unique_id: "PROP-004",
        address: "Calle Serrano 28, 4º D",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 8,
        currentPhase: "Listo para Alquilar",
        propertyType: "light",
        writingDate: "15/11/2025",
        daysToStart: 56,
      },
    ],
  },
  {
    id: "published",
    title: "Publicado",
    properties: [
      {
        property_unique_id: "PROP-006",
        address: "Calle Alcalá 100, 5º E",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 5,
        currentPhase: "Publicado",
        needsUpdate: true,
        propertyType: "medium",
        writingDate: "10/11/2025",
        daysToStart: 75,
      },
    ],
  },
  {
    id: "accepted",
    title: "Inquilino aceptado",
    properties: [
      {
        property_unique_id: "PROP-007",
        address: "Calle Príncipe de Vergara 50, 2º C",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 3,
        currentPhase: "Inquilino aceptado",
        propertyType: "light",
        writingDate: "05/12/2025",
        daysToStart: 30,
      },
    ],
  },
  {
    id: "pending",
    title: "Pendiente de trámites",
    properties: [
      {
        property_unique_id: "PROP-010",
        address: "Avenida Diagonal 200, 6º",
        city: "Barcelona",
        region: "Barcelona",
        daysInPhase: 18,
        currentPhase: "Pendiente de trámites",
        isExpired: true,
        propertyType: "major",
        writingDate: "20/10/2025",
        daysToStart: 88,
      },
    ],
  },
];

// Datos mock para Gestión De Cartera
export const mockColumnsPortfolio: KanbanColumn[] = [
  {
    id: "rented",
    title: "Alquilado",
    properties: [
      {
        property_unique_id: "PROP-101",
        address: "Calle Mayor 15, 2º A",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 120,
        currentPhase: "Alquilado",
        propertyType: "light",
        writingDate: "15/08/2024",
      },
      {
        property_unique_id: "PROP-102",
        address: "Avenida de América 45, 4º B",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 85,
        currentPhase: "Alquilado",
        propertyType: "medium",
        writingDate: "20/09/2024",
      },
      {
        property_unique_id: "PROP-103",
        address: "Calle Princesa 88, 1º C",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 200,
        currentPhase: "Alquilado",
        propertyType: "light",
        writingDate: "10/05/2024",
      },
    ],
  },
  {
    id: "rent-update",
    title: "Actualización de Renta (IPC)",
    properties: [
      {
        property_unique_id: "PROP-104",
        address: "Calle Goya 30, 3º D",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 15,
        currentPhase: "Actualización de Renta (IPC)",
        propertyType: "light",
        writingDate: "01/11/2024",
        needsUpdate: true,
      },
      {
        property_unique_id: "PROP-105",
        address: "Avenida de la Castellana 200, 5º",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 8,
        currentPhase: "Actualización de Renta (IPC)",
        propertyType: "medium",
        writingDate: "08/11/2024",
        needsUpdate: true,
      },
    ],
  },
  {
    id: "renovation",
    title: "Gestión de Renovación",
    properties: [
      {
        property_unique_id: "PROP-106",
        address: "Calle Velázquez 50, 2º E",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 45,
        currentPhase: "Gestión de Renovación",
        propertyType: "light",
        writingDate: "20/10/2024",
      },
      {
        property_unique_id: "PROP-107",
        address: "Calle Serrano 120, 4º F",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 30,
        currentPhase: "Gestión de Renovación",
        propertyType: "medium",
        writingDate: "05/11/2024",
      },
    ],
  },
  {
    id: "finalization",
    title: "Finalización y Salida",
    properties: [
      {
        property_unique_id: "PROP-108",
        address: "Calle Claudio Coello 25, 1º A",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 10,
        currentPhase: "Finalización y Salida",
        propertyType: "light",
        writingDate: "25/11/2024",
        isExpired: false,
      },
      {
        property_unique_id: "PROP-109",
        address: "Avenida de Brasil 12, 3º B",
        city: "Madrid",
        region: "Madrid",
        daysInPhase: 5,
        currentPhase: "Finalización y Salida",
        propertyType: "major",
        writingDate: "30/11/2024",
        isExpired: false,
      },
    ],
  },
];

export function RentalsKanbanBoard({
  columns,
  searchQuery = "",
  filters = {},
  loading = false,
  kanbanType = "captacion",
}: RentalsKanbanBoardProps) {
  const router = useRouter();
  
  // Hooks deben estar siempre al principio, antes de cualquier return condicional
  const [isHovered, setIsHovered] = useState(false);
  const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | null>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const setColumnRef = useCallback((key: string, element: HTMLDivElement | null) => {
    if (element) {
      columnRefs.current[key] = element;
    } else {
      delete columnRefs.current[key];
    }
  }, []);

  // Intentar cargar datos desde Supabase
  const { 
    properties: supabaseProperties, 
    loading: supabaseLoading,
    isSupabaseConfigured 
  } = useProperties({
    kanbanType,
    searchQuery,
    filters, // Los filtros ahora se aplican en use-properties.ts
  });

  // Definir las fases según el tipo de Kanban
  const phaseMapping = useMemo(() => {
    if (kanbanType === "captacion") {
      return {
        "Viviendas Prophero": "prophero",
        "Listo para Alquilar": "ready",
        "Publicado": "published",
        "Inquilino aceptado": "accepted",
        "Pendiente de trámites": "pending",
      };
    } else {
      return {
        "Alquilado": "rented",
        "Actualización de Renta (IPC)": "rent-update",
        "Gestión de Renovación": "renovation",
        "Finalización y Salida": "finalization",
      };
    }
  }, [kanbanType]);

  // Convertir propiedades de Supabase a columnas del Kanban
  const supabaseColumns = useMemo(() => {
    console.log("📊 Procesando propiedades de Supabase:", {
      count: supabaseProperties?.length || 0,
      loading: supabaseLoading,
      isConfigured: isSupabaseConfigured,
    });

    // Si Supabase está configurado pero no hay propiedades, crear columnas vacías
    if (isSupabaseConfigured && (!supabaseProperties || supabaseProperties.length === 0)) {
      console.log("✅ Supabase configurado pero sin datos. Mostrando columnas vacías.");
      
      // Crear columnas vacías según el tipo de Kanban con orden fijo
      const phaseOrder = kanbanType === "captacion" 
        ? ["prophero", "ready", "published", "accepted", "pending"]
        : ["rented", "rent-update", "renovation", "finalization"];

      const phaseTitles = kanbanType === "captacion" 
        ? {
            prophero: "Viviendas Prophero",
            ready: "Listo para Alquilar",
            published: "Publicado",
            accepted: "Inquilino aceptado",
            pending: "Pendiente de trámites",
          }
        : {
            rented: "Alquilado",
            "rent-update": "Actualización de Renta (IPC)",
            renovation: "Gestión de Renovación",
            finalization: "Finalización y Salida",
          };

      return phaseOrder.map((id) => ({
        id,
        title: phaseTitles[id as keyof typeof phaseTitles] || id,
        properties: [],
      }));
    }

    // Si no hay propiedades y Supabase no está configurado, retornar null para usar mock
    if (!supabaseProperties || supabaseProperties.length === 0) {
      console.log("⚠️ No hay propiedades de Supabase y no está configurado, usando datos mock");
      return null;
    }

    const columnsMap: Record<string, Property[]> = {};

    // Agrupar propiedades por fase
    supabaseProperties.forEach((prop) => {
      const mappedProp = mapPropertyFromSupabase(prop);
      const phaseId = phaseMapping[mappedProp.currentPhase as keyof typeof phaseMapping];
      
      // Debug: Verificar propiedades de "Pendiente de trámites"
      if (mappedProp.currentPhase === "Pendiente de trámites") {
        console.log("🔴 Propiedad Pendiente de trámites:", {
          property_unique_id: mappedProp.property_unique_id,
          isExpired: mappedProp.isExpired,
          needsUpdate: mappedProp.needsUpdate,
          raw_is_expired: prop.is_expired,
          raw_needs_update: prop.needs_update,
        });
      }
      
      if (phaseId) {
        if (!columnsMap[phaseId]) {
          columnsMap[phaseId] = [];
        }
        columnsMap[phaseId].push(mappedProp);
      }
    });

    // Convertir a formato de columnas con orden fijo
    const phaseOrder = kanbanType === "captacion" 
      ? ["prophero", "ready", "published", "accepted", "pending"]
      : ["rented", "rent-update", "renovation", "finalization"];

    const phaseTitles = kanbanType === "captacion" 
      ? {
          prophero: "Viviendas Prophero",
          ready: "Listo para Alquilar",
          published: "Publicado",
          accepted: "Inquilino aceptado",
          pending: "Pendiente de trámites",
        }
      : {
          rented: "Alquilado",
          "rent-update": "Actualización de Renta (IPC)",
          renovation: "Gestión de Renovación",
          finalization: "Finalización y Salida",
        };

    // Crear columnas en el orden correcto
    return phaseOrder.map((id) => {
      let properties = columnsMap[id] || [];
      
      // Ordenar "Listo para Alquilar" por daysToPublishRent (mayor a menor)
      if (id === "ready" && kanbanType === "captacion") {
        properties = [...properties].sort((a, b) => {
          const aDays = a.daysToPublishRent ?? 0;
          const bDays = b.daysToPublishRent ?? 0;
          return bDays - aDays; // Orden descendente (mayor a menor)
        });
      }
      
      
      return {
        id,
        title: phaseTitles[id as keyof typeof phaseTitles] || id,
        properties,
      };
    });
  }, [supabaseProperties, phaseMapping, kanbanType, isSupabaseConfigured]);

  // Seleccionar datos: Supabase primero, luego mock como fallback
  const defaultColumns = useMemo(() => {
    if (columns) {
      console.log("📋 Usando columnas proporcionadas como prop");
      return columns;
    }
    if (supabaseColumns && supabaseColumns.length > 0) {
      console.log("✅ Usando columnas de Supabase:", supabaseColumns.length, "columnas");
      return supabaseColumns;
    }
    // Fallback a datos mock
    console.log("🔄 Usando datos mock como fallback");
    return kanbanType === "portfolio" ? mockColumnsPortfolio : mockColumnsCaptacion;
  }, [columns, supabaseColumns, kanbanType]);

  // Filtrar y marcar propiedades según búsqueda
  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) {
      // Sin búsqueda: mostrar todas sin highlighted
      return defaultColumns.map((column) => {
        let properties = column.properties.map((p) => ({
          ...p,
          isHighlighted: false,
        }));
        
        // Ordenar "Listo para Alquilar" por daysToPublishRent (mayor a menor)
        if (column.id === "ready" && kanbanType === "captacion") {
          properties = [...properties].sort((a, b) => {
            const aDays = a.daysToPublishRent ?? 0;
            const bDays = b.daysToPublishRent ?? 0;
            return bDays - aDays; // Orden descendente (mayor a menor)
          });
        }
        
        
        return {
          ...column,
          properties,
        };
      });
    }

    const query = searchQuery.toLowerCase().trim();

    return defaultColumns.map((column) => {
      let properties = column.properties
        .filter(
          (property) =>
            property.address.toLowerCase().includes(query) ||
            property.property_unique_id.toLowerCase().includes(query) ||
            property.city?.toLowerCase().includes(query)
        )
        .map((property) => ({
          ...property,
          // Marcar como highlighted si coincide con la búsqueda
          isHighlighted:
            property.address.toLowerCase().includes(query) ||
            property.property_unique_id.toLowerCase().includes(query),
        }));
      
      // Ordenar "Listo para Alquilar" por daysToPublishRent (mayor a menor)
      if (column.id === "ready" && kanbanType === "captacion") {
        properties = [...properties].sort((a, b) => {
          const aDays = a.daysToPublishRent ?? 0;
          const bDays = b.daysToPublishRent ?? 0;
          return bDays - aDays; // Orden descendente (mayor a menor)
        });
      }
      
      
      return {
        ...column,
        properties,
      };
    });
  }, [defaultColumns, searchQuery]);

  const handleCardClick = (propertyId: string) => {
    // Navegar siempre a la página de detalle
    router.push(`/rentals/property/${propertyId}`);
  };

  // Update highlighted property based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const foundProperty = filteredColumns
        .flatMap(col => col.properties)
        .find(prop => 
          prop.address.toLowerCase().includes(query) ||
          prop.property_unique_id.toLowerCase().includes(query)
        );
      setHighlightedPropertyId(foundProperty?.property_unique_id || null);
    } else {
      setHighlightedPropertyId(null);
    }
  }, [searchQuery, filteredColumns]);

  if (loading || supabaseLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--prophero-gray-50)] dark:bg-[#000000] px-margin-xs sm:px-margin-sm md:px-margin-md lg:px-margin-lg xl:px-margin-xl 2xl:px-margin-xxl py-4 md:py-6">
        <RentalsHomeLoader size="md" />
      </div>
    );
  }

  return (
    <div
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
      <div className="flex flex-col md:hidden gap-gutter-md pb-20 px-margin-xs">
        {filteredColumns.map((column) => (
          <RentalsKanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            properties={column.properties}
            onCardClick={handleCardClick}
            searchQuery={searchQuery}
            highlightedPropertyId={highlightedPropertyId}
            onColumnRef={(el) => setColumnRef(column.id, el)}
            isLoading={loading || supabaseLoading}
          />
        ))}
      </div>

      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex h-full gap-gutter-md lg:gap-gutter-lg xl:gap-gutter-xl px-margin-xs sm:px-margin-sm md:px-margin-md lg:px-margin-lg xl:px-margin-xl 2xl:px-margin-xxl" style={{ minWidth: "fit-content", paddingLeft: "40px", paddingRight: "40px" }}>
        {filteredColumns.map((column) => (
          <RentalsKanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            properties={column.properties}
            onCardClick={handleCardClick}
            searchQuery={searchQuery}
            highlightedPropertyId={highlightedPropertyId}
            onColumnRef={(el) => setColumnRef(column.id, el)}
            isLoading={loading || supabaseLoading}
          />
        ))}
      </div>
    </div>
  );
}
