"use client";

import { useState, useRef } from "react";
import React from "react";
import { Upload, X, File, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DocumentPreviewOverlay } from "./DocumentPreviewOverlay";

interface DocumentUploaderProps {
  value?: File[];
  onChange: (files: File[]) => void;
  className?: string;
}

export function DocumentUploader({
  value = [],
  onChange,
  className,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileUrlsRef = useRef<Map<File, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const hasFiles = value.length > 0;
  
  // Create preview URLs for all uploaded files immediately
  React.useEffect(() => {
    const fileUrls = fileUrlsRef.current;
    const newUrls = new Map<File, string>();
    value.forEach((file) => {
      if (!fileUrls.has(file)) {
        if (file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          const url = URL.createObjectURL(file);
          newUrls.set(file, url);
        }
      } else {
        newUrls.set(file, fileUrls.get(file)!);
      }
    });
    
    // Cleanup URLs for removed files
    const currentFileSet = new Set(value);
    fileUrls.forEach((url, file) => {
      if (!currentFileSet.has(file)) {
        URL.revokeObjectURL(url);
      }
    });
    
    fileUrlsRef.current = newUrls;
  }, [value]);
  
  // Cleanup all URLs on unmount
  React.useEffect(() => {
    return () => {
      fileUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    onChange([...value, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onChange([...value, ...files]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
    // Clean up preview URL if removing the previewed file
    if (previewFile && value[index] === previewFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewFile(null);
      setPreviewUrl(null);
    }
  };

  const handlePreview = (file: File) => {
    setPreviewFile(file);
    // Create preview URL for images
    if (file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {hasFiles ? (
          /* Compact Mode - After Upload */
          <div className="space-y-2">
            {value.map((file, index) => {
              const isImage = file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
              const isPDF = file.name.toLowerCase().endsWith(".pdf");
              const thumbnailUrl = fileUrlsRef.current.get(file);
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-2 hover:bg-gray-50"
                >
                  <button
                    onClick={() => handlePreview(file)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {isImage && thumbnailUrl ? (
                      /* Thumbnail/Preview visible immediately */
                      <img 
                        src={thumbnailUrl} 
                        alt={file.name}
                        className="h-10 w-10 rounded object-cover flex-shrink-0"
                      />
                    ) : isImage ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100 flex-shrink-0">
                        <File className="h-5 w-5 text-blue-600" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 flex-shrink-0">
                        <File className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Añadir más archivos
            </Button>
          </div>
        ) : (
          /* Full Drop Zone - Before Upload */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
            )}
          >
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
      </div>

      {/* Preview Overlay */}
      {previewFile && (
        <DocumentPreviewOverlay
          open={!!previewFile}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewFile(null);
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
            }
          }}
          documentName={previewFile.name}
          documentType={
            previewFile.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
              ? "image"
              : previewFile.name.toLowerCase().endsWith(".pdf")
              ? "pdf"
              : "document"
          }
          previewUrl={previewUrl || undefined}
        />
      )}
    </>
  );
}
