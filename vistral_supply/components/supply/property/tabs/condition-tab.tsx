"use client";

import { useState, useMemo, memo } from "react";
import { ChevronLeft, ChevronRight, Image } from "lucide-react";
import { PropertyWithUsers } from "@/lib/supply-property-supabase";
import { ChecklistData, ChecklistStatus } from "@/lib/supply-checklist-storage";
import { useI18n } from "@/lib/i18n";
import { getStorageFileUrl } from "@/lib/supply-storage-supabase";
import { cn } from "@/lib/utils";
import { ImageGalleryModal, GalleryMediaItem } from "@/components/supply/property/image-gallery-modal";

interface ConditionTabProps {
  property: PropertyWithUsers;
  checklist?: ChecklistData | null;
}

interface ImageCarouselProps {
  images: string[];
  sectionId: string;
}

function ImageCarousel({ images, sectionId }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-[340px] bg-[#F9FAFB] border border-[#D4D4D8] rounded-lg flex items-center justify-center">
        <span className="text-sm text-[#71717A]">No images available</span>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col justify-center items-center gap-4 w-full">
      <div className="relative w-full h-[340px] bg-[#F9FAFB] border border-[#D4D4D8] rounded-lg overflow-hidden shadow-[0px_0px_16px_rgba(0,0,0,0.04)]">
        <img
          src={images[currentIndex]}
          alt={`Section image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#D9E7FF] rounded-full flex items-center justify-center transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 text-[#162EB7]" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#D9E7FF] rounded-full flex items-center justify-center transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 text-[#162EB7]" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex flex-row justify-center items-center py-2 w-full">
          <span className="text-sm font-medium text-[#71717A] leading-5 tracking-[-0.5px]">
            {currentIndex + 1} of {images.length}
          </span>
        </div>
      )}
    </div>
  );
}

interface ConditionItemProps {
  name: string;
  status: ChecklistStatus | undefined;
  notes?: string;
  isLast?: boolean;
  sectionImages?: string[];
  sectionVideos?: string[];
  itemNotes?: string; // Notes for this specific item
  onImageClick?: () => void;
}

function ConditionItem({ name, status, notes, isLast = false, sectionImages = [], sectionVideos = [], itemNotes, onImageClick }: ConditionItemProps) {
  const { t } = useI18n();

  const getStatusConfig = (status: ChecklistStatus | undefined) => {
    switch (status) {
      case "buen_estado":
        return {
          label: t.checklist.buenEstado,
          bgColor: "bg-white",
          textColor: "text-[#212121]",
          borderColor: "border-[#D4D4D8]",
        };
      case "necesita_reparacion":
        return {
          label: t.checklist.necesitaReparacion,
          bgColor: "bg-[#FEE2E2]",
          textColor: "text-[#B91C1C]",
          borderColor: "",
        };
      case "necesita_reemplazo":
        return {
          label: t.checklist.necesitaReemplazo,
          bgColor: "bg-[#FEE2E2]",
          textColor: "text-[#B91C1C]",
          borderColor: "",
        };
      default:
        return {
          label: "Not set",
          bgColor: "bg-[#FEE2E2]",
          textColor: "text-[#B91C1C]",
          borderColor: "",
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const hasIssue = status === "necesita_reparacion" || status === "necesita_reemplazo" || !status;
  const hasMedia = (sectionImages && sectionImages.length > 0) || (sectionVideos && sectionVideos.length > 0);

  return (
    <div className="flex flex-col items-start pt-4 gap-4 w-full min-w-0">
      <div className="flex flex-row justify-between items-center w-full gap-2 min-w-0">
        <span className="text-base font-medium text-[#71717A] leading-6 tracking-[-0.7px] flex-1 min-w-0 truncate pr-2">{name}</span>
        <div className="flex flex-row items-start gap-2 flex-shrink-0">
          <span
            className={cn(
              "flex flex-row justify-center items-center px-2 py-1 rounded-md text-xs font-medium leading-4 tracking-[-0.2px] whitespace-nowrap",
              statusConfig.bgColor,
              statusConfig.textColor,
              statusConfig.borderColor && "border border-[#D4D4D8]"
            )}
          >
            {statusConfig.label}
          </span>
        </div>
      </div>
      {hasIssue && notes && (
        <div className="flex flex-row items-center gap-3 w-full pb-4">
          <p className="text-sm font-normal text-[#71717A] leading-5 tracking-[-0.5px] flex-1">{notes}</p>
          {hasMedia && onImageClick && (
            <button
              onClick={onImageClick}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0F4FF] transition-colors cursor-pointer"
              aria-label="View images and videos"
            >
              <div className="relative w-4 h-4">
                <Image className="w-4 h-4" style={{ color: '#162EB7' }} />
              </div>
            </button>
          )}
        </div>
      )}
      {!isLast && <div className="w-full h-0 border border-[#E4E4E7]" />}
    </div>
  );
}

function ConditionTabComponent({ property, checklist }: ConditionTabProps) {
  const { t } = useI18n();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState<GalleryMediaItem[]>([]);
  const [galleryTitle, setGalleryTitle] = useState<string>("");

  // Helper function to get image URL from file object
  const getImageUrl = (file: any): string | null => {
    if (file.url && typeof file.url === 'string' && file.url.trim() !== '') {
      return file.url;
    }
    if (file.path && typeof file.path === 'string' && file.path.trim() !== '') {
      const storageUrl = getStorageFileUrl(file.path);
      if (storageUrl && storageUrl.trim() !== '') {
        return storageUrl;
      }
    }
    if (file.data && typeof file.data === 'string' && file.data.trim() !== '') {
      return file.data;
    }
    return null;
  };

  // Get all images and videos for a section
  const getSectionMedia = (section: any): { images: string[]; videos: string[] } => {
    const images: string[] = [];
    const videos: string[] = [];

    // Get images and videos from uploadZones
    if (section.uploadZones && Array.isArray(section.uploadZones)) {
      section.uploadZones.forEach((zone: any) => {
        if (zone.photos && Array.isArray(zone.photos)) {
          zone.photos.forEach((file: any) => {
            const imageUrl = getImageUrl(file);
            if (imageUrl) images.push(imageUrl);
          });
        }
        if (zone.videos && Array.isArray(zone.videos)) {
          zone.videos.forEach((file: any) => {
            const videoUrl = getImageUrl(file);
            if (videoUrl) videos.push(videoUrl);
          });
        }
      });
    }

    // Get images and videos from dynamicItems
    if (section.dynamicItems && Array.isArray(section.dynamicItems)) {
      section.dynamicItems.forEach((item: any) => {
        if (item.uploadZone?.photos && Array.isArray(item.uploadZone.photos)) {
          item.uploadZone.photos.forEach((file: any) => {
            const imageUrl = getImageUrl(file);
            if (imageUrl) images.push(imageUrl);
          });
        }
        if (item.uploadZone?.videos && Array.isArray(item.uploadZone.videos)) {
          item.uploadZone.videos.forEach((file: any) => {
            const videoUrl = getImageUrl(file);
            if (videoUrl) videos.push(videoUrl);
          });
        }
      });
    }

    return { images, videos };
  };

  // Get all images for a section (backward compatibility)
  const getSectionImages = (section: any): string[] => {
    return getSectionMedia(section).images;
  };

  // Convert images and videos arrays to GalleryMediaItem array
  const mediaToGalleryMedia = (
    images: string[], 
    videos: string[], 
    sectionId: string, 
    sectionTitle: string,
    itemNotes?: string
  ): GalleryMediaItem[] => {
    const media: GalleryMediaItem[] = [];
    
    // Add images
    images.forEach((url) => {
      media.push({
        url,
        type: "image" as const,
        sectionId,
        sectionTitle,
        notes: itemNotes, // Add notes to all media items when opened from a specific item
      });
    });
    
    // Add videos
    videos.forEach((url) => {
      media.push({
        url,
        type: "video" as const,
        sectionId,
        sectionTitle,
        notes: itemNotes, // Add notes to all media items when opened from a specific item
      });
    });
    
    return media;
  };

  // Handle opening gallery for a section
  const handleOpenGallery = (
    images: string[], 
    videos: string[], 
    sectionId: string, 
    sectionTitle: string,
    itemNotes?: string
  ) => {
    const media = mediaToGalleryMedia(images, videos, sectionId, sectionTitle, itemNotes);
    setGalleryMedia(media);
    setGalleryTitle(sectionTitle);
    setIsGalleryOpen(true);
  };

  // Helper to normalize item IDs (e.g., "split-ac" -> "splitAc", "puerta-entrada" -> "puertaEntrada")
  const normalizeItemId = (itemId: string): string => {
    // Convert hyphenated IDs to camelCase for translation keys
    if (itemId.includes('-')) {
      const parts = itemId.split('-');
      return parts[0] + parts.slice(1).map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join('');
    }
    return itemId;
  };

  // Helper to normalize section IDs (e.g., "entrada-pasillos" -> "entradaPasillos")
  const normalizeSectionId = (sectionId: string): string => {
    // Convert hyphenated IDs to camelCase for translation keys
    if (sectionId.includes('-')) {
      return sectionId.split('-').map((part, index) => 
        index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
      ).join('');
    }
    return sectionId;
  };

  // Helper to get translation for a question/item
  const getTranslation = (sectionId: string, type: 'questions' | 'carpentryItems' | 'climatizationItems' | 'storageItems' | 'appliancesItems' | 'securityItems' | 'systemsItems', itemId: string): string => {
    // Normalize section ID to match translation keys (e.g., "entrada-pasillos" -> "entradaPasillos")
    const normalizedSectionId = normalizeSectionId(sectionId);
    const sectionTranslations = t.checklist.sections[normalizedSectionId as keyof typeof t.checklist.sections] as any;
    if (!sectionTranslations) return itemId;
    
    // Handle questions - they have a title property
    if (type === 'questions') {
      // Try with original ID first
      const question = sectionTranslations[itemId];
      if (question && typeof question === 'object' && question.title) {
        return question.title;
      }
      // Try with normalized ID (for hyphenated keys like "acabados-exteriores" -> "acabadosExteriores")
      const normalizedId = normalizeItemId(itemId);
      const normalizedQuestion = sectionTranslations[normalizedId];
      if (normalizedQuestion && typeof normalizedQuestion === 'object' && normalizedQuestion.title) {
        return normalizedQuestion.title;
      }
      // Special case: "puerta-entrada" is stored in carpinteria.puertaEntrada
      if (itemId === 'puerta-entrada' || normalizedId === 'puertaEntrada') {
        const carpinteria = sectionTranslations.carpinteria;
        if (carpinteria && carpinteria.puertaEntrada && typeof carpinteria.puertaEntrada === 'string') {
          return carpinteria.puertaEntrada;
        }
      }
      return itemId;
    }
    
    // Handle carpentry items - they're in carpinteria.items or directly in carpinteria
    if (type === 'carpentryItems') {
      const carpinteria = sectionTranslations.carpinteria;
      if (carpinteria) {
        // Check in carpinteria.items first
        if (carpinteria.items) {
          // Try with original ID first
          if (carpinteria.items[itemId]) {
            return carpinteria.items[itemId];
          }
          // Try with normalized ID (for hyphenated keys)
          const normalizedId = normalizeItemId(itemId);
          if (carpinteria.items[normalizedId]) {
            return carpinteria.items[normalizedId];
          }
        }
        // Check directly in carpinteria (for items like puertaEntrada)
        if (carpinteria[itemId] && typeof carpinteria[itemId] === 'string') {
          return carpinteria[itemId];
        }
        const normalizedId = normalizeItemId(itemId);
        if (carpinteria[normalizedId] && typeof carpinteria[normalizedId] === 'string') {
          return carpinteria[normalizedId];
        }
      }
      // Fallback to direct items if available
      if (sectionTranslations.items && sectionTranslations.items[itemId]) {
        return sectionTranslations.items[itemId];
      }
      return itemId;
    }
    
    // Handle climatization items - they're in climatizacion.items
    if (type === 'climatizationItems') {
      const climatizacion = sectionTranslations.climatizacion;
      if (climatizacion && climatizacion.items) {
        // Try with original ID first
        if (climatizacion.items[itemId]) {
          return climatizacion.items[itemId];
        }
        // Try with normalized ID (for hyphenated keys like "split-ac" -> "splitAc")
        const normalizedId = normalizeItemId(itemId);
        if (climatizacion.items[normalizedId]) {
          return climatizacion.items[normalizedId];
        }
      }
      return itemId;
    }
    
    // Handle storage items (cocina) - they're in almacenamiento.items
    if (type === 'storageItems') {
      const almacenamiento = sectionTranslations.almacenamiento;
      if (almacenamiento && almacenamiento.items) {
        // Try with original ID first
        if (almacenamiento.items[itemId]) {
          return almacenamiento.items[itemId];
        }
        // Try with normalized ID (for hyphenated keys)
        const normalizedId = normalizeItemId(itemId);
        if (almacenamiento.items[normalizedId]) {
          return almacenamiento.items[normalizedId];
        }
      }
      return itemId;
    }
    
    // Handle appliances items (cocina) - they're in electrodomesticos.items
    if (type === 'appliancesItems') {
      const electrodomesticos = sectionTranslations.electrodomesticos;
      if (electrodomesticos && electrodomesticos.items) {
        // Try with original ID first
        if (electrodomesticos.items[itemId]) {
          return electrodomesticos.items[itemId];
        }
        // Try with normalized ID (for hyphenated keys like "placa-vitro-induccion" -> "placaVitroInduccion")
        const normalizedId = normalizeItemId(itemId);
        if (electrodomesticos.items[normalizedId]) {
          return electrodomesticos.items[normalizedId];
        }
      }
      return itemId;
    }
    
    // Handle security items (exteriores) - they're in seguridad.items
    if (type === 'securityItems') {
      const seguridad = sectionTranslations.seguridad;
      if (seguridad && seguridad.items) {
        // Try with original ID first
        if (seguridad.items[itemId]) {
          return seguridad.items[itemId];
        }
        // Try with normalized ID (for hyphenated keys)
        const normalizedId = normalizeItemId(itemId);
        if (seguridad.items[normalizedId]) {
          return seguridad.items[normalizedId];
        }
      }
      return itemId;
    }
    
    // Handle systems items (exteriores) - they're in sistemas.items
    if (type === 'systemsItems') {
      const sistemas = sectionTranslations.sistemas;
      if (sistemas && sistemas.items) {
        // Try with original ID first
        if (sistemas.items[itemId]) {
          return sistemas.items[itemId];
        }
        // Try with normalized ID (for hyphenated keys like "tendedero-exterior" -> "tendederoExterior")
        const normalizedId = normalizeItemId(itemId);
        if (sistemas.items[normalizedId]) {
          return sistemas.items[normalizedId];
        }
      }
      return itemId;
    }
    
    return itemId;
  };

  // Get condition items for a section
  const getSectionConditionItems = (section: any, sectionId: string): Array<{ name: string; status: ChecklistStatus | undefined; notes?: string }> => {
    const items: Array<{ name: string; status: ChecklistStatus | undefined; notes?: string }> = [];

    // Get items from questions
    if (section.questions && Array.isArray(section.questions)) {
      section.questions.forEach((question: any) => {
        const questionLabel = getTranslation(sectionId, 'questions', question.id);
        items.push({
          name: questionLabel,
          status: question.status,
          notes: question.notes,
        });
      });
    }

    // Get items from carpentry items
    if (section.carpentryItems && Array.isArray(section.carpentryItems)) {
      section.carpentryItems.forEach((item: any) => {
        if (item.cantidad === 0) return; // Skip items with cantidad 0
        
        if (item.cantidad === 1) {
          const itemLabel = getTranslation(sectionId, 'carpentryItems', item.id);
          items.push({
            name: itemLabel,
            status: item.estado,
            notes: item.notes,
          });
        } else if (item.cantidad > 1 && item.units) {
          item.units.forEach((unit: any, index: number) => {
            const baseLabel = getTranslation(sectionId, 'carpentryItems', item.id);
            const itemLabel = `${baseLabel} ${index + 1}`;
            items.push({
              name: itemLabel,
              status: unit.estado,
              notes: unit.notes,
            });
          });
        }
      });
    }

    // Get items from climatization items
    if (section.climatizationItems && Array.isArray(section.climatizationItems)) {
      section.climatizationItems.forEach((item: any) => {
        if (item.cantidad === 0) return; // Skip items with cantidad 0
        
        if (item.cantidad === 1) {
          const itemLabel = getTranslation(sectionId, 'climatizationItems', item.id);
          items.push({
            name: itemLabel,
            status: item.estado,
            notes: item.notes,
          });
        } else if (item.cantidad > 1 && item.units) {
          item.units.forEach((unit: any, index: number) => {
            const baseLabel = getTranslation(sectionId, 'climatizationItems', item.id);
            const itemLabel = `${baseLabel} ${index + 1}`;
            items.push({
              name: itemLabel,
              status: unit.estado,
              notes: unit.notes,
            });
          });
        }
      });
    }

    // Get items from storage items (cocina)
    if (section.storageItems && Array.isArray(section.storageItems)) {
      section.storageItems.forEach((item: any) => {
        if (item.cantidad === 0) return;
        
        if (item.cantidad === 1) {
          const itemLabel = getTranslation(sectionId, 'storageItems', item.id);
          items.push({
            name: itemLabel,
            status: item.estado,
            notes: item.notes,
          });
        } else if (item.cantidad > 1 && item.units) {
          item.units.forEach((unit: any, index: number) => {
            const baseLabel = getTranslation(sectionId, 'storageItems', item.id);
            const itemLabel = `${baseLabel} ${index + 1}`;
            items.push({
              name: itemLabel,
              status: unit.estado,
              notes: unit.notes,
            });
          });
        }
      });
    }

    // Get items from appliances items (cocina)
    if (section.appliancesItems && Array.isArray(section.appliancesItems)) {
      section.appliancesItems.forEach((item: any) => {
        if (item.cantidad === 0) return;
        
        if (item.cantidad === 1) {
          const itemLabel = getTranslation(sectionId, 'appliancesItems', item.id);
          items.push({
            name: itemLabel,
            status: item.estado,
            notes: item.notes,
          });
        } else if (item.cantidad > 1 && item.units) {
          item.units.forEach((unit: any, index: number) => {
            const baseLabel = getTranslation(sectionId, 'appliancesItems', item.id);
            const itemLabel = `${baseLabel} ${index + 1}`;
            items.push({
              name: itemLabel,
              status: unit.estado,
              notes: unit.notes,
            });
          });
        }
      });
    }

    // Get items from security items (exteriores)
    if (section.securityItems && Array.isArray(section.securityItems)) {
      section.securityItems.forEach((item: any) => {
        if (item.cantidad === 0) return;
        
        if (item.cantidad === 1) {
          const itemLabel = getTranslation(sectionId, 'securityItems', item.id);
          items.push({
            name: itemLabel,
            status: item.estado,
            notes: item.notes,
          });
        } else if (item.cantidad > 1 && item.units) {
          item.units.forEach((unit: any, index: number) => {
            const baseLabel = getTranslation(sectionId, 'securityItems', item.id);
            const itemLabel = `${baseLabel} ${index + 1}`;
            items.push({
              name: itemLabel,
              status: unit.estado,
              notes: unit.notes,
            });
          });
        }
      });
    }

    // Get items from systems items (exteriores)
    if (section.systemsItems && Array.isArray(section.systemsItems)) {
      section.systemsItems.forEach((item: any) => {
        if (item.cantidad === 0) return;
        
        if (item.cantidad === 1) {
          const itemLabel = getTranslation(sectionId, 'systemsItems', item.id);
          items.push({
            name: itemLabel,
            status: item.estado,
            notes: item.notes,
          });
        } else if (item.cantidad > 1 && item.units) {
          item.units.forEach((unit: any, index: number) => {
            const baseLabel = getTranslation(sectionId, 'systemsItems', item.id);
            const itemLabel = `${baseLabel} ${index + 1}`;
            items.push({
              name: itemLabel,
              status: unit.estado,
              notes: unit.notes,
            });
          });
        }
      });
    }

    return items;
  };

  // Section configuration
  const sectionsConfig = useMemo(() => {
    if (!checklist?.sections) return [];

    const config = [
      {
        id: "entorno-zonas-comunes",
        title: t.checklist.sections.entornoZonasComunes.title,
        section: checklist.sections["entorno-zonas-comunes"],
      },
      {
        id: "entrada-pasillos",
        title: t.checklist.sections.entradaPasillos.title,
        section: checklist.sections["entrada-pasillos"],
      },
      {
        id: "habitaciones",
        title: t.checklist.sections.habitaciones.title,
        section: checklist.sections["habitaciones"],
        isDynamic: true,
      },
      {
        id: "salon",
        title: t.checklist.sections.salon.title,
        section: checklist.sections["salon"],
      },
      {
        id: "banos",
        title: t.checklist.sections.banos.title,
        section: checklist.sections["banos"],
        isDynamic: true,
      },
      {
        id: "cocina",
        title: t.checklist.sections.cocina.title,
        section: checklist.sections["cocina"],
      },
      {
        id: "exteriores",
        title: t.checklist.sections.exteriores.title,
        section: checklist.sections["exteriores"],
      },
    ];

    return config.filter((configItem) => configItem.section);
  }, [checklist, t]);

  if (!checklist || !checklist.sections) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No checklist information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {sectionsConfig.map(({ id, title, section, isDynamic }) => {
        const { images, videos } = getSectionMedia(section);
        const conditionItems = getSectionConditionItems(section, id);

        // Handle dynamic sections (habitaciones, banos)
        if (isDynamic && section.dynamicItems && section.dynamicItems.length > 0) {
          return section.dynamicItems.map((item: any, index: number) => {
            const itemImages = item.uploadZone?.photos
              ? item.uploadZone.photos.map((file: any) => getImageUrl(file)).filter(Boolean)
              : [];
            const itemVideos = item.uploadZone?.videos
              ? item.uploadZone.videos.map((file: any) => getImageUrl(file)).filter(Boolean)
              : [];
            
            // Get condition items from the dynamic item
            const itemConditionItems: Array<{ name: string; status: ChecklistStatus | undefined; notes?: string }> = [];
            
            // Questions from dynamic item
            if (item.questions && Array.isArray(item.questions)) {
              item.questions.forEach((question: any) => {
                const questionLabel = getTranslation(id, 'questions', question.id);
                itemConditionItems.push({
                  name: questionLabel,
                  status: question.status,
                  notes: question.notes,
                });
              });
            }
            
            // Carpentry items from dynamic item
            if (item.carpentryItems && Array.isArray(item.carpentryItems)) {
              item.carpentryItems.forEach((carpentryItem: any) => {
                if (carpentryItem.cantidad === 0) return;
                
                if (carpentryItem.cantidad === 1) {
                  const itemLabel = getTranslation(id, 'carpentryItems', carpentryItem.id);
                  itemConditionItems.push({
                    name: itemLabel,
                    status: carpentryItem.estado,
                    notes: carpentryItem.notes,
                  });
                } else if (carpentryItem.cantidad > 1 && carpentryItem.units) {
                  carpentryItem.units.forEach((unit: any, unitIndex: number) => {
                    const baseLabel = getTranslation(id, 'carpentryItems', carpentryItem.id);
                    const itemLabel = `${baseLabel} ${unitIndex + 1}`;
                    itemConditionItems.push({
                      name: itemLabel,
                      status: unit.estado,
                      notes: unit.notes,
                    });
                  });
                }
              });
            }
            
            // Climatization items from dynamic item
            if (item.climatizationItems && Array.isArray(item.climatizationItems)) {
              item.climatizationItems.forEach((climatizationItem: any) => {
                if (climatizationItem.cantidad === 0) return;
                
                if (climatizationItem.cantidad === 1) {
                  const itemLabel = getTranslation(id, 'climatizationItems', climatizationItem.id);
                  itemConditionItems.push({
                    name: itemLabel,
                    status: climatizationItem.estado,
                    notes: climatizationItem.notes,
                  });
                } else if (climatizationItem.cantidad > 1 && climatizationItem.units) {
                  climatizationItem.units.forEach((unit: any, unitIndex: number) => {
                    const baseLabel = getTranslation(id, 'climatizationItems', climatizationItem.id);
                    const itemLabel = `${baseLabel} ${unitIndex + 1}`;
                    itemConditionItems.push({
                      name: itemLabel,
                      status: unit.estado,
                      notes: unit.notes,
                    });
                  });
                }
              });
            }

            const bedroomTitle = id === "habitaciones" 
              ? `${t.checklist.sections.habitaciones.bedroom} ${index + 1}`
              : `${t.checklist.sections.banos.bathroom} ${index + 1}`;

            return (
              <div key={`${id}-${index}`} className="bg-white rounded-lg border border-[#E4E4E7] p-6 shadow-sm flex flex-col gap-6 box-border w-full max-w-[800px]">
                <div className="flex flex-row items-start gap-3 w-full flex-none">
                  <div className="flex flex-col items-start gap-1 flex-1">
                    <h2 className="text-2xl font-medium text-[#212121] leading-8 tracking-[-1.5px]">
                      {bedroomTitle}
                    </h2>
                  </div>
                  {(itemImages.length > 0 || itemVideos.length > 0) && (
                    <button 
                      onClick={() => handleOpenGallery(itemImages, itemVideos, `${id}-${index}`, bedroomTitle)}
                      className="flex flex-row justify-center items-center px-3 py-2 rounded-full text-base font-medium text-[#162EB7] leading-6 tracking-[-0.7px] flex-none hover:bg-[#F0F4FF] transition-colors"
                    >
                      See all images
                    </button>
                  )}
                </div>
                <div className="flex flex-row items-start gap-6 w-full">
                  <div className="flex flex-col justify-center items-center flex-1 min-w-0 max-w-[352px] flex-shrink-0">
                    <ImageCarousel images={itemImages} sectionId={`${id}-${index}`} />
                  </div>
                  <div className="w-px h-auto border-l border-[#E4E4E7] flex-none self-stretch" />
                  <div className="flex flex-col items-start flex-1 min-w-0 max-w-[352px] overflow-x-hidden">
                    {itemConditionItems.length > 0 ? (
                      itemConditionItems.map((conditionItem, idx) => (
                        <ConditionItem 
                          key={idx} 
                          {...conditionItem} 
                          isLast={idx === itemConditionItems.length - 1}
                          sectionImages={itemImages}
                          sectionVideos={itemVideos}
                          itemNotes={conditionItem.notes}
                          onImageClick={() => handleOpenGallery(itemImages, itemVideos, `${id}-${index}`, bedroomTitle, conditionItem.notes)}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-[#71717A] py-4">No condition information available</p>
                    )}
                  </div>
                </div>
              </div>
            );
          });
        }

        return (
          <div key={id} className="bg-white rounded-lg border border-[#E4E4E7] p-6 shadow-sm flex flex-col gap-6 box-border w-full max-w-[800px]">
            <div className="flex flex-row items-start gap-3 w-full flex-none">
              <div className="flex flex-col items-start gap-1 flex-1">
                <h2 className="text-2xl font-medium text-[#212121] leading-8 tracking-[-1.5px]">{title}</h2>
              </div>
              {(images.length > 0 || videos.length > 0) && (
                <button 
                  onClick={() => handleOpenGallery(images, videos, id, title)}
                  className="flex flex-row justify-center items-center px-3 py-2 rounded-full text-base font-medium text-[#162EB7] leading-6 tracking-[-0.7px] flex-none hover:bg-[#F0F4FF] transition-colors"
                >
                  See all images
                </button>
              )}
            </div>
            <div className="flex flex-row items-start gap-6 w-full">
              <div className="flex flex-col justify-center items-center flex-1 min-w-0 max-w-[352px] flex-shrink-0">
                <ImageCarousel images={images} sectionId={id} />
              </div>
              <div className="w-px h-auto border-l border-[#E4E4E7] flex-none self-stretch" />
              <div className="flex flex-col items-start flex-1 min-w-0 max-w-[352px] overflow-x-hidden">
                {conditionItems.length > 0 ? (
                  conditionItems.map((item, idx) => (
                    <ConditionItem 
                      key={idx} 
                      {...item} 
                      isLast={idx === conditionItems.length - 1}
                      sectionImages={images}
                      sectionVideos={videos}
                      itemNotes={item.notes}
                      onImageClick={() => handleOpenGallery(images, videos, id, title, item.notes)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-[#71717A] py-4">No condition information available</p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        media={galleryMedia}
        initialIndex={0}
        title={galleryTitle}
      />
    </div>
  );
}

export const ConditionTab = memo(ConditionTabComponent);
