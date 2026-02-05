"use client";

import { PropertyWithUsers } from "@/lib/supply-property-supabase";
import { useI18n } from "@/lib/i18n";
import { Check, X, Home, Ruler, Bed, Bath, Car, Flame, Snowflake, ArrowUpDown, Eye, FileText, Compass, Download, ExternalLink, Euro, Calendar, Building2, MapPin } from "lucide-react";
import { getStorageFileUrl } from "@/lib/supply-storage-supabase";
import { ChecklistData } from "@/lib/supply-checklist-storage";
import { useState, memo } from "react";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config/environment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageGalleryModal, GalleryMediaItem } from "@/components/supply/property/image-gallery-modal";

interface OverviewTabProps {
  property: PropertyWithUsers;
  checklist?: ChecklistData | null;
}

function OverviewTabComponent({ property, checklist }: OverviewTabProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'basic' | 'building'>('basic');
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; name: string; type?: string } | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState<GalleryMediaItem[]>([]);

  // Helper function to add cache busting to image URLs
  const addCacheBusting = (url: string): string => {
    if (!url) return url;
    // Use checklist updatedAt timestamp for cache busting
    const cacheParam = checklist?.updatedAt 
      ? new Date(checklist.updatedAt).getTime() 
      : Date.now();
    
    // Check if URL already has query parameters
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${cacheParam}`;
  };

  // Helper function to get image URL from file object
  const getImageUrl = (file: any): string | null => {
    let imageUrl: string | null = null;
    
    // Prioritize url if it's a valid non-empty string
    if (file.url && typeof file.url === 'string' && file.url.trim() !== '') {
      imageUrl = file.url;
    }
    // If path exists, generate URL from storage
    else if (file.path && typeof file.path === 'string' && file.path.trim() !== '') {
      const storageUrl = getStorageFileUrl(file.path);
      if (storageUrl && storageUrl.trim() !== '') {
        imageUrl = storageUrl;
      }
    }
    // Fallback to base64 data (no cache busting needed for data URLs)
    else if (file.data && typeof file.data === 'string' && file.data.trim() !== '') {
      return file.data;
    }
    
    // Add cache busting to URLs (but not to data URLs)
    if (imageUrl && !imageUrl.startsWith('data:')) {
      return addCacheBusting(imageUrl);
    }
    
    return imageUrl;
  };

  // Helper to get translation for a question/item
  const getTranslation = (sectionId: string, type: 'questions' | 'carpentryItems' | 'climatizationItems' | 'storageItems' | 'appliancesItems' | 'securityItems' | 'systemsItems', itemId: string): string => {
    const normalizedSectionId = sectionId.includes('-') 
      ? sectionId.split('-').map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('')
      : sectionId;
    
    const sectionTranslations = t.checklist.sections[normalizedSectionId as keyof typeof t.checklist.sections] as any;
    if (!sectionTranslations) return itemId;
    
    if (type === 'questions') {
      const question = sectionTranslations[itemId];
      if (question && typeof question === 'object' && question.title) return question.title;
      const normalizedId = itemId.includes('-') 
        ? itemId.split('-').map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('')
        : itemId;
      const normalizedQuestion = sectionTranslations[normalizedId];
      if (normalizedQuestion && typeof normalizedQuestion === 'object' && normalizedQuestion.title) {
        return normalizedQuestion.title;
      }
      return itemId;
    }
    
    if (type === 'carpentryItems') {
      const carpinteria = sectionTranslations.carpinteria;
      if (carpinteria?.items?.[itemId]) return carpinteria.items[itemId];
      const normalizedId = itemId.includes('-') 
        ? itemId.split('-').map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('')
        : itemId;
      if (carpinteria?.items?.[normalizedId]) return carpinteria.items[normalizedId];
      return itemId;
    }
    
    if (type === 'climatizationItems') {
      const climatizacion = sectionTranslations.climatizacion;
      if (climatizacion?.items?.[itemId]) return climatizacion.items[itemId];
      const normalizedId = itemId.includes('-') 
        ? itemId.split('-').map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('')
        : itemId;
      if (climatizacion?.items?.[normalizedId]) return climatizacion.items[normalizedId];
      return itemId;
    }
    
    return itemId;
  };

  // Get section title from translations
  const getSectionTitle = (sectionId: string): string => {
    const normalizedSectionId = sectionId.includes('-') 
      ? sectionId.split('-').map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('')
      : sectionId;
    
    const sectionTranslations = t.checklist.sections[normalizedSectionId as keyof typeof t.checklist.sections] as any;
    return sectionTranslations?.title || sectionId;
  };

  // Get all images and videos with labels from checklist
  const getAllMediaWithLabels = (): GalleryMediaItem[] => {
    const media: GalleryMediaItem[] = [];
    
    if (checklist?.sections) {
      Object.entries(checklist.sections).forEach(([sectionId, section]: [string, any]) => {
        const sectionTitle = getSectionTitle(sectionId);
        
        // Get images from uploadZones with zone titles as labels
        if (section.uploadZones && Array.isArray(section.uploadZones)) {
          section.uploadZones.forEach((zone: any) => {
            const zoneLabel = zone.id ? getTranslation(sectionId, 'questions', zone.id) : undefined;
            
            if (zone.photos && Array.isArray(zone.photos)) {
              zone.photos.forEach((file: any) => {
                const imageUrl = getImageUrl(file);
                if (imageUrl) {
                  media.push({
                    url: imageUrl,
                    type: "image",
                    label: zoneLabel,
                    name: file.name,
                    sectionId,
                    sectionTitle,
                  });
                }
              });
            }
            
            if (zone.videos && Array.isArray(zone.videos)) {
              zone.videos.forEach((file: any) => {
                const videoUrl = getImageUrl(file);
                if (videoUrl) {
                  media.push({
                    url: videoUrl,
                    type: "video",
                    label: zoneLabel,
                    name: file.name,
                    sectionId,
                    sectionTitle,
                  });
                }
              });
            }
          });
        }
        
        // Get images from questions
        if (section.questions && Array.isArray(section.questions)) {
          section.questions.forEach((question: any) => {
            const questionLabel = getTranslation(sectionId, 'questions', question.id);
            const hasBadStatus = question.status === "necesita_reparacion" || question.status === "necesita_reemplazo";
            
            if (question.photos && Array.isArray(question.photos)) {
              question.photos.forEach((file: any) => {
                const imageUrl = getImageUrl(file);
                if (imageUrl) {
                  media.push({
                    url: imageUrl,
                    type: "image",
                    label: questionLabel,
                    name: file.name,
                    sectionId,
                    sectionTitle,
                    notes: hasBadStatus ? question.notes : undefined,
                    status: question.status,
                  });
                }
              });
            }
          });
        }
        
        // Get images from carpentry items
        if (section.carpentryItems && Array.isArray(section.carpentryItems)) {
          section.carpentryItems.forEach((item: any) => {
            const itemLabel = getTranslation(sectionId, 'carpentryItems', item.id);
            const hasBadStatus = item.estado === "necesita_reparacion" || item.estado === "necesita_reemplazo";
            
            if (item.photos && Array.isArray(item.photos)) {
              item.photos.forEach((file: any) => {
                const imageUrl = getImageUrl(file);
                if (imageUrl) {
                  media.push({
                    url: imageUrl,
                    type: "image",
                    label: itemLabel,
                    name: file.name,
                    sectionId,
                    sectionTitle,
                    notes: hasBadStatus ? item.notes : undefined,
                    status: item.estado,
                  });
                }
              });
            }
            
            if (item.units && Array.isArray(item.units)) {
              item.units.forEach((unit: any) => {
                const unitHasBadStatus = unit.estado === "necesita_reparacion" || unit.estado === "necesita_reemplazo";
                if (unit.photos && Array.isArray(unit.photos)) {
                  unit.photos.forEach((file: any) => {
                    const imageUrl = getImageUrl(file);
                    if (imageUrl) {
                      media.push({
                        url: imageUrl,
                        type: "image",
                        label: itemLabel,
                        name: file.name,
                        sectionId,
                        sectionTitle,
                        notes: unitHasBadStatus ? unit.notes : undefined,
                        status: unit.estado,
                      });
                    }
                  });
                }
              });
            }
          });
        }
        
        // Get images from climatization items
        if (section.climatizationItems && Array.isArray(section.climatizationItems)) {
          section.climatizationItems.forEach((item: any) => {
            const itemLabel = getTranslation(sectionId, 'climatizationItems', item.id);
            const hasBadStatus = item.estado === "necesita_reparacion" || item.estado === "necesita_reemplazo";
            
            if (item.photos && Array.isArray(item.photos)) {
              item.photos.forEach((file: any) => {
                const imageUrl = getImageUrl(file);
                if (imageUrl) {
                  media.push({
                    url: imageUrl,
                    type: "image",
                    label: itemLabel,
                    name: file.name,
                    sectionId,
                    sectionTitle,
                    notes: hasBadStatus ? item.notes : undefined,
                    status: item.estado,
                  });
                }
              });
            }
            
            if (item.units && Array.isArray(item.units)) {
              item.units.forEach((unit: any) => {
                const unitHasBadStatus = unit.estado === "necesita_reparacion" || unit.estado === "necesita_reemplazo";
                if (unit.photos && Array.isArray(unit.photos)) {
                  unit.photos.forEach((file: any) => {
                    const imageUrl = getImageUrl(file);
                    if (imageUrl) {
                      media.push({
                        url: imageUrl,
                        type: "image",
                        label: itemLabel,
                        name: file.name,
                        sectionId,
                        sectionTitle,
                        notes: unitHasBadStatus ? unit.notes : undefined,
                        status: unit.estado,
                      });
                    }
                  });
                }
              });
            }
          });
        }
        
        // Get images from dynamicItems (habitaciones, banos)
        if (section.dynamicItems && Array.isArray(section.dynamicItems)) {
          section.dynamicItems.forEach((item: any, index: number) => {
            const itemLabel = `${sectionId === 'habitaciones' ? 'Room' : 'Bathroom'} ${index + 1}`;
            
            if (item.uploadZone?.photos && Array.isArray(item.uploadZone.photos)) {
              item.uploadZone.photos.forEach((file: any) => {
                const imageUrl = getImageUrl(file);
                if (imageUrl) {
                  media.push({
                    url: imageUrl,
                    type: "image",
                    label: itemLabel,
                    name: file.name,
                    sectionId,
                    sectionTitle,
                  });
                }
              });
            }
            
            if (item.uploadZone?.videos && Array.isArray(item.uploadZone.videos)) {
              item.uploadZone.videos.forEach((file: any) => {
                const videoUrl = getImageUrl(file);
                if (videoUrl) {
                  media.push({
                    url: videoUrl,
                    type: "video",
                    label: itemLabel,
                    name: file.name,
                    sectionId,
                    sectionTitle,
                  });
                }
              });
            }
          });
        }
        
        // Get images from security items (exteriores)
        if (section.securityItems && Array.isArray(section.securityItems)) {
          section.securityItems.forEach((item: any) => {
            const itemLabel = getTranslation(sectionId, 'securityItems', item.id);
            const hasBadStatus = item.estado === "necesita_reparacion" || item.estado === "necesita_reemplazo";
            
            if (item.photos && Array.isArray(item.photos)) {
              item.photos.forEach((file: any) => {
                const imageUrl = getImageUrl(file);
                if (imageUrl) {
                  media.push({
                    url: imageUrl,
                    type: "image",
                    label: itemLabel,
                    name: file.name,
                    sectionId,
                    sectionTitle,
                    notes: hasBadStatus ? item.notes : undefined,
                    status: item.estado,
                  });
                }
              });
            }
            
            if (item.units && Array.isArray(item.units)) {
              item.units.forEach((unit: any) => {
                const unitHasBadStatus = unit.estado === "necesita_reparacion" || unit.estado === "necesita_reemplazo";
                if (unit.photos && Array.isArray(unit.photos)) {
                  unit.photos.forEach((file: any) => {
                    const imageUrl = getImageUrl(file);
                    if (imageUrl) {
                      media.push({
                        url: imageUrl,
                        type: "image",
                        label: itemLabel,
                        name: file.name,
                        sectionId,
                        sectionTitle,
                        notes: unitHasBadStatus ? unit.notes : undefined,
                        status: unit.estado,
                      });
                    }
                  });
                }
              });
            }
          });
        }
        
        // Get images from systems items (exteriores)
        if (section.systemsItems && Array.isArray(section.systemsItems)) {
          section.systemsItems.forEach((item: any) => {
            const itemLabel = getTranslation(sectionId, 'systemsItems', item.id);
            const hasBadStatus = item.estado === "necesita_reparacion" || item.estado === "necesita_reemplazo";
            
            if (item.photos && Array.isArray(item.photos)) {
              item.photos.forEach((file: any) => {
                const imageUrl = getImageUrl(file);
                if (imageUrl) {
                  media.push({
                    url: imageUrl,
                    type: "image",
                    label: itemLabel,
                    name: file.name,
                    sectionId,
                    sectionTitle,
                    notes: hasBadStatus ? item.notes : undefined,
                    status: item.estado,
                  });
                }
              });
            }
            
            if (item.units && Array.isArray(item.units)) {
              item.units.forEach((unit: any) => {
                const unitHasBadStatus = unit.estado === "necesita_reparacion" || unit.estado === "necesita_reemplazo";
                if (unit.photos && Array.isArray(unit.photos)) {
                  unit.photos.forEach((file: any) => {
                    const imageUrl = getImageUrl(file);
                    if (imageUrl) {
                      media.push({
                        url: imageUrl,
                        type: "image",
                        label: itemLabel,
                        name: file.name,
                        sectionId,
                        sectionTitle,
                        notes: unitHasBadStatus ? unit.notes : undefined,
                        status: unit.estado,
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    // Get images from documentation
    if (property.data?.notaSimpleRegistro && Array.isArray(property.data.notaSimpleRegistro)) {
      property.data.notaSimpleRegistro.forEach((file: any) => {
        if (file.type?.startsWith("image/")) {
          const imageUrl = getImageUrl(file);
          if (imageUrl) {
            media.push({
              url: imageUrl,
              type: "image",
              label: "Documentation",
              name: file.name,
            });
          }
        }
      });
    }

    if (property.data?.certificadoEnergetico && Array.isArray(property.data.certificadoEnergetico)) {
      property.data.certificadoEnergetico.forEach((file: any) => {
        if (file.type?.startsWith("image/")) {
          const imageUrl = getImageUrl(file);
          if (imageUrl) {
            media.push({
              url: imageUrl,
              type: "image",
              label: "Documentation",
              name: file.name,
            });
          }
        }
      });
    }

    return media;
  };

  // Get all images from checklist and documentation (for thumbnail display)
  const getAllImages = (): string[] => {
    const media = getAllMediaWithLabels();
    return media.filter(m => m.type === "image").map(m => m.url);
  };

  const images = getAllImages();
  const mainImage = images[0] || null; // Always show the first image (facade)
  const thumbnailImages = images.slice(1, 5); // Show images 2-5 as thumbnails
  
  // Handle image loading errors
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };
  
  const isValidImage = (index: number) => {
    return !imageErrors.has(index) && images[index];
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get documents
  const getDocuments = () => {
    const docs: Array<{ name: string; size: number; url?: string; path?: string; type?: string }> = [];
    
    if (property.data?.notaSimpleRegistro && Array.isArray(property.data.notaSimpleRegistro)) {
      property.data.notaSimpleRegistro.forEach((file: any) => {
        if (file.type === "application/pdf" || file.name?.endsWith('.pdf')) {
          docs.push({ 
            name: file.name || "Simple Note", 
            size: file.size || 0,
            url: file.url,
            path: file.path,
            type: file.type || "application/pdf"
          });
        }
      });
    }

    if (property.data?.certificadoEnergetico && Array.isArray(property.data.certificadoEnergetico)) {
      property.data.certificadoEnergetico.forEach((file: any) => {
        if (file.type === "application/pdf" || file.name?.endsWith('.pdf')) {
          docs.push({ 
            name: file.name || "Energy certificate.pdf", 
            size: file.size || 0,
            url: file.url,
            path: file.path,
            type: file.type || "application/pdf"
          });
        }
      });
    }

    return docs;
  };

  const documents = getDocuments();

  return (
    <div className="space-y-8 w-full">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Image */}
          <div className="relative w-full aspect-square overflow-hidden bg-[#F9FAFB] border border-[#E5E7EB]" style={{ borderRadius: '8px 0 0 8px' }}>
            {mainImage && isValidImage(0) ? (
              <img
                src={mainImage}
                alt="Property"
                className="w-full h-full object-cover"
                style={{ borderRadius: '8px 0 0 8px' }}
                onError={() => handleImageError(0)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#6B7280] text-sm" style={{ borderRadius: '8px 0 0 8px' }}>
                {images.length > 0 ? "Image unavailable" : "No images"}
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
                    className="relative w-full h-full overflow-hidden bg-[#F9FAFB] border-2 border-[#E5E7EB]"
                    style={{ borderRadius: getBorderRadius() }}
                  >
                    {isValidImage(thumbnailIndex) ? (
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: getBorderRadius() }}
                        onError={() => handleImageError(thumbnailIndex)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#6B7280]" style={{ borderRadius: getBorderRadius() }}>
                        Image unavailable
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
                className="absolute bottom-2 right-2 flex items-center gap-2 px-4 py-2 bg-[#D9E7FF] rounded-full hover:bg-[#C7D9FF] transition-colors shadow-sm z-10"
                style={{ width: '160px', height: '32px' }}
              >
                {/* Image Icon - from SVG provided */}
                <svg width="16" height="16" viewBox="12 8 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_4208_4887)">
                    <g clipPath="url(#clip1_4208_4887)">
                      <path d="M12.668 21.3337V14.667C12.668 14.1366 12.8789 13.628 13.2539 13.2529C13.629 12.8779 14.1375 12.667 14.668 12.667C15.0362 12.667 15.3346 12.9655 15.3346 13.3337C15.3346 13.7018 15.0361 14.0003 14.668 14.0003C14.4912 14.0003 14.3216 14.0706 14.1966 14.1956C14.0716 14.3207 14.0013 14.4902 14.0013 14.667V21.3337C14.0013 21.5104 14.0716 21.68 14.1966 21.805C14.3216 21.93 14.4912 22.0003 14.668 22.0003H21.3346C21.5114 22.0003 21.681 21.93 21.806 21.805C21.931 21.68 22.0013 21.5104 22.0013 21.3337C22.0013 20.9655 22.2998 20.667 22.668 20.667C23.0362 20.667 23.3346 20.9655 23.3346 21.3337C23.3346 21.8641 23.1238 22.3727 22.7487 22.7477C22.3736 23.1228 21.8651 23.3337 21.3346 23.3337H14.668C14.1375 23.3337 13.629 23.1228 13.2539 22.7477C12.8788 22.3727 12.668 21.8641 12.668 21.3337ZM26.0013 15.6097L25.3307 14.9391C25.244 14.8516 25.1404 14.7821 25.0267 14.7347C24.913 14.6874 24.7911 14.6631 24.668 14.6631C24.5448 14.6631 24.4229 14.6874 24.3092 14.7347C24.1955 14.7821 24.092 14.8516 24.0052 14.9391L20.944 18.0003H25.3346C25.7028 18.0003 26.0013 17.7018 26.0013 17.3337V15.6097ZM19.3346 12.667C19.3346 11.9306 19.9316 11.3337 20.668 11.3337C21.4043 11.3337 22.0013 11.9306 22.0013 12.667C22.0013 13.4033 21.4043 14.0003 20.668 14.0003C19.9316 14.0003 19.3347 13.4033 19.3346 12.667ZM26.0013 10.667C26.0013 10.2988 25.7028 10.0003 25.3346 10.0003H18.668C18.2998 10.0003 18.0013 10.2988 18.0013 10.667V17.3337C18.0013 17.7018 18.2998 18.0003 18.668 18.0003H19.0586L23.0605 13.9984C23.2709 13.7868 23.5209 13.619 23.7962 13.5042C24.0724 13.3892 24.3687 13.3298 24.668 13.3298C24.9672 13.3298 25.2635 13.3892 25.5397 13.5042C25.7037 13.5725 25.8584 13.66 26.0013 13.764V10.667ZM27.3346 17.3337C27.3346 18.4382 26.4392 19.3337 25.3346 19.3337H18.668C17.5634 19.3337 16.668 18.4382 16.668 17.3337V10.667C16.668 9.56242 17.5634 8.66699 18.668 8.66699H25.3346C26.4392 8.66699 27.3346 9.56242 27.3346 10.667V17.3337Z" fill="#162EB7"/>
                    </g>
                  </g>
                  <defs>
                    <clipPath id="clip0_4208_4887">
                      <rect width="16" height="16" fill="white" transform="translate(12 8)"/>
                    </clipPath>
                    <clipPath id="clip1_4208_4887">
                      <rect width="16" height="16" fill="white" transform="translate(12 8)"/>
                    </clipPath>
                  </defs>
                </svg>
                <span className="text-sm font-medium text-[#162EB7] whitespace-nowrap">{t.propertyDetail.overview.showAllPhotos}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Property Information - Combined Basic and Building Features */}
      <section className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-6" aria-labelledby="property-info-heading">
        {/* Title */}
        <h3 id="property-info-heading" className="text-xl font-bold text-[#212121] mb-6">{t.propertyDetail.overview.propertyInformation}</h3>
        
        {/* Tabs */}
        <div className="flex gap-0 mb-6 bg-[#FAFAFA] rounded-full p-0.5 h-9 w-full max-w-[600px] mx-auto">
          <button
            onClick={() => setActiveTab('basic')}
            className={cn(
              "px-4 text-sm font-medium rounded-full transition-all duration-200 relative flex items-center justify-center h-full flex-1",
              activeTab === 'basic' 
                ? "bg-white text-[#212121] shadow-sm scale-[1.02]"
                : "bg-transparent text-[#212121] hover:text-[#316EFF]"
            )}
            aria-label="Basic features tab"
            aria-selected={activeTab === 'basic'}
          >
            {t.propertyDetail.overview.basicFeatures}
          </button>
          <button
            onClick={() => setActiveTab('building')}
            className={cn(
              "px-4 text-sm font-medium rounded-full transition-all duration-200 flex items-center justify-center h-full flex-1",
              activeTab === 'building'
                ? "bg-white text-[#212121] shadow-sm scale-[1.02]"
                : "bg-transparent text-[#212121] hover:text-[#316EFF]"
            )}
            aria-label="Building features tab"
            aria-selected={activeTab === 'building'}
          >
            {t.propertyDetail.overview.buildingFeatures}
          </button>
        </div>

        {/* Content - Conditional based on active tab */}
        {activeTab === 'basic' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                <span className="text-sm text-[#212121]">{property.propertyType}</span>
              </div>
              {property.data?.superficieUtil && (
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                  <span className="text-sm text-[#212121]">{property.data.superficieUtil} m² usables</span>
                </div>
              )}
              {property.data?.habitaciones && (
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                  <span className="text-sm text-[#212121]">{property.data.habitaciones} bedrooms</span>
                </div>
              )}
              {property.data?.banos && (
                <div className="flex items-center gap-2">
                  <Bath className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                  <span className="text-sm text-[#212121]">{property.data.banos} bathrooms</span>
                </div>
              )}
            </div>

            {/* Right Column - Basic Features (continued) */}
            <div className="space-y-4">
              {property.data?.plazasAparcamiento && property.data.plazasAparcamiento > 0 && (
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                  <span className="text-sm text-[#212121]">{property.data.plazasAparcamiento} parking space</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                <span className="text-sm text-[#212121]">Heater</span>
              </div>
              <div className="flex items-center gap-2">
                <Snowflake className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                <span className="text-sm text-[#212121]">Air Conditioning</span>
              </div>
              {property.data?.ascensor && (
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                  <span className="text-sm text-[#212121]">Lift</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Building Features Content */}
            <div className="space-y-4">
              {property.data?.anoConstruccion && (
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                  <span className="text-sm text-[#212121]">Year built: {property.data.anoConstruccion}</span>
                </div>
              )}
              {property.data?.superficieConstruida && (
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                  <span className="text-sm text-[#212121]">{property.data.superficieConstruida} m² built</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {property.data?.orientacion && Array.isArray(property.data.orientacion) && property.data.orientacion.length > 0 && (
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                  <span className="text-sm text-[#212121]">{t.propertyDetail.overview.orientation}: {property.data.orientacion.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Economic Information */}
      {(property.data?.precioVenta || property.data?.ibiAnual || property.data?.gastosComunidad) && (
        <section className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-6" aria-labelledby="economic-info-heading">
          <h3 id="economic-info-heading" className="text-lg font-semibold text-[#212121] mb-6">{t.propertyDetail.overview.economicInformation}</h3>
          <div className="flex flex-col md:flex-row gap-0">
            {/* Sale price */}
            {property.data.precioVenta && (
              <>
                <div className="flex flex-col pb-4 md:pb-0 md:pr-6 flex-1">
                  <span className="text-sm text-[#71717A] mb-1">Sale price</span>
                  <span className="text-lg font-semibold text-[#212121]">{property.data.precioVenta.toLocaleString("es-ES")} €</span>
                </div>
                {(property.data.ibiAnual || property.data.gastosComunidad) && (
                  <div className="hidden md:block w-px bg-[#E4E4E7] self-stretch" />
                )}
              </>
            )}
            {/* Exact annual IBI */}
            {property.data.ibiAnual && (
              <>
                <div className="flex flex-col py-4 md:py-0 md:px-6 flex-1">
                  <span className="text-sm text-[#71717A] mb-1">Exact annual IBI</span>
                  <span className="text-lg font-semibold text-[#212121]">{property.data.ibiAnual.toLocaleString("es-ES")} €/year</span>
                </div>
                {property.data.gastosComunidad && (
                  <div className="hidden md:block w-px bg-[#E4E4E7] self-stretch" />
                )}
              </>
            )}
            {/* Exact community fees */}
            {property.data.gastosComunidad && (
              <div className="flex flex-col pt-4 md:pt-0 md:pl-6 flex-1">
                <span className="text-sm text-[#71717A] mb-1">Exact community fees</span>
                <span className="text-lg font-semibold text-[#212121]">{property.data.gastosComunidad.toLocaleString("es-ES")} €/month</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Legal and Community Status */}
      <section className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-6" aria-labelledby="legal-status-heading">
        <h3 id="legal-status-heading" className="text-lg font-semibold text-[#212121] mb-6">{t.propertyDetail.overview.legalAndCommunityStatus}</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {property.data?.edificioITEfavorable ? (
              <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
            )}
            <span className="text-sm text-[#212121]">The building has a valid ITE report.</span>
          </div>
          <div className="flex items-center gap-2">
            {property.data?.comercializaExclusiva ? (
              <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
            )}
            <span className="text-sm text-[#212121]">This property is marketed exclusively.</span>
          </div>
          <div className="flex items-center gap-2">
            {property.data?.edificioSeguroActivo ? (
              <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
            )}
            <span className="text-sm text-[#212121]">The building has active insurance.</span>
          </div>
          <div className="flex items-center gap-2">
            {property.data?.comunidadPropietariosConstituida ? (
              <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
            )}
            <span className="text-sm text-[#212121]">Homeowners' association established.</span>
          </div>
          <div className="flex items-center gap-2">
            {property.data?.propiedadAlquilada ? (
              <X className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />
            )}
            <span className="text-sm text-[#212121]">The property is not currently rented.</span>
          </div>
        </div>
      </section>

      {/* Documentation */}
      {documents.length > 0 && (
        <section className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-6" aria-labelledby="documentation-heading">
          <div className="flex items-center justify-between mb-6">
            <h3 id="documentation-heading" className="text-lg font-semibold text-[#212121]">{t.propertyDetail.overview.documentation}</h3>
            <button className="text-sm text-[#316EFF] hover:underline font-medium">
              {t.propertyDetail.overview.viewAll}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 border-2 border-[#E5E7EB] rounded-lg bg-[#F9FAFB] hover:border-[#316EFF] hover:bg-[#F0F4FF] transition-all cursor-pointer group"
                onClick={() => {
                  // Get document URL - prioritize url, then generate from path
                  let documentUrl: string | null = null;
                  
                  if (doc.url) {
                    documentUrl = doc.url;
                  } else if (doc.path) {
                    documentUrl = getStorageFileUrl(doc.path);
                  }
                  
                  if (documentUrl) {
                    // Open modal with document
                    setSelectedDocument({
                      url: documentUrl,
                      name: doc.name,
                      type: doc.type
                    });
                  }
                }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Document Thumbnail */}
                  <div className="flex-shrink-0 w-12 h-12 bg-white border-2 border-[#E5E7EB] rounded-lg flex items-center justify-center group-hover:border-[#316EFF] transition-colors">
                    <FileText className="w-6 h-6 text-[#6B7280] group-hover:text-[#316EFF] transition-colors" />
                  </div>
                  {/* File Info */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold text-[#212121] truncate mb-1">{doc.name}</span>
                    <span className="text-xs text-[#6B7280]">{formatFileSize(doc.size)}</span>
                  </div>
                </div>
                {/* View Button */}
                <button 
                  className="flex-shrink-0 text-[#316EFF] hover:text-[#2563EB] hover:bg-[#E8F0FE] p-2 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Get document URL - prioritize url, then generate from path
                    let documentUrl: string | null = null;
                    
                    if (doc.url) {
                      documentUrl = doc.url;
                    } else if (doc.path) {
                      documentUrl = getStorageFileUrl(doc.path);
                    }
                    
                    if (documentUrl) {
                      // Open modal with document
                      setSelectedDocument({
                        url: documentUrl,
                        name: doc.name,
                        type: doc.type
                      });
                    }
                  }}
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Location */}
      <section className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-6" aria-labelledby="location-heading">
        <div className="flex items-center justify-between mb-6">
          <h3 id="location-heading" className="text-lg font-semibold text-[#212121]">{t.propertyDetail.overview.location}</h3>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#316EFF] hover:text-[#2563EB] hover:bg-[#F0F4FF] rounded-lg transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <MapPin className="w-4 h-4 text-[#316EFF] flex-shrink-0" />
            <span>{property.fullAddress}</span>
          </div>
          {/* Google Maps */}
          <div className="w-full h-[400px] rounded-lg overflow-hidden bg-[#F9FAFB] border-2 border-[#E5E7EB] shadow-sm relative">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${config.googleMaps.apiKey}&q=${encodeURIComponent(property.fullAddress)}&zoom=15`}
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Document Viewer Modal */}
      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-[95vw] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-[#212121] flex-1 truncate">
              {selectedDocument?.name}
            </DialogTitle>
            {selectedDocument && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    if (selectedDocument) {
                      window.open(selectedDocument.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#316EFF] hover:text-[#2563EB] hover:bg-[#F0F4FF] rounded-md transition-colors"
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (selectedDocument) {
                      const link = document.createElement('a');
                      link.href = selectedDocument.url;
                      link.download = selectedDocument.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#316EFF] hover:text-[#2563EB] hover:bg-[#F0F4FF] rounded-md transition-colors"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </DialogHeader>
          <div className="p-6 overflow-auto max-h-[calc(90vh-120px)] flex items-center justify-center bg-[#F9FAFB]">
            {selectedDocument && (
              <>
                {selectedDocument.type?.startsWith('image/') ? (
                  <img
                    src={selectedDocument.url}
                    alt={selectedDocument.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    onError={(e) => {
                      console.error('Error loading image:', selectedDocument.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <iframe
                    src={`${selectedDocument.url}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-[calc(90vh-200px)] min-h-[600px] border border-[#E5E7EB] rounded-lg bg-white shadow-sm"
                    title={selectedDocument.name}
                    onError={(e) => {
                      console.error('Error loading PDF:', selectedDocument.url);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        media={galleryMedia}
        initialIndex={0}
        title={t.propertyDetail.overview.showAllPhotos}
      />
    </div>
  );
}

export const OverviewTab = memo(OverviewTabComponent);
