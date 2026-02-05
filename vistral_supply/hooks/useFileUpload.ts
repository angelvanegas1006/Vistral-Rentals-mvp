"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FileUpload } from "@/lib/supply-property-storage";
import { uploadFileToStorage, deleteFileFromStorage } from "@/lib/supply-storage-supabase";

interface UseFileUploadProps {
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  onFilesChange: (files: FileUpload[]) => void;
  propertyId?: string; // Property ID for organizing files in Storage
  folder?: string; // Folder name in Storage (e.g., "checklist", "documentation")
  uploadToStorage?: boolean; // If true, upload to Supabase Storage instead of base64
}

interface UseFileUploadReturn {
  files: FileUpload[];
  isDragOver: boolean;
  isUploading: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCameraCapture: () => void;
  handleVideoCapture: () => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
}

const DEFAULT_MAX_SIZE = 64; // MB
const DEFAULT_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png", 
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
];

export function useFileUpload({
  maxFileSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  onFilesChange,
  propertyId,
  folder,
  uploadToStorage = false,
}: UseFileUploadProps): UseFileUploadReturn {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onFilesChangeRef = useRef(onFilesChange);
  const isInitialMountRef = useRef(true);
  
  // Keep ref updated with latest callback
  useEffect(() => {
    onFilesChangeRef.current = onFilesChange;
  }, [onFilesChange]);
  
  // Call onFilesChange after files state updates (deferred to avoid render-time updates)
  // Skip the initial mount to avoid calling with empty array
  useEffect(() => {
    // Skip initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    
    // Call immediately if files array has items, otherwise defer
    // This ensures that file uploads trigger immediate updates
    if (files.length > 0) {
      // Use requestAnimationFrame to ensure it runs after React's render cycle
      requestAnimationFrame(() => {
        onFilesChangeRef.current(files);
      });
    }
  }, [files]);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `El archivo es demasiado grande. Máximo ${maxFileSize}MB`;
    }
    
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no soportado. Tipos permitidos: ${acceptedTypes.join(", ")}`;
    }
    
    return null;
  }, [maxFileSize, acceptedTypes]);

  const processFile = useCallback(async (file: File): Promise<FileUpload> => {
    // If uploadToStorage is enabled and we have propertyId, upload to Supabase Storage
    if (uploadToStorage && propertyId) {
      try {
        const storageFile = await uploadFileToStorage(file, propertyId, folder);
        return {
          id: storageFile.id,
          name: storageFile.name,
          type: storageFile.type,
          size: storageFile.size,
          url: storageFile.url,
          path: storageFile.path,
          uploadedAt: storageFile.uploadedAt,
        };
      } catch (error) {
        console.error("[useFileUpload] Error uploading to Storage, falling back to base64:", error);
        // Fallback to base64 if Storage upload fails
      }
    }

    // Default: convert to base64 (legacy behavior or fallback)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64 = reader.result as string;
        const fileUpload = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          uploadedAt: new Date().toISOString(),
        };
        resolve(fileUpload);
      };
      
      reader.onerror = (error) => {
        reject(new Error("Error al procesar el archivo"));
      };
      
      reader.readAsDataURL(file);
    });
  }, [uploadToStorage, propertyId, folder]);

  const addFiles = useCallback(async (newFiles: File[]) => {
    setIsUploading(true);
    setError(null);

    try {
      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validate all files first
      for (const file of newFiles) {
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
        } else {
          validFiles.push(file);
        }
      }

      if (errors.length > 0) {
        setError(errors.join("\n"));
      }

      if (validFiles.length === 0) {
        return;
      }

      // Process valid files
      const processedFiles = await Promise.all(
        validFiles.map(file => processFile(file))
      );

      // Use functional update to ensure we have the latest state
      setFiles(prev => [...prev, ...processedFiles]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar archivos");
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [addFiles]);

  const handleCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment";
      fileInputRef.current.click();
    }
  }, []);

  const handleVideoCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "video/*";
      fileInputRef.current.capture = "environment";
      fileInputRef.current.click();
    }
  }, []);

  const removeFile = useCallback(async (index: number) => {
    const fileToRemove = files[index];
    
    // If file is in Storage, delete it from Storage
    if (fileToRemove?.path && uploadToStorage) {
      try {
        await deleteFileFromStorage(fileToRemove.path);
      } catch (error) {
        console.error("[useFileUpload] Error deleting file from Storage:", error);
        // Continue with removal from state even if Storage delete fails
      }
    }
    
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, [files, uploadToStorage]);

  const clearFiles = useCallback(async () => {
    // If files are in Storage, delete them from Storage
    if (uploadToStorage && files.length > 0) {
      const pathsToDelete = files
        .map(f => f.path)
        .filter((path): path is string => path !== undefined);
      
      if (pathsToDelete.length > 0) {
        try {
          await Promise.all(pathsToDelete.map(path => deleteFileFromStorage(path)));
        } catch (error) {
          console.error("[useFileUpload] Error deleting files from Storage:", error);
          // Continue with clearing state even if Storage delete fails
        }
      }
    }
    
    setFiles([]);
  }, [files, uploadToStorage]);

  return {
    files,
    isDragOver,
    isUploading,
    error,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleCameraCapture,
    handleVideoCapture,
    removeFile,
    clearFiles,
  };
}
