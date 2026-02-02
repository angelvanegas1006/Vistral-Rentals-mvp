"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, FileText, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DocumentPreviewOverlay } from "./DocumentPreviewOverlay";

export function DataTreeViewer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{ name: string; type?: "pdf" | "image" | "document" } | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Mock data structure - Group 1: Core Property Data only
  const corePropertyData = {
    "Información de la Propiedad": {
      "Datos generales": {
        Dirección: "Calle Gran Vía, 123",
        "Tipo de activo": "Unit",
        "Tamaño de la vivienda (m²)": "85",
        "Número de habitaciones": "3",
        "Número de baños/aseos": "2",
        "Número de plazas de garaje": "1",
        Piso: "3",
        "Unique ID": "PROP-2024-001",
        "Administrador de la propiedad": "Admin Corp S.L.",
      },
      Accesos: {
        "Localización de las llaves": "Portería - Caja 3",
      },
      "Documentación técnica y visual": {
        "Documentos de la reforma": "reforma_docs.pdf",
        "Certificado de eficiencia energética": "certificado_energetico.pdf",
        "Fotos de la propiedad actualizadas tras la reforma": "12 fotos",
      },
    },
    "Información del Propietario": {
      "Datos personales": {
        "Nombre completo del propietario": "Juan Pérez García",
        "DNI/NIE del propietario (TECH ID)": "12345678A",
        "Número de teléfono": "+34 600 123 456",
        "Correo electrónico": "juan.perez@email.com",
      },
      "Datos bancarios": {
        "Cuenta bancaria del propietario": "ES12 3456 7890 1234 5678 9012",
        "Certificado de titularidad bancaria": "titularidad_bancaria.pdf",
      },
    },
    "Contratos y Pólizas de la Vivienda": {
      "Documentación Legal": {
        "Contrato de compraventa": "contrato_compraventa.pdf",
        "Nota Simple de la propiedad": "nota_simple.pdf",
      },
      Suministros: {
        "Contrato Electricidad": "contrato_electricidad.pdf",
        "Contrato Agua": "contrato_agua.pdf",
        "Contrato Gas": "N/A",
        "Contrato Otros Suministros": "N/A",
      },
      Facturas: {
        "Factura Electricidad": "factura_electricidad_ene2024.pdf",
        "Factura Agua": "factura_agua_ene2024.pdf",
        "Factura Gas": "N/A",
        "Factura Otros Suministros": "N/A",
      },
      "Seguro de hogar": {
        "Tipo de seguro de hogar": "Completo",
        "Póliza del seguro de hogar": "poliza_seguro.pdf",
      },
    },
    "Información para la fase de Comercialización": {
      "Tipo de alquiler": "Residencial",
      "¿Tiene ya inquilino? (Sí/No)": "No",
    },
    "Gestión interna Prophero": {
      "Plan Property Manager (Plan PM)": "Plan Premium",
      "Property Manager asignado (PM)": "María González",
    },
  };

  const isDocument = (value: string): boolean => {
    const lower = value.toLowerCase();
    return lower.includes(".pdf") || 
           lower.includes(".doc") || 
           lower.includes("foto") || 
           lower.includes("photo") ||
           !!lower.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/);
  };

  const isPhoto = (key: string, value: string): boolean => {
    const lowerKey = key.toLowerCase();
    const lowerValue = value.toLowerCase();
    return lowerKey.includes("foto") || 
           lowerKey.includes("photo") || 
           lowerValue.includes("foto") ||
           !!lowerValue.match(/\.(jpg|jpeg|png|gif|webp)$/);
  };

  // Flexible word-based matching: checks if all words in query appear in target
  const flexibleMatch = (query: string, target: string): boolean => {
    const lowerQuery = query.toLowerCase().trim();
    const lowerTarget = target.toLowerCase();
    
    // If query is empty, no match
    if (!lowerQuery) return false;
    
    // Split query into words (handle multiple spaces)
    const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 0);
    
    // If no valid words, fall back to simple substring match
    if (queryWords.length === 0) {
      return lowerTarget.includes(lowerQuery);
    }
    
    // Check if all words appear in the target (in any order)
    return queryWords.every(word => lowerTarget.includes(word));
  };

  const filterData = (
    data: Record<string, any>,
    query: string,
    parentPath: string = ""
  ): { filtered: Record<string, any>; shouldExpand: Set<string> } => {
    if (!query) return { filtered: data, shouldExpand: new Set() };

    const filtered: Record<string, any> = {};
    const shouldExpand = new Set<string>();

    Object.entries(data).forEach(([key, value]) => {
      const keyMatches = flexibleMatch(query, key);
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      
      if (typeof value === "object") {
        // Recursively filter children first
        const { filtered: filteredValue, shouldExpand: childExpand } = filterData(value, query, currentPath);
        
        // Check if any children match (for expansion logic)
        const hasMatchingChildren = Object.keys(filteredValue).length > 0;
        
        // CONDITION A: Section/Subsection title matches
        if (keyMatches) {
          // Include the entire section with all its children (unfiltered)
          filtered[key] = value;
          
          // Expand this section if:
          // 1. Children also match the query, OR
          // 2. This is a nested match (we want to show the path)
          if (hasMatchingChildren || childExpand.size > 0) {
            shouldExpand.add(key);
            shouldExpand.add(currentPath);
            // Add all child expansion paths
            childExpand.forEach(child => shouldExpand.add(child));
          }
          // If only title matches (no matching children), section stays collapsed
        } 
        // CONDITION B: Section title doesn't match, but has matching children
        else if (hasMatchingChildren) {
          // Include parent section to show the path, with filtered children
          filtered[key] = filteredValue;
          
          // Always expand parent sections that contain matches (to show the path)
          shouldExpand.add(key);
          shouldExpand.add(currentPath);
          childExpand.forEach(child => shouldExpand.add(child));
        }
      } else {
        // Leaf node: check if key or value matches
        const valueMatches = flexibleMatch(query, String(value));
        if (keyMatches || valueMatches) {
          filtered[key] = value;
          
          // If an item matches, expand ALL parent sections to show the full path
          if (parentPath) {
            // Parse parent path and add all ancestors to shouldExpand
            const pathParts = parentPath.split('.');
            let accumulatedPath = '';
            pathParts.forEach((part, index) => {
              if (index === 0) {
                accumulatedPath = part;
              } else {
                accumulatedPath = `${accumulatedPath}.${part}`;
              }
              shouldExpand.add(part);
              shouldExpand.add(accumulatedPath);
            });
          }
        }
      }
    });

    return { filtered, shouldExpand };
  };

  // Memoize filtered data to prevent recalculation
  const { filtered: filteredData, shouldExpand } = useMemo(() => {
    return searchQuery
      ? filterData(corePropertyData, searchQuery, "")
      : { filtered: corePropertyData, shouldExpand: new Set<string>() };
  }, [searchQuery]);

  // Handle search query changes - collapse all when cleared
  // IMPORTANT: Only depend on searchQuery, not shouldExpand (Set objects are recreated each render)
  useEffect(() => {
    if (!searchQuery) {
      setExpandedKeys(new Set());
    } else {
      // Recalculate shouldExpand inside effect to avoid dependency on Set reference
      const { shouldExpand: expandSet } = filterData(corePropertyData, searchQuery, "");
      setExpandedKeys(expandSet);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]); // Only searchQuery - filterData is stable

  // Track previous open state to prevent unnecessary updates
  const prevOpenRef = useRef(!!previewDoc);
  
  // Stable handler for preview overlay - prevents infinite loops
  const handlePreviewOpenChange = useCallback((open: boolean) => {
    // Only update if the value actually changed
    if (open !== prevOpenRef.current) {
      prevOpenRef.current = open;
      if (!open) {
        setPreviewDoc(null);
      }
    }
  }, []);
  
  // Update ref when previewDoc changes
  useEffect(() => {
    prevOpenRef.current = !!previewDoc;
  }, [previewDoc]);

  const renderDataTree = (data: Record<string, any>, level = 0, parentPath = ""): JSX.Element[] => {
    return Object.entries(data).map(([key, value]) => {
      const fullPath = parentPath ? `${parentPath}.${key}` : key;
      const isRootLevel = level === 0;
      const shouldBeExpanded = expandedKeys.has(key) || expandedKeys.has(fullPath) || (searchQuery && (shouldExpand.has(key) || shouldExpand.has(fullPath)));

      if (typeof value === "object" && value !== null) {
        const isExpanded = expandedKeys.has(key) || expandedKeys.has(fullPath) || (searchQuery && (shouldExpand.has(key) || shouldExpand.has(fullPath)));
        return (
          <Accordion
            key={key}
            type="single"
            collapsible
            className="w-full"
            value={isExpanded ? key : ""}
            onValueChange={(newValue) => {
              const newExpanded = new Set(expandedKeys);
              if (newValue === key) {
                newExpanded.add(key);
                newExpanded.add(fullPath);
              } else {
                newExpanded.delete(key);
                newExpanded.delete(fullPath);
              }
              setExpandedKeys(newExpanded);
            }}
          >
            <AccordionItem value={key} className="border-none">
              <AccordionTrigger 
                className={`px-4 py-2 text-sm font-medium hover:no-underline text-left ${
                  isRootLevel 
                    ? "bg-gray-200 text-gray-900 font-semibold" 
                    : "text-gray-700 bg-transparent"
                }`}
              >
                {key}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-2">
                <div className="space-y-1 pl-4 text-left">
                  {renderDataTree(value, level + 1, fullPath)}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }
      
      const valueStr = String(value);
      const isDoc = isDocument(valueStr);
      const isImg = isPhoto(key, valueStr);

      return (
        <div
          key={key}
          className="rounded-md px-3 py-1.5 text-xs hover:bg-gray-100 text-left cursor-pointer break-words"
          style={{ paddingLeft: `${level * 12 + 12}px` }}
          onClick={() => {
            try {
              if (isDoc || isImg) {
                const safeValueStr = valueStr || "Unknown file";
                setPreviewDoc({
                  name: safeValueStr,
                  type: isImg ? "image" : safeValueStr.toLowerCase().endsWith(".pdf") ? "pdf" : "document"
                });
              }
            } catch (error) {
              console.error('Error opening preview:', error);
              // Don't crash - just log the error
            }
          }}
        >
          <div className="flex items-start gap-2">
            {(isDoc || isImg) && (
              isImg ? (
                <ImageIcon className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />
              ) : (
                <FileText className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />
              )
            )}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-600">{key}:</span>{" "}
              <span className="text-gray-800 break-words">{valueStr}</span>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <Card className="m-4 flex h-full flex-col overflow-hidden border-gray-200 shadow-sm">
      {/* Search Widget */}
      <div className="border-b border-gray-100 bg-gray-100/50 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar información..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Collapse all when search is cleared
              if (!e.target.value) {
                setExpandedKeys(new Set());
              }
            }}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Data Tree - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 text-left">
        <div className="space-y-1">{renderDataTree(filteredData)}</div>
      </div>

      {/* Document Preview Overlay - Only render when there's a document to preview */}
      {previewDoc && (
        <DocumentPreviewOverlay
          open={true}
          onOpenChange={handlePreviewOpenChange}
          documentName={previewDoc.name}
          documentType={previewDoc.type}
        />
      )}
    </Card>
  );
}
