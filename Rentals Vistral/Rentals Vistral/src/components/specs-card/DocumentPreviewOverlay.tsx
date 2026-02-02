"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { FileText, Image as ImageIcon } from "lucide-react";

interface DocumentPreviewOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  documentType?: "pdf" | "image" | "document";
  previewUrl?: string; // For uploaded files
}

export function DocumentPreviewOverlay({
  open,
  onOpenChange,
  documentName,
  documentType = "document",
  previewUrl,
}: DocumentPreviewOverlayProps) {
  const [imageError, setImageError] = useState(false);

  // Reset image error when dialog closes
  useEffect(() => {
    if (!open) {
      setImageError(false);
    }
  }, [open]);

  // Safe type detection
  const isImage = useMemo(() => {
    if (!documentName) return false;
    try {
      return documentType === "image" || 
        !!documentName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
    } catch {
      return false;
    }
  }, [documentType, documentName]);

  const isPDF = useMemo(() => {
    if (!documentName) return false;
    try {
      return documentType === "pdf" || 
        documentName.toLowerCase().endsWith(".pdf");
    } catch {
      return false;
    }
  }, [documentType, documentName]);

  // Safe URL getter
  const safePreviewUrl = useMemo(() => {
    try {
      if (previewUrl) {
        try {
          new URL(previewUrl);
          return previewUrl;
        } catch {
          // Invalid URL
        }
      }
      if (isImage && documentName) {
        const safeName = documentName.slice(0, 20);
        return `https://via.placeholder.com/800x600/cccccc/666666?text=${encodeURIComponent(safeName)}`;
      }
      return null;
    } catch {
      return null;
    }
  }, [previewUrl, isImage, documentName]);

  // Safe document name
  const safeDocumentName = documentName || "Unknown file";

  // Render preview content
  const renderPreviewContent = () => {
    if (isImage) {
      if (imageError || !safePreviewUrl) {
        return (
          <div className="inline-block bg-white p-8 rounded-lg shadow-lg">
            <ImageIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600">Preview Unavailable</p>
            <p className="text-xs text-gray-500 mt-2">{safeDocumentName}</p>
          </div>
        );
      }
      return (
        <img 
          src={safePreviewUrl} 
          alt={safeDocumentName}
          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          onError={() => setImageError(true)}
        />
      );
    }

    if (isPDF) {
      return (
        <div className="inline-block bg-white p-8 rounded-lg shadow-lg">
          <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600">PDF Document</p>
          <p className="text-xs text-gray-500 mt-2">{safeDocumentName}</p>
        </div>
      );
    }

    return (
      <div className="inline-block bg-white p-8 rounded-lg shadow-lg">
        <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-600">Preview Unavailable</p>
        <p className="text-xs text-gray-500 mt-2">{safeDocumentName}</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="overflow-hidden p-0 z-[60] [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Document Preview - {safeDocumentName}</DialogTitle>
        <DialogDescription className="sr-only">
          Preview of {safeDocumentName} document
        </DialogDescription>
        <div className="flex flex-col aspect-square w-[min(90vh,90vw)] bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              {isImage ? (
                <ImageIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <FileText className="h-5 w-5 text-gray-600" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {safeDocumentName}
              </h3>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8 flex items-center justify-center">
            <div className="text-center max-w-full max-h-full">
              {renderPreviewContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
