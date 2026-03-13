"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, FileText, Image as ImageIcon } from "lucide-react";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { config } from "@/lib/config/environment";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string | null | undefined;
  documentName?: string;
}

function looksLikeHtmlDocument(content: string): boolean {
  return /<(?:!doctype|html|head|body|div|section|style|script|main|header)\b/i.test(content);
}

function decodeHtmlEntities(content: string): string {
  if (typeof window === "undefined") return content;
  const textarea = window.document.createElement("textarea");
  textarea.innerHTML = content;
  return textarea.value;
}

function extractHtmlFromJsonPayload(content: string): string | null {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "string") {
      return parsed;
    }

    if (parsed && typeof parsed === "object") {
      const candidateKeys = ["html", "content", "document", "markup"];
      for (const key of candidateKeys) {
        const value = (parsed as Record<string, unknown>)[key];
        if (typeof value === "string") {
          return value;
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

function injectBaseHref(content: string, baseHref: string): string {
  if (/<base\s/i.test(content)) {
    return content;
  }

  const safeBaseHref = baseHref.replace(/"/g, "&quot;");
  const baseTag = `<base href="${safeBaseHref}" />`;

  if (/<head[^>]*>/i.test(content)) {
    return content.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  }

  if (/<html[^>]*>/i.test(content)) {
    return content.replace(/<html([^>]*)>/i, `<html$1><head>${baseTag}</head>`);
  }

  return `<!DOCTYPE html><html><head>${baseTag}</head><body>${content}</body></html>`;
}

function normalizeHtmlForPreview(content: string, sourceUrl: string): string {
  let normalized = content.trim();

  const jsonPayload = extractHtmlFromJsonPayload(normalized);
  if (jsonPayload) {
    normalized = jsonPayload.trim();
  }

  if (!looksLikeHtmlDocument(normalized) && /&lt;|&#x3c;|&#60;/i.test(normalized)) {
    const decoded = decodeHtmlEntities(normalized).trim();
    if (looksLikeHtmlDocument(decoded)) {
      normalized = decoded;
    }
  }

  // Some stored documents are serialized as quoted HTML strings.
  if (!looksLikeHtmlDocument(normalized)) {
    const unwrappedQuotedHtml = normalized.match(/^["']([\s\S]+)["']$/);
    if (unwrappedQuotedHtml) {
      const decoded = decodeHtmlEntities(unwrappedQuotedHtml[1]).trim();
      if (looksLikeHtmlDocument(decoded)) {
        normalized = decoded;
      }
    }
  }

  return injectBaseHref(normalized, sourceUrl);
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  documentUrl,
  documentName = "Documento",
}: DocumentPreviewModalProps) {
  const [imageError, setImageError] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [htmlError, setHtmlError] = useState(false);
  // Set flag immediately when component mounts with open=true - this prevents immediate close
  const justOpenedRef = useRef(open);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Track when modal just opened to prevent immediate close
  useEffect(() => {
    if (open) {
      // On initial mount with open=true, set flag immediately
      if (isInitialMount.current) {
        justOpenedRef.current = true;
        console.log("Modal mounted with open=true, setting justOpenedRef to true");
        isInitialMount.current = false;
      } else {
        // On subsequent opens, set flag immediately
        justOpenedRef.current = true;
        console.log("Modal opened, setting justOpenedRef to true");
      }
      
      // Clear any existing timeout
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
      
      // Reset flag after modal is fully opened and rendered
      openTimeoutRef.current = setTimeout(() => {
        justOpenedRef.current = false;
        console.log("Modal opening period ended");
      }, 500);
    } else {
      // Reset flag when closing
      justOpenedRef.current = false;
      isInitialMount.current = true; // Reset for next open
    }
    
    return () => {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
    };
  }, [open]);

  // Extract file extension from URL pathname (before query parameters)
  // This handles signed URLs with query params like ?token=...
  const getFileExtension = (url: string, documentName?: string): string | null => {
    // First, try to get extension from URL pathname
    try {
      const urlObj = new URL(url);
      const pathname = decodeURIComponent(urlObj.pathname).toLowerCase();
      // Match extension at end of pathname (handles /file.html, /file.pdf, etc.)
      const match = pathname.match(/\.([a-z0-9]+)$/);
      if (match) return match[1];
      // Also try matching extension before any trailing slash
      const match2 = pathname.match(/\.([a-z0-9]+)\/$/);
      if (match2) return match2[1];
    } catch {
      // If URL parsing fails, try simple string matching on URL (before query params)
      const urlMatch = url.toLowerCase().match(/\.([a-z0-9]+)(?:\?|#|$)/);
      if (urlMatch) return urlMatch[1];
    }
    
    // Fallback: try to get extension from document name
    if (documentName) {
      const nameMatch = documentName.toLowerCase().match(/\.([a-z0-9]+)$/);
      if (nameMatch) return nameMatch[1];
    }
    
    // Fallback: check if URL contains known extension patterns in the path
    try {
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes(".html?") || lowerUrl.includes(".html&") || lowerUrl.includes(".htm?")) return "html";
    } catch { /* ignore */ }
    
    return null;
  };

  const fileExtension = useMemo(() => {
    if (!documentUrl) return null;
    const ext = getFileExtension(documentUrl, documentName);
    // Debug logging (remove in production if needed)
    if (config.isDevelopment) {
      console.log("DocumentPreviewModal - URL:", documentUrl);
      console.log("DocumentPreviewModal - DocumentName:", documentName);
      console.log("DocumentPreviewModal - Detected Extension:", ext);
    }
    return ext;
  }, [documentUrl, documentName]);

  const isImage = useMemo(() => {
    if (!fileExtension) return false;
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
    return imageExtensions.includes(fileExtension);
  }, [fileExtension]);

  const isHTML = useMemo(() => {
    if (!fileExtension) return false;
    return fileExtension === "html" || fileExtension === "htm";
  }, [fileExtension]);

  const shouldTryHtmlPreview = useMemo(() => {
    if (isImage) return false;
    const lowerName = documentName.toLowerCase();
    return (
      isHTML ||
      lowerName.includes("final check") ||
      lowerName.includes("final_check")
    );
  }, [isImage, isHTML, documentName]);

  const normalizedHtmlContent = useMemo(() => {
    if (!htmlContent || !documentUrl) return null;
    return normalizeHtmlForPreview(htmlContent, documentUrl);
  }, [htmlContent, documentUrl]);

  // Default to PDF if it's not an image/HTML and we can't determine the type
  const isPDF = useMemo(() => {
    if (fileExtension === "pdf") return true;
    // If no extension detected and it's not an image or HTML, assume PDF for document preview
    if (!fileExtension && !isImage && !isHTML) return true;
    return false;
  }, [fileExtension, isImage, isHTML]);

  // Reset errors when modal opens/closes or URL changes
  useMemo(() => {
    if (open && documentUrl) {
      setImageError(false);
      setPdfLoadError(false);
      setHtmlError(false);
      setHtmlContent(null);
    }
  }, [open, documentUrl]);

  // Fetch HTML content so it can be rendered via srcdoc (signed URLs serve as download)
  useEffect(() => {
    if (!open || !documentUrl || !shouldTryHtmlPreview) {
      setHtmlContent(null);
      return;
    }
    let cancelled = false;
    setHtmlLoading(true);
    setHtmlError(false);

    fetch(`/api/documents/html-preview?url=${encodeURIComponent(documentUrl)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((payload: { success?: boolean; data?: { html?: string } }) => {
        const text = payload?.data?.html;
        if (!text) {
          throw new Error("Empty HTML preview response");
        }
        if (!cancelled) {
          setHtmlContent(text);
          setHtmlLoading(false);
        }
      })
      .catch((err) => {
        console.error("[HTML Preview Fetch Error]:", err);
        if (!cancelled) {
          setHtmlError(true);
          setHtmlLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [open, documentUrl, shouldTryHtmlPreview]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    console.log("handleOpenChange called:", newOpen, "justOpenedRef:", justOpenedRef.current, "current open:", open);
    
    // If trying to close and we just opened, prevent it
    if (!newOpen) {
      if (justOpenedRef.current) {
        console.log("Preventing close - modal just opened, ignoring close request");
        return;
      }
      // Normal close - allow it
      console.log("Closing modal normally");
      onOpenChange(false);
    } else {
      // Opening - allow it
      console.log("Opening modal");
      onOpenChange(true);
    }
  }, [open, onOpenChange]);

  // Early return after all hooks - but only if no documentUrl
  if (!documentUrl) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent 
        className="max-w-7xl w-full h-[90vh] p-0 overflow-hidden [&>button]:hidden z-50"
        onInteractOutside={(e) => {
          // Prevent closing if modal just opened
          if (justOpenedRef.current) {
            e.preventDefault();
            return;
          }
          // Allow closing when clicking outside
          onOpenChange(false);
        }}
        onPointerDownOutside={(e) => {
          // Prevent closing if modal just opened
          if (justOpenedRef.current) {
            e.preventDefault();
            return;
          }
          // Allow closing when clicking outside
          onOpenChange(false);
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing if modal just opened
          if (justOpenedRef.current) {
            e.preventDefault();
            return;
          }
          // Allow closing with Escape key
          onOpenChange(false);
        }}
      >
        <DialogTitle className="sr-only">Vista previa - {documentName}</DialogTitle>
        <DialogDescription className="sr-only">
          Vista previa del documento {documentName}
        </DialogDescription>
        
        <div className="flex flex-col h-full bg-background">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              {isImage ? (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
              <h3 className="text-lg font-semibold">{documentName}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto bg-muted/30 p-4 flex items-center justify-center">
            {isImage ? (
              imageError ? (
                <div className="text-center p-8">
                  <ImageIcon className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Error al cargar la imagen</p>
                  <p className="text-xs text-muted-foreground mt-2">{documentName}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.open(documentUrl, "_blank", "noopener,noreferrer")}
                  >
                    Abrir en nueva pestaña
                  </Button>
                </div>
              ) : (
                <img
                  src={documentUrl}
                  alt={documentName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onError={() => setImageError(true)}
                />
              )
            ) : shouldTryHtmlPreview && normalizedHtmlContent ? (
              <div className="w-full h-full min-h-[600px] rounded-lg border shadow-lg bg-white overflow-hidden">
                <iframe
                  srcDoc={normalizedHtmlContent}
                  className="w-full h-full min-h-[600px]"
                  title={documentName}
                  sandbox="allow-same-origin allow-scripts"
                  style={{ border: "none" }}
                />
              </div>
            ) : shouldTryHtmlPreview ? (
              htmlLoading ? (
                <div className="text-center p-8">
                  <FileText className="h-24 w-24 text-muted-foreground mx-auto mb-4 animate-pulse" />
                  <p className="text-sm text-muted-foreground">Cargando documento...</p>
                </div>
              ) : htmlError || !normalizedHtmlContent ? (
                <div className="text-center p-8">
                  <FileText className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Error al cargar el documento HTML</p>
                  <p className="text-xs text-muted-foreground mt-2">{documentName}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.open(documentUrl, "_blank", "noopener,noreferrer")}
                  >
                    Abrir en nueva pestaña
                  </Button>
                </div>
              ) : null
            ) : isPDF ? (
              pdfLoadError ? (
                <div className="text-center p-8">
                  <FileText className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Error al cargar el PDF</p>
                  <p className="text-xs text-muted-foreground mt-2">{documentName}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.open(documentUrl, "_blank", "noopener,noreferrer")}
                  >
                    Abrir en nueva pestaña
                  </Button>
                </div>
              ) : (
                <div className="w-full h-full min-h-[600px] rounded-lg border shadow-lg bg-white overflow-hidden">
                  <iframe
                    src={documentUrl}
                    className="w-full h-full min-h-[600px]"
                    title={documentName}
                    allow="fullscreen"
                    style={{ border: "none" }}
                  />
                </div>
              )
            ) : (
              <div className="text-center p-8">
                <FileText className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Vista previa no disponible</p>
                <p className="text-xs text-muted-foreground mt-2">{documentName}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open(documentUrl, "_blank", "noopener,noreferrer")}
                >
                  Abrir en nueva pestaña
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
