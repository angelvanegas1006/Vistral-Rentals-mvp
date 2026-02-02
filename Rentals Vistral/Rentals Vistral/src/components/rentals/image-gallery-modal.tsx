"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Play, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export interface GalleryMediaItem {
  url: string;
  type: "image" | "video";
  label?: string; // Category/label like "Bathrooms", "Living Room"
  name?: string;
  sectionId?: string; // Section ID
  sectionTitle?: string; // Section title
  notes?: string; // Notes/comments
  status?: string; // Status
}

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: GalleryMediaItem[];
  initialIndex?: number;
  title?: string;
}

export function ImageGalleryModal({
  isOpen,
  onClose,
  media,
  initialIndex = 0,
  title,
}: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Group media by section
  const mediaBySection = useMemo(() => {
    const grouped: Record<string, GalleryMediaItem[]> = {};
    media.forEach((item) => {
      const sectionKey = item.sectionId || "other";
      if (!grouped[sectionKey]) {
        grouped[sectionKey] = [];
      }
      grouped[sectionKey].push(item);
    });
    return grouped;
  }, [media]);

  // Get unique sections with their titles
  const sections = useMemo(() => {
    const sectionMap = new Map<string, { id: string; title: string; count: number }>();
    media.forEach((item) => {
      const sectionId = item.sectionId || "other";
      const sectionTitle = item.sectionTitle || "Otras";
      if (!sectionMap.has(sectionId)) {
        sectionMap.set(sectionId, { id: sectionId, title: sectionTitle, count: 0 });
      }
      sectionMap.get(sectionId)!.count++;
    });
    return Array.from(sectionMap.values());
  }, [media]);

  // Find local index and section from global index
  const getLocalIndexAndSection = useCallback((globalIndex: number) => {
    if (globalIndex < 0 || globalIndex >= media.length) return { localIndex: 0, sectionId: null };
    
    const item = media[globalIndex];
    const itemSectionId = item.sectionId || "other";
    
    // Count items before this one in the same section
    let localIndex = 0;
    for (let i = 0; i < globalIndex; i++) {
      const currentItemSectionId = media[i].sectionId || "other";
      if (currentItemSectionId === itemSectionId) {
        localIndex++;
      }
    }
    
    return { localIndex, sectionId: itemSectionId };
  }, [media]);

  // Global index for navigation across all sections
  const [globalIndex, setGlobalIndex] = useState(initialIndex);

  // Filter media by selected section
  const filteredMedia = useMemo(() => {
    if (!selectedSectionId) return media;
    return media.filter((item) => {
      const itemSectionId = item.sectionId || "other";
      return itemSectionId === selectedSectionId;
    });
  }, [media, selectedSectionId]);

  // Reset to initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      const safeInitialIndex = Math.min(initialIndex, media.length - 1);
      setGlobalIndex(safeInitialIndex);
      
      if (media.length > 0 && safeInitialIndex >= 0) {
        const { localIndex, sectionId } = getLocalIndexAndSection(safeInitialIndex);
        setCurrentIndex(localIndex);
        setSelectedSectionId(sectionId);
      } else {
        setCurrentIndex(0);
        setSelectedSectionId(null);
      }
      setIsPlaying(false);
      setIsDropdownOpen(false);
    }
  }, [isOpen, initialIndex, media, getLocalIndexAndSection]);

  // Sync local index when global index changes (from navigation)
  useEffect(() => {
    if (isOpen && media.length > 0 && globalIndex >= 0 && globalIndex < media.length) {
      const { localIndex, sectionId } = getLocalIndexAndSection(globalIndex);
      setCurrentIndex(localIndex);
      setSelectedSectionId(sectionId);
    }
  }, [globalIndex, isOpen, media, getLocalIndexAndSection]);

  const goToPrevious = useCallback(() => {
    setGlobalIndex((prev) => {
      const newGlobalIndex = prev === 0 ? media.length - 1 : prev - 1;
      const { localIndex, sectionId } = getLocalIndexAndSection(newGlobalIndex);
      setCurrentIndex(localIndex);
      setSelectedSectionId(sectionId);
      return newGlobalIndex;
    });
    setIsPlaying(false);
  }, [media.length, getLocalIndexAndSection]);

  const goToNext = useCallback(() => {
    setGlobalIndex((prev) => {
      const newGlobalIndex = prev === media.length - 1 ? 0 : prev + 1;
      const { localIndex, sectionId } = getLocalIndexAndSection(newGlobalIndex);
      setCurrentIndex(localIndex);
      setSelectedSectionId(sectionId);
      return newGlobalIndex;
    });
    setIsPlaying(false);
  }, [media.length, getLocalIndexAndSection]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  const goToIndex = (index: number) => {
    // This is for thumbnail clicks - navigate within filtered section
    setCurrentIndex(index);
    setIsPlaying(false);
    // Update global index to match
    if (selectedSectionId) {
      let globalIdx = 0;
      let found = 0;
      for (let i = 0; i < media.length; i++) {
        const itemSectionId = media[i].sectionId || "other";
        if (itemSectionId === selectedSectionId) {
          if (found === index) {
            setGlobalIndex(i);
            return;
          }
          found++;
        }
      }
    } else {
      setGlobalIndex(index);
    }
  };

  const handleSectionChange = (sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    // When changing section via dropdown, go to first item of that section
    if (sectionId) {
      const firstIndexInSection = media.findIndex((item) => {
        const itemSectionId = item.sectionId || "other";
        return itemSectionId === sectionId;
      });
      if (firstIndexInSection >= 0) {
        setGlobalIndex(firstIndexInSection);
        setCurrentIndex(0);
      }
    } else {
      // All sections - go to first item
      setGlobalIndex(0);
      setCurrentIndex(0);
    }
    setIsPlaying(false);
  };

  if (!isOpen || media.length === 0) return null;

  // Use global index for current item (allows navigation across sections)
  const currentItem = media[globalIndex] || media[0];
  const photos = filteredMedia.filter((m) => m.type === "image");
  const videos = filteredMedia.filter((m) => m.type === "video");
  
  const hasNotes = currentItem?.notes && currentItem.notes.trim() !== "";
  const selectedSection = selectedSectionId ? sections.find(s => s.id === selectedSectionId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <DialogTitle className="sr-only">
          {title || "Galería de Imágenes"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Navega por todas las imágenes de la propiedad. Usa las teclas de flecha o los botones de navegación para moverte entre elementos.
        </DialogDescription>
        <div className="flex flex-col h-[95vh] w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  // Show all photos - reset filter
                  handleSectionChange(null);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Ver todas las fotos
              </button>
              
              <div className="text-sm text-white/70">
                {photos.length > 0 && (
                  <>
                    {photos.length} {photos.length === 1 ? "foto" : "fotos"}
                    {photos.length > 0 && videos.length > 0 && " · "}
                    {videos.length > 0 && `${videos.length} ${videos.length === 1 ? "video" : "videos"}`}
                  </>
                )}
              </div>
              
              {/* Section Dropdown */}
              {sections.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <span>{selectedSection?.title || "Todas las secciones"}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 bg-black/95 border border-white/20 rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
                        <button
                          onClick={() => {
                            handleSectionChange(null);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            !selectedSectionId
                              ? "bg-[#316EFF] text-white"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <div className="font-medium">Todas las secciones</div>
                          <div className="text-xs opacity-70">{media.length} elementos</div>
                        </button>
                        {sections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => {
                              handleSectionChange(section.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              selectedSectionId === section.id
                                ? "bg-[#316EFF] text-white"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div className="font-medium">{section.title}</div>
                            <div className="text-xs opacity-70">{section.count} elementos</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Counter */}
              {media.length > 1 && (
                <div className="text-sm text-white/70">
                  {globalIndex + 1} / {media.length}
                </div>
              )}
              
              <button
                onClick={onClose}
                className="text-white hover:text-white/80 transition-colors p-2 rounded-full hover:bg-white/10"
                aria-label="Cerrar galería"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            {/* Previous Button */}
            {media.length > 1 && (
              <button
                onClick={goToPrevious}
                className="absolute left-4 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
            )}

            {/* Current Media */}
            <div className="flex-1 flex items-center justify-center h-full max-w-full">
              {currentItem.type === "image" ? (
                <img
                  src={currentItem.url}
                  alt={currentItem.label || currentItem.name || `Imagen ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    src={currentItem.url}
                    controls
                    autoPlay={isPlaying}
                    className="max-w-full max-h-full"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>
              )}
            </div>

            {/* Next Button */}
            {media.length > 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            )}

            {/* Label and Notes Overlay */}
            {(currentItem.label || hasNotes) && (
              <div className="absolute bottom-4 left-4 right-4 max-w-2xl">
                <div className="bg-black/70 text-white px-4 py-3 rounded-lg backdrop-blur-sm">
                  {currentItem.label && (
                    <div className="text-sm font-medium mb-1">{currentItem.label}</div>
                  )}
                  {hasNotes && (
                    <div className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap break-words">
                      {currentItem.notes}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {filteredMedia.length > 1 && (
            <div className="px-6 py-4 border-t border-white/10 bg-black/50">
              <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-2">
                {filteredMedia.map((item, index) => {
                  // Check if this thumbnail corresponds to the current global item
                  const isActive = (() => {
                    if (selectedSectionId) {
                      // Count items in this section up to this index
                      let count = 0;
                      for (let i = 0; i < media.length; i++) {
                        const itemSectionId = media[i].sectionId || "other";
                        if (itemSectionId === selectedSectionId) {
                          if (count === index) {
                            return i === globalIndex;
                          }
                          count++;
                        }
                      }
                      return false;
                    } else {
                      return index === globalIndex;
                    }
                  })();
                  
                  return (
                  <button
                    key={index}
                    onClick={() => goToIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      isActive
                        ? "border-[#316EFF] ring-2 ring-[#316EFF]/50"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.label || `Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-black/50 flex items-center justify-center relative">
                        <Play className="h-6 w-6 text-white absolute z-10" />
                        <video
                          src={item.url}
                          className="w-full h-full object-cover opacity-50"
                          muted
                          preload="metadata"
                        />
                      </div>
                    )}
                  </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
