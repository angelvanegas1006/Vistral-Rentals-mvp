"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePropertyTasks } from "@/hooks/use-property-tasks";
import { useProperty } from "@/hooks/use-property";
import { useUpdateProperty } from "@/hooks/use-update-property";
import { Check, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentUploadField } from "@/components/rentals/document-upload-field";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface PendingProceduresTasksProps {
  property: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
}

const PHASE = "Pendiente de trámites";

export function PendingProceduresTasks({ property }: PendingProceduresTasksProps) {
  const propertyId = property.property_unique_id;
  
  const { tasks, isTaskCompleted, updateTask, loading: tasksLoading } = usePropertyTasks({
    propertyId,
    phase: PHASE,
  });
  
  const { property: supabaseProperty } = useProperty(propertyId);
  const { updateProperty } = useUpdateProperty();
  
  // Guarantee state
  const [guaranteeSigned, setGuaranteeSigned] = useState<boolean | null>(null);
  const [guaranteeUrl, setGuaranteeUrl] = useState<string | null>(null);
  
  // Refs to track latest values for completion checks
  const guaranteeSignedRef = useRef<boolean | null>(null);
  const guaranteeUrlRef = useRef<string | null>(null);
  
  // Keep refs in sync with state
  useEffect(() => {
    guaranteeSignedRef.current = guaranteeSigned;
  }, [guaranteeSigned]);
  
  useEffect(() => {
    guaranteeUrlRef.current = guaranteeUrl;
  }, [guaranteeUrl]);
  
  // Get completion status
  const guaranteeCompleted = isTaskCompleted("guaranteeSigned", PHASE);
  
  // Initialize collapse state
  const [guaranteeSectionOpen, setGuaranteeSectionOpen] = useState(() => {
    return !guaranteeCompleted;
  });
  
  const hasInitializedCollapse = useRef(false);
  useEffect(() => {
    if (!tasksLoading && !hasInitializedCollapse.current) {
      setGuaranteeSectionOpen(!guaranteeCompleted);
      hasInitializedCollapse.current = true;
    }
  }, [tasksLoading, guaranteeCompleted]);

  // Helper function to get section color classes
  const getSectionColorClasses = (completed: boolean) => {
    if (completed) {
      return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30";
    }
    return "border-gray-200 dark:border-gray-700";
  };

  // Track initialization to prevent overwriting user changes
  const hasInitializedFromProperty = useRef(false);
  
  // Initialize guarantee fields from property data (only once)
  useEffect(() => {
    if (supabaseProperty && !hasInitializedFromProperty.current) {
      // Initialize guarantee_signed (including false values)
      if (supabaseProperty.guarantee_signed !== null && supabaseProperty.guarantee_signed !== undefined) {
        setGuaranteeSigned(supabaseProperty.guarantee_signed);
        guaranteeSignedRef.current = supabaseProperty.guarantee_signed;
      }
      
      // Initialize guarantee_file_url
      const initialUrl = supabaseProperty.guarantee_file_url || null;
      setGuaranteeUrl(initialUrl);
      guaranteeUrlRef.current = initialUrl;
      
      hasInitializedFromProperty.current = true;
    }
  }, [supabaseProperty]);

  // Check if guarantee section can be completed
  const checkGuaranteeCompletion = useCallback(async (signed?: boolean | null, url?: string | null) => {
    // Use provided values or fall back to state
    const currentSigned = signed !== undefined ? signed : guaranteeSigned;
    const currentUrl = url !== undefined ? url : guaranteeUrl;
    
    const isComplete = currentSigned === true && currentUrl !== null && currentUrl !== undefined;
    
    await updateTask("guaranteeSigned", PHASE, {
      is_completed: isComplete,
    });
  }, [guaranteeSigned, guaranteeUrl, updateTask]);

  // Handle guarantee signed change
  const handleGuaranteeSignedChange = async (value: string) => {
    const signed = value === "yes";
    setGuaranteeSigned(signed);
    guaranteeSignedRef.current = signed;
    
    // If "No" is selected, clear the file URL
    let newUrl = guaranteeUrlRef.current;
    if (!signed && guaranteeUrlRef.current) {
      // Clear the file URL when "No" is selected
      newUrl = null;
      setGuaranteeUrl(null);
      guaranteeUrlRef.current = null;
      await updateProperty(propertyId, {
        guarantee_file_url: null,
      });
    }
    
    await updateProperty(propertyId, {
      guarantee_signed: signed,
    });
    
    // Check completion with the new value directly
    await checkGuaranteeCompletion(signed, newUrl);
  };

  // Handle clear guarantee selection
  const handleClearGuaranteeSigned = async () => {
    setGuaranteeSigned(null);
    guaranteeSignedRef.current = null;
    
    await updateProperty(propertyId, {
      guarantee_signed: null,
    });
    
    // Clear completion
    await updateTask("guaranteeSigned", PHASE, {
      is_completed: false,
    });
  };

  // Handle guarantee URL update
  const handleGuaranteeUrlUpdate = useCallback(async (url: string | null) => {
    setGuaranteeUrl(url);
    guaranteeUrlRef.current = url;
    
    await updateProperty(propertyId, {
      guarantee_file_url: url,
    });
    
    // Check completion with the latest values from refs
    await checkGuaranteeCompletion(guaranteeSignedRef.current, url);
  }, [propertyId, updateProperty, checkGuaranteeCompletion]);

  // Wrapper for completion check that always uses current state from refs
  const handleGuaranteeCompletionCheck = useCallback(async () => {
    await checkGuaranteeCompletion(guaranteeSignedRef.current, guaranteeUrlRef.current);
  }, [checkGuaranteeCompletion]);


  return (
    <div className="space-y-6">
      {/* Firma de la Garantía de renta ilimitada de Finaer */}
      <Card 
        id="section-guarantee"
        className={cn(
          "border transition-all shadow-sm",
          getSectionColorClasses(guaranteeCompleted)
        )}
      >
        {/* Título y descripción */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Firma de la Garantía de renta ilimitada de Finaer
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Confirmar que la Garantía de renta ilimitada de Finaer ha sido firmada y subir el documento firmado.
              </p>
            </div>
            {guaranteeCompleted && (
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 border border-gray-300 flex-shrink-0 mt-0.5 ml-3">
                <Check className="h-3 w-3 text-green-600 stroke-[2.5]" />
              </div>
            )}
          </div>
        </div>

        {/* Línea de separación */}
        <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />

        {/* Si está completa, usar accordion para poder colapsar/expandir */}
        {guaranteeCompleted ? (
          <Accordion
            type="single"
            collapsible
            value={guaranteeSectionOpen ? "guarantee" : ""}
            onValueChange={(value) => {
              const wasOpen = guaranteeSectionOpen;
              const isCollapsing = wasOpen && value === "";
              const isExpanding = !wasOpen && value === "guarantee";
              
              // Guardar posición del scroll antes de cualquier cambio
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
              
              if (isCollapsing) {
                setGuaranteeSectionOpen(false);
              } else if (isExpanding) {
                setGuaranteeSectionOpen(true);
              } else {
                setGuaranteeSectionOpen(value === "guarantee");
              }
              
              // Restaurar posición después de que React actualice el DOM
              requestAnimationFrame(() => {
                window.scrollTo({
                  top: scrollTop,
                  left: scrollLeft,
                  behavior: 'auto'
                });
              });
            }}
          >
            <AccordionItem value="guarantee" className="border-none">
              <AccordionTrigger className={cn(
                "px-4 py-3 hover:no-underline relative",
                guaranteeSectionOpen ? "justify-end" : "justify-between"
              )}>
                {!guaranteeSectionOpen && (
                  <span className="text-sm text-muted-foreground absolute inset-0 flex items-center justify-center pointer-events-none">Ver campos</span>
                )}
                {!guaranteeSectionOpen && <span className="invisible">placeholder</span>}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Display guarantee ID */}
                  <div className="flex items-center justify-between p-4 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors bg-white dark:bg-[#1F2937] hover:bg-[#F9FAFB] dark:hover:bg-[#111827]">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-[#F3F4F6] dark:bg-[#374151] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#111827] dark:text-[#F9FAFB] uppercase tracking-wide mb-1">
                          ID de la garantía
                        </p>
                        <p className={`text-sm font-semibold ${supabaseProperty?.guarantee_id ? 'text-[#6B7280] dark:text-[#9CA3AF]' : 'text-[#9CA3AF] dark:text-[#6B7280]'}`}>
                          {supabaseProperty?.guarantee_id || "No disponible"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Radio buttons */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        ¿Se ha firmado la Garantía de renta ilimitada de Finaer?
                      </Label>
                      {guaranteeSigned !== null && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleClearGuaranteeSigned();
                          }}
                          className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Borrar selección
                        </Button>
                      )}
                    </div>
                    <RadioGroup
                      value={guaranteeSigned === null ? "" : guaranteeSigned === true ? "yes" : "no"}
                      onValueChange={handleGuaranteeSignedChange}
                      className="flex items-center gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="guarantee-signed-yes" />
                        <Label htmlFor="guarantee-signed-yes" className="text-sm font-normal cursor-pointer">
                          Sí
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="guarantee-signed-no" />
                        <Label htmlFor="guarantee-signed-no" className="text-sm font-normal cursor-pointer">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Upload field - Solo se muestra si la respuesta es "Sí" */}
                  {guaranteeSigned === true && (
                    <DocumentUploadField
                      label="Documento de garantía firmado"
                      documentTitle="Garantía de renta ilimitada de Finaer"
                      fieldName="guarantee_file_url"
                      propertyId={propertyId}
                      value={guaranteeUrl}
                      onUpdate={handleGuaranteeUrlUpdate}
                      onCompletionCheck={handleGuaranteeCompletionCheck}
                      accept=".pdf,.doc,.docx"
                    />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <CardContent className="space-y-4 px-4 py-4">
            {/* Display guarantee ID */}
            <div className="flex items-center justify-between p-4 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors bg-white dark:bg-[#1F2937] hover:bg-[#F9FAFB] dark:hover:bg-[#111827]">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-[#F3F4F6] dark:bg-[#374151] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#111827] dark:text-[#F9FAFB] uppercase tracking-wide mb-1">
                    ID de la garantía
                  </p>
                  <p className={`text-sm font-semibold ${supabaseProperty?.guarantee_id ? 'text-[#6B7280] dark:text-[#9CA3AF]' : 'text-[#9CA3AF] dark:text-[#6B7280]'}`}>
                    {supabaseProperty?.guarantee_id || "No disponible"}
                  </p>
                </div>
              </div>
            </div>

            {/* Radio buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  ¿Se ha firmado la Garantía de renta ilimitada de Finaer?
                </Label>
                {guaranteeSigned !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClearGuaranteeSigned();
                    }}
                    className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Borrar selección
                  </Button>
                )}
              </div>
              <RadioGroup
                value={guaranteeSigned === null ? "" : guaranteeSigned === true ? "yes" : "no"}
                onValueChange={handleGuaranteeSignedChange}
                className="flex items-center gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="guarantee-signed-yes" />
                  <Label htmlFor="guarantee-signed-yes" className="text-sm font-normal cursor-pointer">
                    Sí
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="guarantee-signed-no" />
                  <Label htmlFor="guarantee-signed-no" className="text-sm font-normal cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Upload field - Solo se muestra si la respuesta es "Sí" */}
            {guaranteeSigned === true && (
              <DocumentUploadField
                label="Documento de garantía firmado"
                documentTitle="Garantía de renta ilimitada de Finaer"
                fieldName="guarantee_file_url"
                propertyId={propertyId}
                value={guaranteeUrl}
                onUpdate={handleGuaranteeUrlUpdate}
                onCompletionCheck={handleGuaranteeCompletionCheck}
                accept=".pdf,.doc,.docx"
              />
            )}
          </CardContent>
        )}
      </Card>

    </div>
  );
}
