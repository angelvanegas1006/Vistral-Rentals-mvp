"use client";

import { useCallback, useEffect, useState } from "react";
import * as React from "react";
import { Upload, X, Camera, Video, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChecklistUploadZone as ChecklistUploadZoneType, FileUpload } from "@/lib/supply-checklist-storage";
import { useFileUpload } from "@/hooks/useFileUpload";
import { deleteFileFromStorage } from "@/lib/supply-storage-supabase";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Utility function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

interface ChecklistUploadZoneProps {
  title: string;
  description: string;
  uploadZone: ChecklistUploadZoneType;
  onUpdate: (uploadZone: ChecklistUploadZoneType) => void;
  isRequired?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  hideTitle?: boolean; // Para ocultar el título cuando se muestra fuera del Card
  readOnly?: boolean; // Si es true, el componente es solo lectura
  propertyId?: string; // Property ID for organizing files in Storage
  folder?: string; // Folder name in Storage (e.g., "checklist", "documentation")
}

const DEFAULT_MAX_SIZE = 5; // MB
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export function ChecklistUploadZone({
  title,
  description,
  uploadZone,
  onUpdate,
  isRequired = false,
  maxFiles = 10,
  maxSizeMB = DEFAULT_MAX_SIZE,
  hideTitle = false,
  readOnly = false,
  propertyId,
  folder = "checklist",
}: ChecklistUploadZoneProps) {
  const { t } = useI18n();
  // Detectar si estamos en mobile o tablet (no desktop)
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;
    
    const checkMobileOrTablet = () => {
      // Considerar mobile/tablet si el ancho es menor a 1024px (lg breakpoint) o si es un dispositivo móvil/tablet
      const isSmallScreen = window.innerWidth < 1024;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileOrTablet(isSmallScreen || isMobileDevice);
    };
    
    checkMobileOrTablet();
    window.addEventListener('resize', checkMobileOrTablet);
    return () => window.removeEventListener('resize', checkMobileOrTablet);
  }, []);
  const handlePhotosChange = useCallback((files: FileUpload[]) => {
    // Use ref to get latest uploadZone value to avoid stale closure
    const currentUploadZone = uploadZoneRef.current;
    // Create new array reference to ensure React detects the change
    const updatedZone = {
      ...currentUploadZone,
      photos: [...files], // Create new array reference
    };
    onUpdate(updatedZone);
  }, [onUpdate]);

  const handleVideosChange = useCallback((files: FileUpload[]) => {
    // Use ref to get latest uploadZone value to avoid stale closure
    const currentUploadZone = uploadZoneRef.current;
    // Create new array reference to ensure React detects the change
    onUpdate({
      ...currentUploadZone,
      videos: [...files], // Create new array reference
    });
  }, [onUpdate]);

  // Track processed file IDs to avoid duplicates
  const processedPhotoIdsRef = React.useRef<Set<string>>(new Set());
  const processedVideoIdsRef = React.useRef<Set<string>>(new Set());
  
  // Use ref to always get latest uploadZone value
  const uploadZoneRef = React.useRef(uploadZone);
  React.useEffect(() => {
    uploadZoneRef.current = uploadZone;
  }, [uploadZone]);

  // Initialize refs with existing file IDs and sync when uploadZone changes
  // Also sync when uploadZone itself changes (not just length) to catch when photos are loaded from Supabase
  React.useEffect(() => {
    processedPhotoIdsRef.current.clear();
    processedVideoIdsRef.current.clear();
    uploadZone.photos.forEach(p => processedPhotoIdsRef.current.add(p.id));
    uploadZone.videos.forEach(v => processedVideoIdsRef.current.add(v.id));
  }, [uploadZone.photos.length, uploadZone.videos.length, uploadZone]);

  const photosHook = useFileUpload({
    maxFileSize: maxSizeMB,
    acceptedTypes: PHOTO_TYPES,
    propertyId,
    folder: folder ? `${folder}/${uploadZone.id}` : uploadZone.id,
    uploadToStorage: !!propertyId, // Enable Storage upload if propertyId is provided
    onFilesChange: useCallback((allFiles) => {
      // Filter to only include photos
      const photos = allFiles.filter(f => 
        f.type && f.type.startsWith("image/")
      );
      
      // Get current photo IDs from uploadZone (use ref to get latest value)
      const currentUploadZone = uploadZoneRef.current;
      const currentPhotoIds = new Set(currentUploadZone.photos.map(p => p.id));
      
      // Find new photos that aren't already in uploadZone
      const newPhotos = photos.filter(p => {
        // If already processed or already in uploadZone, skip
        if (processedPhotoIdsRef.current.has(p.id) || currentPhotoIds.has(p.id)) {
          return false;
        }
        processedPhotoIdsRef.current.add(p.id);
        return true;
      });
      
      // Only update if there are new photos
      if (newPhotos.length > 0) {
        const updatedPhotos = [...currentUploadZone.photos, ...newPhotos];
        handlePhotosChange(updatedPhotos);
      } else if (photos.length === 0 && currentUploadZone.photos.length > 0) {
        // Don't overwrite existing photos if hook returns empty array
      }
    }, [handlePhotosChange]),
  });

  const videosHook = useFileUpload({
    maxFileSize: maxSizeMB * 10, // Videos can be larger
    acceptedTypes: VIDEO_TYPES,
    propertyId,
    folder: folder ? `${folder}/${uploadZone.id}` : uploadZone.id,
    uploadToStorage: !!propertyId, // Enable Storage upload if propertyId is provided
    onFilesChange: useCallback((allFiles) => {
      // Filter to only include videos
      const videos = allFiles.filter(f => 
        f.type && f.type.startsWith("video/")
      );
      
      // Get current video IDs from uploadZone (use ref to get latest value)
      const currentUploadZone = uploadZoneRef.current;
      const currentVideoIds = new Set(currentUploadZone.videos.map(v => v.id));
      
      // Find new videos that aren't already in uploadZone
      const newVideos = videos.filter(v => {
        // If already processed or already in uploadZone, skip
        if (processedVideoIdsRef.current.has(v.id) || currentVideoIds.has(v.id)) {
          return false;
        }
        processedVideoIdsRef.current.add(v.id);
        return true;
      });
      
      // Only update if there are new videos
      if (newVideos.length > 0) {
        handleVideosChange([...currentUploadZone.videos, ...newVideos]);
      } else if (videos.length === 0 && currentUploadZone.videos.length > 0) {
        // Don't overwrite existing videos if hook returns empty array
      }
    }, [handleVideosChange]),
  });

  const [localError, setLocalError] = React.useState<string | null>(null);

  // Unified drop handler that routes files to the correct hook
  const handleUnifiedDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly) return;
    photosHook.handleDragLeave(e);
    videosHook.handleDragLeave(e);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (droppedFiles.length === 0) return;

    // Separate photos and videos
    const photos: File[] = [];
    const videos: File[] = [];
    const errors: string[] = [];

    droppedFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        photos.push(file);
      } else if (file.type.startsWith("video/")) {
        videos.push(file);
      } else {
        errors.push(`${file.name}: Tipo de archivo no soportado. Solo se permiten imágenes y videos.`);
      }
    });

    // Process photos by directly calling the hook's internal addFiles logic
    // We'll use the file input refs to trigger the hooks' file selection handlers
    if (photos.length > 0) {
      // Create a temporary file input and trigger the photos hook
      const tempInput = document.createElement('input');
      tempInput.type = 'file';
      tempInput.multiple = true;
      tempInput.accept = PHOTO_TYPES.join(',');
      
      // Create a FileList-like object
      const dataTransfer = new DataTransfer();
      photos.forEach(photo => dataTransfer.items.add(photo));
      
      // Access the input's files property
      Object.defineProperty(tempInput, 'files', {
        value: dataTransfer.files,
        writable: false,
      });
      
      // Create a synthetic change event
      const changeEvent = new Event('change', { bubbles: true });
      Object.defineProperty(changeEvent, 'target', {
        value: tempInput,
        writable: false,
      });
      
      photosHook.handleFileSelect(changeEvent as any);
    }

    if (videos.length > 0) {
      // Create a temporary file input and trigger the videos hook
      const tempInput = document.createElement('input');
      tempInput.type = 'file';
      tempInput.multiple = true;
      tempInput.accept = VIDEO_TYPES.join(',');
      
      // Create a FileList-like object
      const dataTransfer = new DataTransfer();
      videos.forEach(video => dataTransfer.items.add(video));
      
      // Access the input's files property
      Object.defineProperty(tempInput, 'files', {
        value: dataTransfer.files,
        writable: false,
      });
      
      // Create a synthetic change event
      const changeEvent = new Event('change', { bubbles: true });
      Object.defineProperty(changeEvent, 'target', {
        value: tempInput,
        writable: false,
      });
      
      videosHook.handleFileSelect(changeEvent as any);
    }

    // Show errors if any
    if (errors.length > 0) {
      setLocalError(errors.join("\n"));
    } else {
      setLocalError(null);
    }
  }, [photosHook, videosHook, readOnly]);

  const handleRemovePhoto = useCallback(async (index: number) => {
    const photoToRemove = uploadZone.photos[index];
    if (photoToRemove) {
      processedPhotoIdsRef.current.delete(photoToRemove.id);
      
      // Delete from Storage if file has a path
      if (photoToRemove.path && propertyId) {
        try {
          await deleteFileFromStorage(photoToRemove.path);
        } catch (error) {
          console.error("[ChecklistUploadZone] Error deleting photo from Storage:", error);
          // Continue with removal from state even if Storage delete fails
        }
      }
    }
    const newPhotos = uploadZone.photos.filter((_, i) => i !== index);
    onUpdate({
      ...uploadZone,
      photos: newPhotos,
    });
    // Clear error when removing files
    setLocalError(null);
  }, [uploadZone, onUpdate, propertyId]);

  const handleRemoveVideo = useCallback(async (index: number) => {
    const videoToRemove = uploadZone.videos[index];
    if (videoToRemove) {
      processedVideoIdsRef.current.delete(videoToRemove.id);
      
      // Delete from Storage if file has a path
      if (videoToRemove.path && propertyId) {
        try {
          await deleteFileFromStorage(videoToRemove.path);
        } catch (error) {
          console.error("[ChecklistUploadZone] Error deleting video from Storage:", error);
          // Continue with removal from state even if Storage delete fails
        }
      }
    }
    const newVideos = uploadZone.videos.filter((_, i) => i !== index);
    onUpdate({
      ...uploadZone,
      videos: newVideos,
    });
    // Clear error when removing files
    setLocalError(null);
  }, [uploadZone, onUpdate, propertyId]);

  // Update local error when hook errors change
  useEffect(() => {
    if (photosHook.error || videosHook.error) {
      setLocalError(photosHook.error || videosHook.error || null);
    } else {
      setLocalError(null);
    }
  }, [photosHook.error, videosHook.error]);

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold leading-tight">
              {title} {isRequired && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <span className="text-xs text-muted-foreground leading-normal">
              {uploadZone.photos.length} foto(s), {uploadZone.videos.length} video(s)
            </span>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      )}
      {hideTitle && (
        <div className="flex items-center justify-end mb-2">
          <span className="text-xs text-muted-foreground leading-normal">
            {uploadZone.photos.length} foto(s), {uploadZone.videos.length} video(s)
          </span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          (photosHook.isDragOver || videosHook.isDragOver)
            ? "border-[var(--prophero-blue-500)] bg-[var(--prophero-blue-50)] dark:bg-[var(--prophero-blue-950)]/20"
            : "border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-600)] bg-white dark:bg-card hover:border-[var(--prophero-gray-400)] dark:hover:border-[var(--prophero-gray-500)]"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          photosHook.handleDragOver(e);
          videosHook.handleDragOver(e);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          photosHook.handleDragLeave(e);
          videosHook.handleDragLeave(e);
        }}
        onDrop={readOnly ? undefined : handleUnifiedDrop}
      >
        <Upload className="h-8 w-8 mx-auto text-[var(--prophero-gray-400)] mb-2" />
        <p className="text-sm text-[var(--prophero-gray-600)] dark:text-[var(--prophero-gray-400)] mb-2">
          Arrastra y suelta archivos aquí
        </p>
        <p className="text-xs text-[var(--prophero-gray-500)] dark:text-[var(--prophero-gray-500)] mb-3">
          O haz clic para explorar (máx. {maxFiles} archivos, {maxSizeMB}MB cada uno)
        </p>
        
        <input
          ref={photosHook.fileInputRef}
          type="file"
          multiple
          accept={PHOTO_TYPES.join(",")}
          onChange={photosHook.handleFileSelect}
          capture={isMobileOrTablet ? "environment" : undefined}
          className="hidden"
        />
        <input
          ref={videosHook.fileInputRef}
          type="file"
          multiple
          accept={VIDEO_TYPES.join(",")}
          onChange={videosHook.handleFileSelect}
          capture={isMobileOrTablet ? "environment" : undefined}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {isMobileOrTablet ? (
            <>
              {/* Botones para mobile: captura directa desde cámara */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!readOnly && photosHook.fileInputRef.current) {
                    photosHook.fileInputRef.current.accept = PHOTO_TYPES.join(",");
                    photosHook.fileInputRef.current.capture = "environment";
                    photosHook.fileInputRef.current.multiple = true;
                    photosHook.fileInputRef.current.click();
                  }
                }}
                disabled={readOnly}
                className="flex items-center gap-1"
              >
                <Camera className="h-4 w-4" />
                Tomar foto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!readOnly && photosHook.fileInputRef.current) {
                    photosHook.fileInputRef.current.accept = PHOTO_TYPES.join(",");
                    photosHook.fileInputRef.current.removeAttribute('capture');
                    photosHook.fileInputRef.current.multiple = true;
                    photosHook.fileInputRef.current.click();
                  }
                }}
                disabled={readOnly}
                className="flex items-center gap-1"
              >
                <ImageIcon className="h-4 w-4" />
                Galería
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!readOnly && videosHook.fileInputRef.current) {
                    videosHook.fileInputRef.current.accept = VIDEO_TYPES.join(",");
                    videosHook.fileInputRef.current.capture = "environment";
                    videosHook.fileInputRef.current.multiple = true;
                    videosHook.fileInputRef.current.click();
                  }
                }}
                disabled={readOnly}
                className="flex items-center gap-1"
              >
                <Video className="h-4 w-4" />
                Grabar video
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!readOnly && videosHook.fileInputRef.current) {
                    videosHook.fileInputRef.current.accept = VIDEO_TYPES.join(",");
                    videosHook.fileInputRef.current.removeAttribute('capture');
                    videosHook.fileInputRef.current.multiple = true;
                    videosHook.fileInputRef.current.click();
                  }
                }}
                disabled={readOnly}
                className="flex items-center gap-1"
              >
                <Video className="h-4 w-4" />
                Video galería
              </Button>
            </>
          ) : (
            <>
              {/* Botones para desktop: solo selección de archivos */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => !readOnly && photosHook.fileInputRef.current?.click()}
                disabled={readOnly}
                className="flex items-center gap-1"
              >
                <ImageIcon className="h-4 w-4" />
                Subir fotos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => !readOnly && videosHook.fileInputRef.current?.click()}
                disabled={readOnly}
                className="flex items-center gap-1"
              >
                <Video className="h-4 w-4" />
                Subir videos
              </Button>
            </>
          )}
        </div>
      </div>

      {/* File List - Horizontal Layout */}
      {(uploadZone.photos.length > 0 || uploadZone.videos.length > 0) && (
        <div className="space-y-2 mt-4">
          {/* Photos */}
          {uploadZone.photos.map((file, index) => {
            // Use URL from Storage if available, otherwise use base64 data
            const imageSrc = file.url || file.data;
            return (
              <div
                key={file.id || `photo-${index}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-600)] bg-white dark:bg-card hover:bg-[var(--prophero-gray-50)] dark:hover:bg-[var(--prophero-gray-900)] transition-colors"
              >
                {/* Thumbnail on the left */}
                <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden border border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-600)] bg-[var(--prophero-gray-100)] dark:bg-[var(--prophero-gray-800)]">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-[var(--prophero-gray-400)]" />
                    </div>
                  )}
                </div>
                
                {/* Filename and size on the right */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                
                {/* Blue 'x' icon for removal */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="flex-shrink-0 p-1.5 text-[var(--prophero-blue-500)] hover:text-[var(--prophero-blue-600)] hover:bg-[var(--prophero-blue-50)] dark:hover:bg-[var(--prophero-blue-950)]/20 rounded transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        
          {/* Videos */}
          {uploadZone.videos.map((file, index) => (
            <div
              key={file.id || `video-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-600)] bg-white dark:bg-card hover:bg-[var(--prophero-gray-50)] dark:hover:bg-[var(--prophero-gray-900)] transition-colors"
            >
              {/* Thumbnail on the left */}
              <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden border border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-600)] bg-[var(--prophero-gray-100)] dark:bg-[var(--prophero-gray-800)] flex items-center justify-center">
                <Video className="h-6 w-6 text-[var(--prophero-gray-400)]" />
              </div>
              
              {/* Filename and size on the right */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              
              {/* Blue 'x' icon for removal */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveVideo(index)}
                  className="flex-shrink-0 p-1.5 text-[var(--prophero-blue-500)] hover:text-[var(--prophero-blue-600)] hover:bg-[var(--prophero-blue-50)] dark:hover:bg-[var(--prophero-blue-950)]/20 rounded transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {localError && (
        <p className="text-sm text-red-500 mt-2">{localError}</p>
      )}
    </div>
  );
}
