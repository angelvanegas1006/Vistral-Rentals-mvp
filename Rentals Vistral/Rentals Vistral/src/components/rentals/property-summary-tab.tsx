"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageGalleryModal, GalleryMediaItem } from "./image-gallery-modal";
import {
  Home,
  MapPin,
  Grid3x3,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  Shield,
  Zap,
  Droplets,
  Flame,
  Check,
  X as XIcon,
  Ruler,
  Bed,
  Bath,
  Building2,
  Calendar,
  Wind,
  ArrowUpDown,
  Car,
  Sun,
  Square,
  Images,
  Hammer,
  Compass,
  ArrowUpCircle,
  CalendarClock,
  Timer,
  TrendingUp,
} from "lucide-react";
import { SmartDocumentField } from "./smart-document-field";
import { SmartDocumentFieldArray } from "./smart-document-field-array";
import { DocumentPreviewModal } from "./document-preview-modal";
import { FinancialPerformanceWidget } from "@/components/property/FinancialPerformanceWidget";
import { TimeMetricsWidget } from "@/components/property/TimeMetricsWidget";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import { config } from "@/lib/config/environment";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface PropertySummaryTabProps {
  propertyId: string;
  currentPhase?: string;
  property?: PropertyRow | null;
}

// Placeholder image URL
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/800x600?text=No+Image+Available";

export function PropertySummaryTab({ propertyId, currentPhase, property }: PropertySummaryTabProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState<GalleryMediaItem[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0); // For interactive gallery
  const [documentFilter, setDocumentFilter] = useState<"all" | "legal" | "insurance" | "supplies">("all");
  const [documentSearch, setDocumentSearch] = useState("");
  const [previewModal, setPreviewModal] = useState<{ open: boolean; url: string; label: string } | null>(null);
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Local state for property data (enables instant updates without page refresh)
  const [localProperty, setLocalProperty] = useState(property);

  // Update local property when prop changes (e.g., parent refetch)
  useEffect(() => {
    if (property) {
      setLocalProperty(property);
    }
  }, [property]);

  // Extract images from localProperty.pics_urls (JSONB array)
  const images: string[] = localProperty?.pics_urls && Array.isArray(localProperty.pics_urls) 
    ? localProperty.pics_urls.filter((url): url is string => typeof url === "string" && url.length > 0)
    : [];

  // Convert images to GalleryMediaItem format
  const getAllMediaWithLabels = (): GalleryMediaItem[] => {
    return images.map((url, index) => ({
      url,
      type: "image" as const,
      label: `Imagen ${index + 1}`,
      name: `Imagen ${index + 1}`,
    }));
  };

  const handleImageClick = (index: number) => {
    const allMedia = getAllMediaWithLabels();
    setGalleryMedia(allMedia);
    setMainImageIndex(index); // Update main image index
    setIsGalleryOpen(true);
  };

  const handleThumbnailClick = (index: number) => {
    setMainImageIndex(index);
  };

  const handlePreviousThumbnail = () => {
    if (images.length === 0) return;
    const newIndex = mainImageIndex === 0 ? images.length - 1 : mainImageIndex - 1;
    setMainImageIndex(newIndex);
  };

  const handleNextThumbnail = () => {
    if (images.length === 0) return;
    const newIndex = mainImageIndex === images.length - 1 ? 0 : mainImageIndex + 1;
    setMainImageIndex(newIndex);
  };

  // Scroll active thumbnail into view when mainImageIndex changes
  useEffect(() => {
    if (thumbnailRefs.current[mainImageIndex]) {
      thumbnailRefs.current[mainImageIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [mainImageIndex]);



  // Map UI labels to database field names
  const getFieldNameFromLabel = (label: string): string | null => {
    const labelToFieldMap: Record<string, string> = {
      "Contrato de compraventa de la propiedad": "doc_purchase_contract",
      "Nota Simple de la propiedad": "doc_land_registry_note",
      "Contrato Property Management": "property_management_plan_contract_url",
      "Certificado de eficiencia energética": "doc_energy_cert",
      "Documentos de la reforma": "doc_renovation_files",
      "Póliza del Seguro de Hogar": "home_insurance_policy_url",
      "Contrato Electricidad": "doc_contract_electricity",
      "Factura Electricidad": "doc_bill_electricity",
      "Contrato Agua": "doc_contract_water",
      "Factura Agua": "doc_bill_water",
      "Contrato Gas": "doc_contract_gas",
      "Factura Gas": "doc_bill_gas",
      "Contrato otros suministros": "doc_contract_other",
      "Última factura otros suministros": "doc_bill_other",
    };
    return labelToFieldMap[label] || null;
  };

  // Simple smooth scroll (no animation)
  const scrollToFieldWithAnimation = (label: string) => {
    setTimeout(() => {
      const fieldElement = document.querySelector(`[data-field-label="${label}"]`) as HTMLElement;
      if (fieldElement) {
        fieldElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  // Handle document upload with instant state update (no page refresh!)
  const handleDocumentUpload = async (label: string, file: File) => {
    if (!localProperty?.property_unique_id) {
      console.error("Property ID is required for document upload");
      return;
    }

    const fieldName = getFieldNameFromLabel(label);
    if (!fieldName) {
      console.error(`Unknown field label: ${label}`);
      return;
    }

    try {
      // Get current value for cleanup/replacement
      let currentValue: string | null | undefined;
      if (fieldName === "doc_renovation_files") {
        currentValue = null; // Always append for arrays
      } else {
        currentValue = localProperty[fieldName as keyof typeof localProperty] as string | null | undefined;
      }
      
      // Upload file and get new URL
      const { uploadDocument } = await import("@/lib/document-upload");
      const newUrl = await uploadDocument(fieldName, localProperty.property_unique_id, file, currentValue);
      
      // Update local state immediately (no page refresh!)
      setLocalProperty(prev => {
        if (!prev) return prev;
        
        if (fieldName === "doc_renovation_files") {
          // Append to array
          const currentArray = Array.isArray(prev.doc_renovation_files) ? prev.doc_renovation_files : [];
          return {
            ...prev,
            doc_renovation_files: [...currentArray, newUrl]
          };
        } else {
          // Replace single field
          return { ...prev, [fieldName]: newUrl };
        }
      });
      
      // Scroll to field with animation (instant, no page load!)
      scrollToFieldWithAnimation(label);
      
    } catch (error) {
      console.error("Failed to upload document:", error);
      alert(`Error al subir el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Handle document deletion with instant state update (no page refresh!)
  const handleDocumentDelete = async (label: string, fileUrl?: string) => {
    if (!localProperty?.property_unique_id) {
      console.error("Property ID is required for document deletion");
      return;
    }

    const fieldName = getFieldNameFromLabel(label);
    if (!fieldName) {
      console.error(`Unknown field label: ${label}`);
      return;
    }

    try {
      // For JSONB arrays, fileUrl is required
      // For single fields, use current value
      let urlToDelete: string;
      if (fieldName === "doc_renovation_files") {
        if (!fileUrl) {
          console.error("File URL is required for array field deletion");
          return;
        }
        urlToDelete = fileUrl;
      } else {
        const currentValue = localProperty[fieldName as keyof typeof localProperty] as string | null | undefined;
        if (!currentValue) {
          console.error("No document to delete");
          return;
        }
        urlToDelete = currentValue;
      }
      
      // Delete file from backend
      const { deleteDocument } = await import("@/lib/document-upload");
      await deleteDocument(fieldName, localProperty.property_unique_id, urlToDelete);
      
      // Update local state immediately (no page refresh!)
      setLocalProperty(prev => {
        if (!prev) return prev;
        
        if (fieldName === "doc_renovation_files") {
          // Remove from array
          const currentArray = Array.isArray(prev.doc_renovation_files) ? prev.doc_renovation_files : [];
          return {
            ...prev,
            doc_renovation_files: currentArray.filter(url => url !== urlToDelete)
          };
        } else {
          // Set to null for single fields
          return { ...prev, [fieldName]: null };
        }
      });
      
      // Don't scroll after delete - it causes unwanted layout shifts
      
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert(`Error al eliminar el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Build document structure from localProperty data
  // ALWAYS include all document fields, even when NULL, so users can upload missing documents
  const buildDocuments = () => {
    if (!localProperty) return { legal: [], legalArrays: {}, insurance: [], supplies: {} };

    const legalDocs: Array<{ name: string; url: string | null }> = [];
    const legalArrayDocs: { renovationFiles: string[] | null } = { renovationFiles: null };
    const insuranceDocs: Array<{ name: string; url: string | null; insuranceType?: string }> = [];
    const suppliesDocs: {
      electricity?: { contract?: { name: string; url: string | null }; bill?: { name: string; url: string | null } };
      water?: { contract?: { name: string; url: string | null }; bill?: { name: string; url: string | null } };
      gas?: { contract?: { name: string; url: string | null }; bill?: { name: string; url: string | null } };
      other?: { contract?: { name: string; url: string | null }; bill?: { name: string; url: string | null } };
    } = {};

    // Legal documents - ALWAYS include all fields, even when NULL
    legalDocs.push({ 
      name: "Contrato de compraventa de la propiedad", 
      url: localProperty.doc_purchase_contract || null 
    });
    legalDocs.push({ 
      name: "Nota Simple de la propiedad", 
      url: localProperty.doc_land_registry_note || null 
    });
    legalDocs.push({ 
      name: "Contrato Property Management", 
      url: localProperty.property_management_plan_contract_url || null 
    });
    legalDocs.push({ 
      name: "Certificado de eficiencia energética", 
      url: localProperty.doc_energy_cert || null 
    });
    
    // For renovation files, store the full array (handled separately with SmartDocumentFieldArray)
    legalArrayDocs.renovationFiles = localProperty.doc_renovation_files && Array.isArray(localProperty.doc_renovation_files)
      ? localProperty.doc_renovation_files
      : null;

    // Insurance documents - ALWAYS include, even when NULL
    insuranceDocs.push({
      name: "Póliza del Seguro de Hogar",
      url: localProperty.home_insurance_policy_url || null,
      insuranceType: localProperty.home_insurance_type || undefined,
    });

    // Supplies documents - ALWAYS include all fields, even when NULL
    suppliesDocs.electricity = {
      contract: { name: "Contrato Electricidad", url: localProperty.doc_contract_electricity || null },
      bill: { name: "Factura Electricidad", url: localProperty.doc_bill_electricity || null },
    };
    suppliesDocs.water = {
      contract: { name: "Contrato Agua", url: localProperty.doc_contract_water || null },
      bill: { name: "Factura Agua", url: localProperty.doc_bill_water || null },
    };
    suppliesDocs.gas = {
      contract: { name: "Contrato Gas", url: localProperty.doc_contract_gas || null },
      bill: { name: "Factura Gas", url: localProperty.doc_bill_gas || null },
    };
    suppliesDocs.other = {
      contract: { name: "Contrato otros suministros", url: localProperty.doc_contract_other || null },
      bill: { name: "Última factura otros suministros", url: localProperty.doc_bill_other || null },
    };

    return { legal: legalDocs, legalArrays: legalArrayDocs, insurance: insuranceDocs, supplies: suppliesDocs };
  };

  // Filter documents based on selected filter and search query (real-time)
  const getFilteredDocuments = () => {
    const searchLower = documentSearch.toLowerCase().trim();
    const allDocs = buildDocuments();
    
    // Helper function to filter documents by search query
    const filterBySearch = (docs: Array<{ name: string; url: string | null }>): Array<{ name: string; url: string | null }> => {
      if (!searchLower) return docs;
      return docs.filter((doc) => doc.name.toLowerCase().includes(searchLower));
    };

    const filterInsuranceBySearch = (docs: Array<{ name: string; url: string | null; insuranceType?: string }>): Array<{ name: string; url: string | null; insuranceType?: string }> => {
      if (!searchLower) return docs;
      return docs.filter((doc) => 
        doc.name.toLowerCase().includes(searchLower) || 
        (doc.insuranceType && doc.insuranceType.toLowerCase().includes(searchLower))
      );
    };

    const filterSuppliesBySearch = (supplies: typeof allDocs.supplies): typeof allDocs.supplies => {
      if (!searchLower) return supplies;
      const filtered: typeof supplies = {};
      Object.keys(supplies).forEach((key) => {
        const utility = supplies[key as keyof typeof supplies];
        if (!utility) return;
        const contractMatch = utility.contract?.name.toLowerCase().includes(searchLower);
        const billMatch = utility.bill?.name.toLowerCase().includes(searchLower);
        if (contractMatch || billMatch) {
          filtered[key as keyof typeof supplies] = utility;
        }
      });
      return filtered;
    };

    let result: typeof allDocs = { legal: [], legalArrays: { renovationFiles: null }, insurance: [], supplies: {} };

    if (documentFilter === "all") {
      result = {
        legal: filterBySearch(allDocs.legal),
        legalArrays: allDocs.legalArrays, // Always include array fields
        insurance: filterInsuranceBySearch(allDocs.insurance),
        supplies: filterSuppliesBySearch(allDocs.supplies),
      };
    } else if (documentFilter === "legal") {
      result = { 
        legal: filterBySearch(allDocs.legal), 
        legalArrays: allDocs.legalArrays, // Always include array fields when showing legal
        insurance: [], 
        supplies: {} 
      };
    } else if (documentFilter === "insurance") {
      result = { legal: [], legalArrays: { renovationFiles: null }, insurance: filterInsuranceBySearch(allDocs.insurance), supplies: {} };
    } else if (documentFilter === "supplies") {
      result = { legal: [], legalArrays: { renovationFiles: null }, insurance: [], supplies: filterSuppliesBySearch(allDocs.supplies) };
    }

    return result;
  };

  const filteredDocs = getFilteredDocuments();

  const [activePropertySubTab, setActivePropertySubTab] = useState<"basic" | "building">("basic");

  // Gallery setup - matching supply_vistral design
  const mainImage = images[0] || null; // Always show the first image
  const thumbnailImages = images.slice(1, 5); // Show images 2-5 as thumbnails
  
  // Handle image loading errors
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };
  
  const isValidImage = (index: number) => {
    return !imageErrors.has(index) && images[index];
  };

  return (
    <div className="space-y-8">
      {/* Image Gallery - Matching supply_vistral design */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Image */}
          <div className="relative w-full aspect-square overflow-hidden bg-[#F9FAFB] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151]" style={{ borderRadius: '8px 0 0 8px' }}>
            {mainImage && isValidImage(0) ? (
              <img
                src={mainImage}
                alt={`Imagen principal de ${property?.address || "propiedad"}`}
                className="w-full h-full object-cover cursor-pointer"
                style={{ borderRadius: '8px 0 0 8px' }}
                onError={() => handleImageError(0)}
                onClick={() => handleImageClick(0)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#6B7280] dark:text-[#9CA3AF] text-sm" style={{ borderRadius: '8px 0 0 8px' }}>
                {images.length > 0 ? "Imagen no disponible" : "No hay imágenes"}
              </div>
            )}
          </div>

          {/* Thumbnails Container - Relative for absolute positioning of button */}
          <div className="relative w-full aspect-square">
            <div className="grid grid-cols-2 gap-2 h-full w-full">
              {thumbnailImages.slice(0, 4).map((img, index) => {
                const thumbnailIndex = index + 1; // Thumbnails start from index 1
                // Determine border radius based on position:
                // index 0: top-left (no radius)
                // index 1: top-right (top-right radius)
                // index 2: bottom-left (no radius)
                // index 3: bottom-right (bottom-right radius)
                const getBorderRadius = () => {
                  if (index === 1) return '0 8px 0 0'; // Top-right corner
                  if (index === 3) return '0 0 8px 0'; // Bottom-right corner
                  return '0';
                };
                
                return (
                  <div
                    key={index}
                    className="relative w-full h-full overflow-hidden bg-[#F9FAFB] dark:bg-[#111827] border-2 border-[#E5E7EB] dark:border-[#374151] cursor-pointer"
                    style={{ borderRadius: getBorderRadius() }}
                    onClick={() => {
                      setMainImageIndex(thumbnailIndex);
                      handleImageClick(thumbnailIndex);
                    }}
                  >
                    {isValidImage(thumbnailIndex) ? (
                      <img
                        src={img}
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: getBorderRadius() }}
                        onError={() => handleImageError(thumbnailIndex)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#6B7280] dark:text-[#9CA3AF]" style={{ borderRadius: getBorderRadius() }}>
                        Imagen no disponible
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Show All Photos Button - Overlaid on bottom-right */}
            {images.length > 4 && (
              <button 
                onClick={() => {
                  const allMedia = getAllMediaWithLabels();
                  setGalleryMedia(allMedia);
                  setIsGalleryOpen(true);
                }}
                className="absolute flex items-center justify-center gap-2 bg-[#D9E7FF] dark:bg-[#1E3A8A] rounded-full hover:bg-[#C7D9FF] dark:hover:bg-[#1E40AF] transition-colors z-10"
                style={{ 
                  width: '160px', 
                  height: '32px',
                  right: '16px',
                  bottom: '16px',
                  padding: '8px 12px',
                  gap: '8px'
                }}
              >
                <Images className="h-4 w-4 text-[#162EB7] dark:text-[#93C5FD] flex-shrink-0" />
                <span className="text-sm font-medium text-[#162EB7] dark:text-[#93C5FD] whitespace-nowrap">Ver todas las fotos</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Información de la propiedad - With sub-tabs */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Información de la propiedad</h2>
        {/* Sub-tabs */}
        <div className="bg-[#FAFAFA] dark:bg-[#111827] p-[1px] rounded-[18px] flex mx-auto mb-6 border border-[#E5E7EB] dark:border-[#374151] w-[500px]">
          <button
            onClick={() => setActivePropertySubTab("basic")}
            className={cn(
              "px-4 pt-[6px] pb-[6px] rounded-[18px] text-sm font-medium transition-all w-[250px]",
              activePropertySubTab === "basic"
                ? "bg-white dark:bg-[#1F2937] shadow-[0_0_16px_rgba(0,0,0,0.04)] text-[#212121] dark:text-[#F9FAFB]"
                : "bg-transparent text-[#212121] dark:text-[#F9FAFB]"
            )}
          >
            Características básicas
          </button>
          <button
            onClick={() => setActivePropertySubTab("building")}
            className={cn(
              "px-4 py-1.5 rounded-[18px] text-sm font-medium transition-all w-[250px]",
              activePropertySubTab === "building"
                ? "bg-white dark:bg-[#1F2937] shadow-[0_0_16px_rgba(0,0,0,0.04)] text-[#212121] dark:text-[#F9FAFB]"
                : "bg-transparent text-[#212121] dark:text-[#F9FAFB]"
            )}
          >
            Características edificio
          </button>
        </div>
        {/* Content based on active sub-tab */}
        {activePropertySubTab === "basic" ? (
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div className="flex items-center gap-3">
              <Ruler className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                {property?.square_meters ? `${property.square_meters} m² usables` : "No disponible"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Bed className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                {property?.bedrooms ? `${property.bedrooms} ${property.bedrooms === 1 ? 'habitación' : 'habitaciones'}` : "No disponible"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Bath className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                {property?.bathrooms ? `${property.bathrooms} ${property.bathrooms === 1 ? 'baño' : 'baños'}` : "No disponible"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                {property?.floor_number !== null && property?.floor_number !== undefined ? `Piso ${property.floor_number}º` : "Piso"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                {property?.garage || "No disponible"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Square className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                Terraza {property?.has_terrace === true ? "Sí" : property?.has_terrace === false ? "No" : "No disponible"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                Calefacción
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Wind className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                Aire Acondicionado
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div className="flex items-center gap-3">
              <Hammer className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
              <div>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Año construcción</p>
                <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                  {property?.construction_year ?? "No disponible"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Compass className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
              <div>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Orientación</p>
                <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                  {property?.orientation || "No disponible"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
              <div>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Ascensor</p>
                <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                  {property?.has_elevator === true ? "Sí" : property?.has_elevator === false ? "No" : "No disponible"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Widget 1: Rendimiento Financiero */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Rendimiento Financiero</h2>
        <FinancialPerformanceWidget property={localProperty} currentPhase={currentPhase} />
      </Card>

      {/* Widget 2: Métricas de Tiempo */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Métricas de Tiempo</h2>
        <TimeMetricsWidget property={localProperty} />
      </Card>

      {/* Block 4: Operations & Compliance - Split into Two Cards */}
      
      {/* Logística */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Logística</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1">Localización de Llaves</p>
            <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
              {property?.keys_location || "No disponible"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1">Administrador</p>
            <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
              {property?.admin_name || "No disponible"}
            </p>
          </div>
        </div>
      </Card>

      {/* Widget B: Estado Legal y Pagos - OCULTO */}
      {/* <Card className="bg-card rounded-lg border shadow-sm">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-lg font-semibold">Estado Legal y Pagos</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Badge
                variant={property?.community_fees_paid ? "default" : "destructive"}
                className={cn(
                  property?.community_fees_paid
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                )}
              >
                {property?.community_fees_paid ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <XIcon className="h-3 w-3 mr-1" />
                )}
                Pagos Comunidad
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={property?.taxes_paid ? "default" : "destructive"}
                className={cn(
                  property?.taxes_paid
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                )}
              >
                {property?.taxes_paid ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <XIcon className="h-3 w-3 mr-1" />
                )}
                Pagos IBI/Impuestos
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={property?.itv_passed ? "default" : "destructive"}
                className={cn(
                  property?.itv_passed
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                )}
              >
                {property?.itv_passed ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <XIcon className="h-3 w-3 mr-1" />
                )}
                Inspección (ITV/ITE)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Documentación */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Documentación</h2>
          <button className="text-sm text-[#2563EB] dark:text-[#3B82F6] font-medium hover:underline">
            Ver todo
          </button>
        </div>
        <div className="space-y-3">
          {/* Show first 3 documents */}
          {filteredDocs.legal.slice(0, 3).map((doc, idx) => (
            doc.url && (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg cursor-pointer transition-colors hover:bg-accent/50"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.tagName === 'BUTTON') {
                    return;
                  }
                  e.preventDefault();
                  e.stopPropagation();
                  setPreviewModal({
                    open: true,
                    url: doc.url!,
                    label: doc.name,
                  });
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">{doc.name}</p>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      {doc.url ? "PDF" : "No disponible"}
                    </p>
                  </div>
                </div>
                <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
              </div>
            )
          ))}
        </div>
      </Card>

      {/* Ubicación */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Ubicación</h2>
        <p className="text-sm text-[#2563EB] dark:text-[#3B82F6] mb-4 font-medium">
          {property?.address || "Dirección no disponible"}
        </p>
        <div className="w-full h-64 rounded-lg overflow-hidden relative border border-[#E5E7EB] dark:border-[#374151]">
          {property?.address && config.googleMaps.apiKey ? (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${config.googleMaps.apiKey}&q=${encodeURIComponent(property.address + (property.city ? `, ${property.city}` : ''))}&zoom=15`}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {!property?.address ? "Dirección no disponible" : "Google Maps API key no configurada"}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Full Documents Section (hidden, for reference) */}
      <Card className="bg-card rounded-lg border shadow-sm hidden">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-lg font-semibold">Documentos</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          {/* Search Bar + Filter Pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={documentSearch}
                onChange={(e) => setDocumentSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "legal", "insurance", "supplies"] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={documentFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDocumentFilter(filter)}
                  className="text-xs"
                >
                  {filter === "all" && "Todos"}
                  {filter === "legal" && "Legal"}
                  {filter === "insurance" && "Seguros"}
                  {filter === "supplies" && "Suministros"}
                </Button>
              ))}
            </div>
          </div>

          {/* Document Content */}
          <div className="space-y-6 pt-2">
            {/* Legal Documents */}
            {(documentFilter === "all" || documentFilter === "legal") && filteredDocs.legal.length > 0 && (
              <div>
                {documentFilter === "all" && (
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">LEGAL</h4>
                )}
                {documentFilter === "legal" && (
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Legal
                  </h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter-md lg:gap-gutter-lg xl:gap-gutter-xl">
                  {filteredDocs.legal.map((doc, idx) => (
                    <SmartDocumentField
                      key={idx}
                      label={doc.name}
                      value={doc.url}
                      onUpload={(file) => handleDocumentUpload(doc.name, file)}
                      onDelete={() => handleDocumentDelete(doc.name)}
                    />
                  ))}
                </div>
                {/* Renovation files - JSONB array field */}
                <SmartDocumentFieldArray
                  label="Documentos de la reforma"
                  value={filteredDocs.legalArrays.renovationFiles}
                  onUpload={(file) => handleDocumentUpload("Documentos de la reforma", file)}
                  onDelete={(fileUrl) => handleDocumentDelete("Documentos de la reforma", fileUrl)}
                />
              </div>
            )}

            {/* Insurance Documents */}
            {(documentFilter === "all" || documentFilter === "insurance") && filteredDocs.insurance.length > 0 && (
              <div>
                {documentFilter === "all" && (
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">SEGUROS</h4>
                )}
                {documentFilter === "insurance" && (
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Seguros
                  </h3>
                )}
                <div className="space-y-4">
                  {filteredDocs.insurance.map((doc, idx) => (
                    <div key={idx} className="space-y-2">
                      {doc.insuranceType ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter-md lg:gap-gutter-lg xl:gap-gutter-xl">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Seguro del Hogar</p>
                              <p className="text-sm font-medium">{doc.insuranceType}</p>
                            </div>
                            <SmartDocumentField
                              label={doc.name}
                              value={doc.url}
                              onUpload={(file) => handleDocumentUpload(doc.name, file)}
                              onDelete={() => handleDocumentDelete(doc.name)}
                            />
                          </div>
                        </>
                      ) : (
                        <SmartDocumentField
                          label={doc.name}
                          value={doc.url}
                          onUpload={(file) => handleDocumentUpload(doc.name, file)}
                          onDelete={() => handleDocumentDelete(doc.name)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supplies Documents */}
            {(documentFilter === "all" || documentFilter === "supplies") &&
              Object.keys(filteredDocs.supplies).length > 0 && (
                <div>
                  {documentFilter === "all" && (
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">SUMINISTROS</h4>
                  )}
                  {documentFilter === "supplies" && (
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Suministros
                    </h3>
                  )}
                  <div className="space-y-4">
                    {/* Electricity - ALWAYS show, even when NULL */}
                    {filteredDocs.supplies.electricity && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">Electricidad</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                          <SmartDocumentField
                            label="Contrato Electricidad"
                            value={filteredDocs.supplies.electricity.contract?.url || null}
                            onUpload={(file) => handleDocumentUpload("Contrato Electricidad", file)}
                            onDelete={() => handleDocumentDelete("Contrato Electricidad")}
                          />
                          <SmartDocumentField
                            label="Factura Electricidad"
                            value={filteredDocs.supplies.electricity.bill?.url || null}
                            onUpload={(file) => handleDocumentUpload("Factura Electricidad", file)}
                            onDelete={() => handleDocumentDelete("Factura Electricidad")}
                          />
                        </div>
                      </div>
                    )}

                    {/* Water - ALWAYS show, even when NULL */}
                    {filteredDocs.supplies.water && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Agua</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                          <SmartDocumentField
                            label="Contrato Agua"
                            value={filteredDocs.supplies.water.contract?.url || null}
                            onUpload={(file) => handleDocumentUpload("Contrato Agua", file)}
                            onDelete={() => handleDocumentDelete("Contrato Agua")}
                          />
                          <SmartDocumentField
                            label="Factura Agua"
                            value={filteredDocs.supplies.water.bill?.url || null}
                            onUpload={(file) => handleDocumentUpload("Factura Agua", file)}
                            onDelete={() => handleDocumentDelete("Factura Agua")}
                          />
                        </div>
                      </div>
                    )}

                    {/* Gas - ALWAYS show, even when NULL */}
                    {filteredDocs.supplies.gas && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium">Gas</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                          <SmartDocumentField
                            label="Contrato Gas"
                            value={filteredDocs.supplies.gas.contract?.url || null}
                            onUpload={(file) => handleDocumentUpload("Contrato Gas", file)}
                            onDelete={() => handleDocumentDelete("Contrato Gas")}
                          />
                          <SmartDocumentField
                            label="Factura Gas"
                            value={filteredDocs.supplies.gas.bill?.url || null}
                            onUpload={(file) => handleDocumentUpload("Factura Gas", file)}
                            onDelete={() => handleDocumentDelete("Factura Gas")}
                          />
                        </div>
                      </div>
                    )}

                    {/* Other Supplies - ALWAYS show, even when NULL */}
                    {filteredDocs.supplies.other && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Otros Suministros</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                          <SmartDocumentField
                            label="Contrato otros suministros"
                            value={filteredDocs.supplies.other.contract?.url || null}
                            onUpload={(file) => handleDocumentUpload("Contrato otros suministros", file)}
                            onDelete={() => handleDocumentDelete("Contrato otros suministros")}
                          />
                          <SmartDocumentField
                            label="Última factura otros suministros"
                            value={filteredDocs.supplies.other.bill?.url || null}
                            onUpload={(file) => handleDocumentUpload("Última factura otros suministros", file)}
                            onDelete={() => handleDocumentDelete("Última factura otros suministros")}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        media={galleryMedia}
        initialIndex={mainImageIndex}
        title="Galería de Imágenes"
      />

      {/* Document Preview Modal */}
      {previewModal && (
        <DocumentPreviewModal
          open={previewModal.open}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewModal(null);
            }
          }}
          documentUrl={previewModal.url}
          documentName={previewModal.label}
        />
      )}
    </div>
  );
}
