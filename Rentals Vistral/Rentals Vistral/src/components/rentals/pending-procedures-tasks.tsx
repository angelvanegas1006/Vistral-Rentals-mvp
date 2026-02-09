"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePropertyTasks } from "@/hooks/use-property-tasks";
import { useProperty } from "@/hooks/use-property";
import { useUpdateProperty } from "@/hooks/use-update-property";
import { Check, Shield, X, Zap, Droplets, Flame, Package, FileText, Upload, Trash2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentUploadField } from "@/components/rentals/document-upload-field";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SuppliesDisplaySection } from "@/components/rentals/supplies-display-section";
import { deleteDocument } from "@/lib/document-upload";
import { DocumentUploadModal } from "@/components/rentals/document-upload-modal";
import { DocumentPreviewModal } from "@/components/rentals/document-preview-modal";

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
  
  // Deposit state
  const [depositResponsible, setDepositResponsible] = useState<"Prophero" | "Inversor" | null>(null);
  const [depositReceiptUrl, setDepositReceiptUrl] = useState<string | null>(null);
  
  // First rent payment state
  const [firstRentPaymentUrl, setFirstRentPaymentUrl] = useState<string | null>(null);
  
  // Refs to track latest values for completion checks
  const guaranteeSignedRef = useRef<boolean | null>(null);
  const guaranteeUrlRef = useRef<string | null>(null);
  const depositResponsibleRef = useRef<"Prophero" | "Inversor" | null>(null);
  const depositReceiptUrlRef = useRef<string | null>(null);
  const firstRentPaymentUrlRef = useRef<string | null>(null);
  
  // Keep refs in sync with state
  useEffect(() => {
    guaranteeSignedRef.current = guaranteeSigned;
  }, [guaranteeSigned]);
  
  useEffect(() => {
    guaranteeUrlRef.current = guaranteeUrl;
  }, [guaranteeUrl]);

  useEffect(() => {
    depositResponsibleRef.current = depositResponsible;
  }, [depositResponsible]);

  useEffect(() => {
    depositReceiptUrlRef.current = depositReceiptUrl;
  }, [depositReceiptUrl]);

  useEffect(() => {
    firstRentPaymentUrlRef.current = firstRentPaymentUrl;
  }, [firstRentPaymentUrl]);
  
  // Get completion status
  const guaranteeCompleted = isTaskCompleted("guaranteeSigned", PHASE);
  const depositCompleted = isTaskCompleted("depositReceipt", PHASE);
  const firstRentPaymentCompleted = isTaskCompleted("firstRentPayment", PHASE);
  
  // Initialize collapse state
  const [guaranteeSectionOpen, setGuaranteeSectionOpen] = useState(() => {
    return !guaranteeCompleted;
  });
  
  const [depositSectionOpen, setDepositSectionOpen] = useState(() => {
    return !depositCompleted;
  });
  
  const [firstRentPaymentSectionOpen, setFirstRentPaymentSectionOpen] = useState(() => {
    return !firstRentPaymentCompleted;
  });
  
  const hasInitializedCollapse = useRef(false);
  useEffect(() => {
    if (!tasksLoading && !hasInitializedCollapse.current) {
      setGuaranteeSectionOpen(!guaranteeCompleted);
      hasInitializedCollapse.current = true;
    }
  }, [tasksLoading, guaranteeCompleted]);

  const hasInitializedDepositCollapse = useRef(false);
  useEffect(() => {
    if (!tasksLoading && !hasInitializedDepositCollapse.current) {
      setDepositSectionOpen(!depositCompleted);
      hasInitializedDepositCollapse.current = true;
    }
  }, [tasksLoading, depositCompleted]);

  const hasInitializedFirstRentPaymentCollapse = useRef(false);
  useEffect(() => {
    if (!tasksLoading && !hasInitializedFirstRentPaymentCollapse.current) {
      setFirstRentPaymentSectionOpen(!firstRentPaymentCompleted);
      hasInitializedFirstRentPaymentCollapse.current = true;
    }
  }, [tasksLoading, firstRentPaymentCompleted]);

  // Helper function to get section color classes
  const getSectionColorClasses = (completed: boolean) => {
    if (completed) {
      return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30";
    }
    return "border-gray-200 dark:border-gray-700";
  };

  // Track initialization to prevent overwriting user changes
  const hasInitializedFromProperty = useRef(false);
  
  // Sync state when property updates from elsewhere and check completion
  useEffect(() => {
    if (!supabaseProperty || tasksLoading) return;
    
    if (!hasInitializedFromProperty.current) {
      // Initial load: initialize state
      if (supabaseProperty.guarantee_signed !== null && supabaseProperty.guarantee_signed !== undefined) {
        setGuaranteeSigned(supabaseProperty.guarantee_signed);
        guaranteeSignedRef.current = supabaseProperty.guarantee_signed;
      }
      
      const initialUrl = supabaseProperty.guarantee_file_url || null;
      setGuaranteeUrl(initialUrl);
      guaranteeUrlRef.current = initialUrl;
      
      // Initialize deposit state
      if (supabaseProperty.deposit_responsible !== null && supabaseProperty.deposit_responsible !== undefined) {
        setDepositResponsible(supabaseProperty.deposit_responsible as "Prophero" | "Inversor");
        depositResponsibleRef.current = supabaseProperty.deposit_responsible as "Prophero" | "Inversor";
      }
      
      const initialDepositUrl = supabaseProperty.deposit_receipt_file_url || null;
      setDepositReceiptUrl(initialDepositUrl);
      depositReceiptUrlRef.current = initialDepositUrl;
      
      // Initialize first rent payment state
      const initialFirstRentPaymentUrl = supabaseProperty.first_rent_payment_file_url || null;
      setFirstRentPaymentUrl(initialFirstRentPaymentUrl);
      firstRentPaymentUrlRef.current = initialFirstRentPaymentUrl;
      
      hasInitializedFromProperty.current = true;
    } else {
      // Property updated externally: sync state if changed
      if (supabaseProperty.guarantee_signed !== guaranteeSignedRef.current) {
        const newSigned = supabaseProperty.guarantee_signed !== null && supabaseProperty.guarantee_signed !== undefined 
          ? supabaseProperty.guarantee_signed 
          : null;
        setGuaranteeSigned(newSigned);
        guaranteeSignedRef.current = newSigned;
      }
      
      const newUrl = supabaseProperty.guarantee_file_url || null;
      if (newUrl !== guaranteeUrlRef.current) {
        setGuaranteeUrl(newUrl);
        guaranteeUrlRef.current = newUrl;
      }
      
      // Sync deposit state if changed
      if (supabaseProperty.deposit_responsible !== depositResponsibleRef.current) {
        const newResponsible = supabaseProperty.deposit_responsible !== null && supabaseProperty.deposit_responsible !== undefined 
          ? supabaseProperty.deposit_responsible as "Prophero" | "Inversor"
          : null;
        setDepositResponsible(newResponsible);
        depositResponsibleRef.current = newResponsible;
      }
      
      const newDepositUrl = supabaseProperty.deposit_receipt_file_url || null;
      if (newDepositUrl !== depositReceiptUrlRef.current) {
        setDepositReceiptUrl(newDepositUrl);
        depositReceiptUrlRef.current = newDepositUrl;
      }
      
      // Sync first rent payment state if changed
      const newFirstRentPaymentUrl = supabaseProperty.first_rent_payment_file_url || null;
      if (newFirstRentPaymentUrl !== firstRentPaymentUrlRef.current) {
        setFirstRentPaymentUrl(newFirstRentPaymentUrl);
        firstRentPaymentUrlRef.current = newFirstRentPaymentUrl;
      }
    }
    
    // Always check completion after state sync
    const currentSigned = guaranteeSignedRef.current;
    const currentUrl = guaranteeUrlRef.current;
    const isComplete = currentSigned === true && currentUrl !== null && currentUrl !== undefined;
    
    updateTask("guaranteeSigned", PHASE, {
      is_completed: isComplete,
    }).catch((error) => {
      console.error("Error checking guarantee completion:", error);
    });
    
    // Check deposit completion
    const currentDepositResponsible = depositResponsibleRef.current;
    const currentDepositUrl = depositReceiptUrlRef.current;
    const depositIsComplete = currentDepositResponsible === "Inversor" || 
      (currentDepositResponsible === "Prophero" && currentDepositUrl !== null && currentDepositUrl !== undefined);
    
    updateTask("depositReceipt", PHASE, {
      is_completed: depositIsComplete,
    }).catch((error) => {
      console.error("Error checking deposit completion:", error);
    });
    
    // Check first rent payment completion
    const currentFirstRentPaymentUrl = firstRentPaymentUrlRef.current;
    const firstRentPaymentIsComplete = currentFirstRentPaymentUrl !== null && currentFirstRentPaymentUrl !== undefined;
    
    updateTask("firstRentPayment", PHASE, {
      is_completed: firstRentPaymentIsComplete,
    }).catch((error) => {
      console.error("Error checking first rent payment completion:", error);
    });
  }, [supabaseProperty, tasksLoading, updateTask]);

  // Check if guarantee section can be completed
  const checkGuaranteeCompletion = useCallback(async (signed?: boolean | null, url?: string | null) => {
    // Use provided values or fall back to refs (which always have latest values)
    const currentSigned = signed !== undefined ? signed : guaranteeSignedRef.current;
    const currentUrl = url !== undefined ? url : guaranteeUrlRef.current;
    
    const isComplete = currentSigned === true && currentUrl !== null && currentUrl !== undefined;
    
    await updateTask("guaranteeSigned", PHASE, {
      is_completed: isComplete,
    });
  }, [updateTask]);

  // Handle guarantee signed change
  const handleGuaranteeSignedChange = async (value: string) => {
    const signed = value === "yes";
    setGuaranteeSigned(signed);
    guaranteeSignedRef.current = signed;
    
    // Keep the file URL even when "No" is selected
    // The URL will only be deleted when the user clicks the delete button
    const currentUrl = guaranteeUrlRef.current;
    
    await updateProperty(propertyId, {
      guarantee_signed: signed,
    });
    
    // Check completion with the new value directly
    await checkGuaranteeCompletion(signed, currentUrl);
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

  // Check if deposit section can be completed
  const checkDepositCompletion = useCallback(async (responsible?: "Prophero" | "Inversor" | null, url?: string | null) => {
    const currentResponsible = responsible !== undefined ? responsible : depositResponsibleRef.current;
    const currentUrl = url !== undefined ? url : depositReceiptUrlRef.current;
    
    // Complete if responsible is "Inversor" OR (responsible is "Prophero" AND document is uploaded)
    const isComplete = currentResponsible === "Inversor" || 
      (currentResponsible === "Prophero" && currentUrl !== null && currentUrl !== undefined);
    
    await updateTask("depositReceipt", PHASE, {
      is_completed: isComplete,
    });
  }, [updateTask]);

  // Handle deposit responsible change
  const handleDepositResponsibleChange = async (value: string) => {
    const responsible = value === "prophero" ? "Prophero" : "Inversor";
    setDepositResponsible(responsible);
    depositResponsibleRef.current = responsible;
    
    const currentUrl = depositReceiptUrlRef.current;
    
    await updateProperty(propertyId, {
      deposit_responsible: responsible,
    });
    
    // Check completion with the new value directly
    await checkDepositCompletion(responsible, currentUrl);
  };

  // Handle clear deposit selection
  const handleClearDepositResponsible = async () => {
    setDepositResponsible(null);
    depositResponsibleRef.current = null;
    
    await updateProperty(propertyId, {
      deposit_responsible: null,
    });
    
    // Clear completion
    await updateTask("depositReceipt", PHASE, {
      is_completed: false,
    });
  };

  // Handle deposit receipt URL update
  const handleDepositReceiptUrlUpdate = useCallback(async (url: string | null) => {
    setDepositReceiptUrl(url);
    depositReceiptUrlRef.current = url;
    
    await updateProperty(propertyId, {
      deposit_receipt_file_url: url,
    });
    
    // Check completion with the latest values from refs
    await checkDepositCompletion(depositResponsibleRef.current, url);
  }, [propertyId, updateProperty, checkDepositCompletion]);

  // Wrapper for deposit completion check that always uses current state from refs
  const handleDepositCompletionCheck = useCallback(async () => {
    await checkDepositCompletion(depositResponsibleRef.current, depositReceiptUrlRef.current);
  }, [checkDepositCompletion]);

  // Check if first rent payment section can be completed
  const checkFirstRentPaymentCompletion = useCallback(async (url?: string | null) => {
    const currentUrl = url !== undefined ? url : firstRentPaymentUrlRef.current;
    
    const isComplete = currentUrl !== null && currentUrl !== undefined;
    
    await updateTask("firstRentPayment", PHASE, {
      is_completed: isComplete,
    });
  }, [updateTask]);

  // Handle first rent payment URL update
  const handleFirstRentPaymentUrlUpdate = useCallback(async (url: string | null) => {
    setFirstRentPaymentUrl(url);
    firstRentPaymentUrlRef.current = url;
    
    await updateProperty(propertyId, {
      first_rent_payment_file_url: url,
    });
    
    // Check completion with the latest values from refs
    await checkFirstRentPaymentCompletion(url);
  }, [propertyId, updateProperty, checkFirstRentPaymentCompletion]);

  // Wrapper for first rent payment completion check that always uses current state from refs
  const handleFirstRentPaymentCompletionCheck = useCallback(async () => {
    await checkFirstRentPaymentCompletion(firstRentPaymentUrlRef.current);
  }, [checkFirstRentPaymentCompletion]);


  return (
    <div className="space-y-6">
      {/* Firma de la Garantía de renta ilimitada de Finaer */}
      <Card 
        id="section-guarantee-signing"
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

                  {/* Upload field - Solo se muestra cuando la respuesta es "Sí" */}
                  {guaranteeSigned === true && (
                    <DocumentUploadField
                      label="Documento de garantía firmado"
                      documentTitle="Garantía de renta ilimitada de Finaer"
                      fieldName="guarantee_file_url"
                      propertyId={propertyId}
                      value={guaranteeUrl || supabaseProperty?.guarantee_file_url || null}
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

            {/* Upload field - Solo se muestra cuando la respuesta es "Sí" */}
            {guaranteeSigned === true && (
              <DocumentUploadField
                label="Documento de garantía firmado"
                documentTitle="Garantía de renta ilimitada de Finaer"
                fieldName="guarantee_file_url"
                propertyId={propertyId}
                value={guaranteeUrl || supabaseProperty?.guarantee_file_url || null}
                onUpdate={handleGuaranteeUrlUpdate}
                onCompletionCheck={handleGuaranteeCompletionCheck}
                accept=".pdf,.doc,.docx"
              />
            )}
          </CardContent>
        )}
      </Card>

      {/* Cambio de suministros */}
      <SuppliesChangeSection 
        propertyId={propertyId}
        supabaseProperty={supabaseProperty}
        updateProperty={updateProperty}
        isTaskCompleted={isTaskCompleted}
        updateTask={updateTask}
        PHASE={PHASE}
        getSectionColorClasses={getSectionColorClasses}
      />

      {/* Depósito de la fianza */}
      <Card 
        id="section-deposit"
        className={cn(
          "border transition-all shadow-sm",
          getSectionColorClasses(depositCompleted)
        )}
      >
        {/* Título y descripción */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Depósito de la fianza
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Selecciona quién es el responsable del depósito de la fianza. Si es Prophero, deberás subir el resguardo del depósito.
              </p>
            </div>
            {depositCompleted && (
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 border border-gray-300 flex-shrink-0 mt-0.5 ml-3">
                <Check className="h-3 w-3 text-green-600 stroke-[2.5]" />
              </div>
            )}
          </div>
        </div>

        {/* Línea de separación */}
        <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />

        {/* Si está completa, usar accordion para poder colapsar/expandir */}
        {depositCompleted ? (
          <Accordion
            type="single"
            collapsible
            value={depositSectionOpen ? "deposit" : ""}
            onValueChange={(value) => {
              const wasOpen = depositSectionOpen;
              const isCollapsing = wasOpen && value === "";
              const isExpanding = !wasOpen && value === "deposit";
              
              // Guardar posición del scroll antes de cualquier cambio
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
              
              if (isCollapsing) {
                setDepositSectionOpen(false);
              } else if (isExpanding) {
                setDepositSectionOpen(true);
              } else {
                setDepositSectionOpen(value === "deposit");
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
            <AccordionItem value="deposit" className="border-none">
              <AccordionTrigger className={cn(
                "px-4 py-3 hover:no-underline relative",
                depositSectionOpen ? "justify-end" : "justify-between"
              )}>
                {!depositSectionOpen && (
                  <span className="text-sm text-muted-foreground absolute inset-0 flex items-center justify-center pointer-events-none">Ver campos</span>
                )}
                {!depositSectionOpen && <span className="invisible">placeholder</span>}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Radio buttons */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        ¿Quién es el responsable de la fianza?
                      </Label>
                      {depositResponsible !== null && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleClearDepositResponsible();
                          }}
                          className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Borrar selección
                        </Button>
                      )}
                    </div>
                    <RadioGroup
                      value={depositResponsible === null ? "" : depositResponsible === "Prophero" ? "prophero" : "investor"}
                      onValueChange={handleDepositResponsibleChange}
                      className="flex items-center gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="prophero" id="deposit-responsible-prophero" />
                        <Label htmlFor="deposit-responsible-prophero" className="text-sm font-normal cursor-pointer">
                          Prophero
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="investor" id="deposit-responsible-investor" />
                        <Label htmlFor="deposit-responsible-investor" className="text-sm font-normal cursor-pointer">
                          Inversor
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Upload field - Solo se muestra cuando el responsable es "Prophero" */}
                  {depositResponsible === "Prophero" && (
                    <DocumentUploadField
                      label="Resguardo del depósito de la fianza"
                      documentTitle="Resguardo del depósito de la fianza"
                      fieldName="deposit_receipt_file_url"
                      propertyId={propertyId}
                      value={depositReceiptUrl || supabaseProperty?.deposit_receipt_file_url || null}
                      onUpdate={handleDepositReceiptUrlUpdate}
                      onCompletionCheck={handleDepositCompletionCheck}
                      accept=".pdf,.doc,.docx"
                    />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <CardContent className="space-y-4 px-4 py-4">
            {/* Radio buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  ¿Quién es el responsable de la fianza?
                </Label>
                {depositResponsible !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClearDepositResponsible();
                    }}
                    className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Borrar selección
                  </Button>
                )}
              </div>
              <RadioGroup
                value={depositResponsible === null ? "" : depositResponsible === "Prophero" ? "prophero" : "investor"}
                onValueChange={handleDepositResponsibleChange}
                className="flex items-center gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="prophero" id="deposit-responsible-prophero" />
                  <Label htmlFor="deposit-responsible-prophero" className="text-sm font-normal cursor-pointer">
                    Prophero
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="investor" id="deposit-responsible-investor" />
                  <Label htmlFor="deposit-responsible-investor" className="text-sm font-normal cursor-pointer">
                    Inversor
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Upload field - Solo se muestra cuando el responsable es "Prophero" */}
            {depositResponsible === "Prophero" && (
              <DocumentUploadField
                label="Resguardo del depósito de la fianza"
                documentTitle="Resguardo del depósito de la fianza"
                fieldName="deposit_receipt_file_url"
                propertyId={propertyId}
                value={depositReceiptUrl || supabaseProperty?.deposit_receipt_file_url || null}
                onUpdate={handleDepositReceiptUrlUpdate}
                onCompletionCheck={handleDepositCompletionCheck}
                accept=".pdf,.doc,.docx"
              />
            )}
          </CardContent>
        )}
      </Card>

      {/* Transferencia del mes en curso */}
      <Card 
        id="section-first-rent-payment"
        className={cn(
          "border transition-all shadow-sm",
          getSectionColorClasses(firstRentPaymentCompleted)
        )}
      >
        {/* Título y descripción */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Transferencia del mes en curso
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                El inquilino debe realizar la transferencia por el importe de la renta del mes en curso. Sube el comprobante de transferencia.
              </p>
            </div>
            {firstRentPaymentCompleted && (
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 border border-gray-300 flex-shrink-0 mt-0.5 ml-3">
                <Check className="h-3 w-3 text-green-600 stroke-[2.5]" />
              </div>
            )}
          </div>
        </div>

        {/* Línea de separación */}
        <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />

        {/* Si está completa, usar accordion para poder colapsar/expandir */}
        {firstRentPaymentCompleted ? (
          <Accordion
            type="single"
            collapsible
            value={firstRentPaymentSectionOpen ? "first-rent-payment" : ""}
            onValueChange={(value) => {
              const wasOpen = firstRentPaymentSectionOpen;
              const isCollapsing = wasOpen && value === "";
              const isExpanding = !wasOpen && value === "first-rent-payment";
              
              // Guardar posición del scroll antes de cualquier cambio
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
              
              if (isCollapsing) {
                setFirstRentPaymentSectionOpen(false);
              } else if (isExpanding) {
                setFirstRentPaymentSectionOpen(true);
              } else {
                setFirstRentPaymentSectionOpen(value === "first-rent-payment");
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
            <AccordionItem value="first-rent-payment" className="border-none">
              <AccordionTrigger className={cn(
                "px-4 py-3 hover:no-underline relative",
                firstRentPaymentSectionOpen ? "justify-end" : "justify-between"
              )}>
                {!firstRentPaymentSectionOpen && (
                  <span className="text-sm text-muted-foreground absolute inset-0 flex items-center justify-center pointer-events-none">Ver campos</span>
                )}
                {!firstRentPaymentSectionOpen && <span className="invisible">placeholder</span>}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <DocumentUploadField
                    label="Comprobante de transferencia del mes en curso"
                    documentTitle="Comprobante de transferencia del mes en curso"
                    fieldName="first_rent_payment_file_url"
                    propertyId={propertyId}
                    value={firstRentPaymentUrl || supabaseProperty?.first_rent_payment_file_url || null}
                    onUpdate={handleFirstRentPaymentUrlUpdate}
                    onCompletionCheck={handleFirstRentPaymentCompletionCheck}
                    accept=".pdf,.doc,.docx"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <CardContent className="space-y-4 px-4 py-4">
            <DocumentUploadField
              label="Comprobante de transferencia del mes en curso"
              documentTitle="Comprobante de transferencia del mes en curso"
              fieldName="first_rent_payment_file_url"
              propertyId={propertyId}
              value={firstRentPaymentUrl || supabaseProperty?.first_rent_payment_file_url || null}
              onUpdate={handleFirstRentPaymentUrlUpdate}
              onCompletionCheck={handleFirstRentPaymentCompletionCheck}
              accept=".pdf,.doc,.docx"
            />
          </CardContent>
        )}
      </Card>

    </div>
  );
}

// Supplies Change Section Component
interface SuppliesChangeSectionProps {
  propertyId: string;
  supabaseProperty: any;
  updateProperty: (id: string, updates: any) => Promise<void>;
  isTaskCompleted: (taskType: string, phase?: string) => boolean;
  updateTask: (taskType: string, phase: string, updates: { is_completed?: boolean; task_data?: Record<string, any> }) => Promise<void>;
  PHASE: string;
  getSectionColorClasses: (completed: boolean) => string;
}

function SuppliesChangeSection({
  propertyId,
  supabaseProperty,
  updateProperty,
  isTaskCompleted,
  updateTask,
  PHASE,
  getSectionColorClasses,
}: SuppliesChangeSectionProps) {
  // State for toggles
  const [toggles, setToggles] = useState<{
    electricity: boolean;
    water: boolean;
    gas: boolean;
    other: boolean;
  }>({
    electricity: false,
    water: false,
    gas: false,
    other: false,
  });

  // State for tenant contracts
  const [tenantContractElectricity, setTenantContractElectricity] = useState<string | null>(null);
  const [tenantContractWater, setTenantContractWater] = useState<string | null>(null);
  const [tenantContractGas, setTenantContractGas] = useState<string | null>(null);
  const [tenantContractOther, setTenantContractOther] = useState<Array<{ title: string; url: string; createdAt: string }>>([]);

  // State for modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ open: boolean; url: string | null; label: string }>({
    open: false,
    url: null,
    label: "",
  });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    url: string | null;
    label: string;
  }>({ open: false, url: null, label: "" });

  const hasInitializedToggles = useRef(false);
  const hasInitializedContracts = useRef(false);
  // Flag to prevent refetch from overwriting local state while a save is in progress
  const isSavingToggles = useRef(false);

  // Refs to track latest values for completion checks
  const tenantContractElectricityRef = useRef<string | null>(null);
  const tenantContractWaterRef = useRef<string | null>(null);
  const tenantContractGasRef = useRef<string | null>(null);
  const tenantContractOtherRef = useRef<Array<{ title: string; url: string; createdAt: string }>>([]);
  const togglesRef = useRef(toggles);

  // Keep refs in sync with state
  useEffect(() => {
    tenantContractElectricityRef.current = tenantContractElectricity;
  }, [tenantContractElectricity]);

  useEffect(() => {
    tenantContractWaterRef.current = tenantContractWater;
  }, [tenantContractWater]);

  useEffect(() => {
    tenantContractGasRef.current = tenantContractGas;
  }, [tenantContractGas]);

  useEffect(() => {
    tenantContractOtherRef.current = tenantContractOther;
  }, [tenantContractOther]);

  useEffect(() => {
    togglesRef.current = toggles;
  }, [toggles]);

  // Helper: parse tenant_supplies_toggles from Supabase (may be string or object)
  const parseTogglesFromDB = (raw: any): { electricity: boolean; water: boolean; gas: boolean; other: boolean } | null => {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0 &&
          (parsed.electricity !== undefined || parsed.water !== undefined || parsed.gas !== undefined || parsed.other !== undefined)) {
        return {
          electricity: parsed.electricity === true,
          water: parsed.water === true,
          gas: parsed.gas === true,
          other: parsed.other === true,
        };
      }
    } catch (e) {
      console.error("Error parsing tenant_supplies_toggles:", e);
    }
    return null;
  };

  // Helper: compute initial toggles from investor documents
  const computeTogglesFromInvestorDocs = (prop: any) => ({
    electricity: !!(prop.doc_contract_electricity || prop.doc_bill_electricity),
    water: !!(prop.doc_contract_water || prop.doc_bill_water),
    gas: !!(prop.doc_contract_gas || prop.doc_bill_gas),
    other: !!(prop.custom_supplies_documents &&
              Array.isArray(prop.custom_supplies_documents) &&
              prop.custom_supplies_documents.length > 0),
  });

  // Initialize toggles: from saved DB state, or from investor documents (first time entering phase 5)
  useEffect(() => {
    if (!supabaseProperty || hasInitializedToggles.current) return;

    const savedToggles = parseTogglesFromDB(supabaseProperty.tenant_supplies_toggles);

    if (savedToggles) {
      // Toggles already exist in DB -> load them
      console.log("📥 Loading saved toggle states from database:", savedToggles);
      setToggles(savedToggles);
      togglesRef.current = savedToggles;
    } else {
      // First time: initialize from investor documents and save to DB
      const initialToggles = computeTogglesFromInvestorDocs(supabaseProperty);
      console.log("🆕 Initializing toggles from investor documents:", initialToggles);
      setToggles(initialToggles);
      togglesRef.current = initialToggles;

      // Save initial state to DB
      isSavingToggles.current = true;
      updateProperty(propertyId, {
        tenant_supplies_toggles: initialToggles as any,
      }).then((ok) => {
        if (ok) {
          console.log("✅ Initial toggle states saved to DB:", initialToggles);
        } else {
          console.error("❌ Failed to save initial toggle states to DB");
        }
      }).catch((err) => {
        console.error("❌ Error saving initial toggle states:", err);
      }).finally(() => {
        isSavingToggles.current = false;
      });
    }

    hasInitializedToggles.current = true;
  }, [supabaseProperty, propertyId, updateProperty]);

  // Initialize tenant contracts from database
  useEffect(() => {
    if (supabaseProperty && !hasInitializedContracts.current) {
      const electricity = supabaseProperty.tenant_contract_electricity || null;
      const water = supabaseProperty.tenant_contract_water || null;
      const gas = supabaseProperty.tenant_contract_gas || null;
      const other = (supabaseProperty.tenant_contract_other && Array.isArray(supabaseProperty.tenant_contract_other)) 
        ? supabaseProperty.tenant_contract_other 
        : [];

      setTenantContractElectricity(electricity);
      setTenantContractWater(water);
      setTenantContractGas(gas);
      setTenantContractOther(other);

      // Update refs immediately
      tenantContractElectricityRef.current = electricity;
      tenantContractWaterRef.current = water;
      tenantContractGasRef.current = gas;
      tenantContractOtherRef.current = other;

      hasInitializedContracts.current = true;
    }
  }, [supabaseProperty]);

  // Handle toggle change
  const handleToggleChange = async (supplyType: 'electricity' | 'water' | 'gas' | 'other', value: boolean) => {
    const newToggles = { ...toggles, [supplyType]: value };
    setToggles(newToggles);
    togglesRef.current = newToggles;

    console.log("🔄 Toggle changed:", { supplyType, value, newToggles });

    // Save toggle state to DB
    isSavingToggles.current = true;
    try {
      const togglesToSave = {
        electricity: newToggles.electricity === true,
        water: newToggles.water === true,
        gas: newToggles.gas === true,
        other: newToggles.other === true,
      };

      const result = await updateProperty(propertyId, {
        tenant_supplies_toggles: togglesToSave as any,
      });

      if (!result) {
        console.error("❌ Failed to save toggle state to DB");
        // Revert on error
        setToggles(toggles);
        togglesRef.current = toggles;
        return;
      }

      console.log("✅ Toggle state saved to DB:", togglesToSave);
    } catch (error) {
      console.error("❌ Error saving toggle state:", error);
      // Revert on error
      setToggles(toggles);
      togglesRef.current = toggles;
      return;
    } finally {
      isSavingToggles.current = false;
    }

    // If toggle is disabled, delete the corresponding contract
    if (!value) {
      if (supplyType === 'electricity' && tenantContractElectricity) {
        await deleteDocument('tenant_contract_electricity', propertyId, tenantContractElectricity);
        setTenantContractElectricity(null);
        tenantContractElectricityRef.current = null;
        await updateProperty(propertyId, { tenant_contract_electricity: null });
      } else if (supplyType === 'water' && tenantContractWater) {
        await deleteDocument('tenant_contract_water', propertyId, tenantContractWater);
        setTenantContractWater(null);
        tenantContractWaterRef.current = null;
        await updateProperty(propertyId, { tenant_contract_water: null });
      } else if (supplyType === 'gas' && tenantContractGas) {
        await deleteDocument('tenant_contract_gas', propertyId, tenantContractGas);
        setTenantContractGas(null);
        tenantContractGasRef.current = null;
        await updateProperty(propertyId, { tenant_contract_gas: null });
      } else if (supplyType === 'other' && tenantContractOther.length > 0) {
        for (const doc of tenantContractOther) {
          await deleteDocument('tenant_contract_other', propertyId, doc.url);
        }
        setTenantContractOther([]);
        tenantContractOtherRef.current = [];
        await updateProperty(propertyId, { tenant_contract_other: [] });
      }
    }

    // Check completion
    await checkSuppliesCompletion(newToggles);
  };

  // Check if supplies section is complete
  const checkSuppliesCompletion = useCallback(async (currentToggles?: typeof toggles) => {
    const togglesToCheck = currentToggles || togglesRef.current;
    
    // If no toggles are enabled, section is complete
    const hasAnyToggleEnabled = Object.values(togglesToCheck).some(v => v === true);
    if (!hasAnyToggleEnabled) {
      await updateTask("suppliesChange", PHASE, { is_completed: true });
      return;
    }

    // Check if all required contracts are uploaded (use refs for latest values)
    const requiredContracts: boolean[] = [];
    
    if (togglesToCheck.electricity) {
      const hasContract = !!(tenantContractElectricityRef.current && 
                            typeof tenantContractElectricityRef.current === 'string' && 
                            tenantContractElectricityRef.current.trim() !== '');
      requiredContracts.push(hasContract);
    }
    if (togglesToCheck.water) {
      const hasContract = !!(tenantContractWaterRef.current && 
                            typeof tenantContractWaterRef.current === 'string' && 
                            tenantContractWaterRef.current.trim() !== '');
      requiredContracts.push(hasContract);
    }
    if (togglesToCheck.gas) {
      const hasContract = !!(tenantContractGasRef.current && 
                            typeof tenantContractGasRef.current === 'string' && 
                            tenantContractGasRef.current.trim() !== '');
      requiredContracts.push(hasContract);
    }
    if (togglesToCheck.other) {
      const hasContract = Array.isArray(tenantContractOtherRef.current) && 
                         tenantContractOtherRef.current.length > 0;
      requiredContracts.push(hasContract);
    }

    // All toggles in true must have documents uploaded
    const allRequiredUploaded = requiredContracts.length > 0 && requiredContracts.every(v => v === true);
    
    await updateTask("suppliesChange", PHASE, {
      is_completed: allRequiredUploaded,
    });
  }, [updateTask, PHASE]);

  // Handle contract uploads for single fields
  const handleContractUpdate = async (
    supplyType: 'electricity' | 'water' | 'gas',
    url: string | null
  ) => {
    const fieldMap = {
      electricity: { state: tenantContractElectricity, setState: setTenantContractElectricity, ref: tenantContractElectricityRef, field: 'tenant_contract_electricity' },
      water: { state: tenantContractWater, setState: setTenantContractWater, ref: tenantContractWaterRef, field: 'tenant_contract_water' },
      gas: { state: tenantContractGas, setState: setTenantContractGas, ref: tenantContractGasRef, field: 'tenant_contract_gas' },
    };

    const config = fieldMap[supplyType];
    config.setState(url);
    config.ref.current = url; // Update ref immediately
    await updateProperty(propertyId, { [config.field]: url });
    await checkSuppliesCompletion();
  };

  // Handle other contracts (JSONB array)
  const handleOtherContractUpload = async (file: File, title: string) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fieldName", "tenant_contract_other");
      formData.append("propertyId", propertyId);
      formData.append("customTitle", title.trim());

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      const newDocument = {
        title: title.trim(),
        url: data.url,
        createdAt: new Date().toISOString(),
      };

      const updatedArray = [...tenantContractOther, newDocument];
      setTenantContractOther(updatedArray);
      tenantContractOtherRef.current = updatedArray; // Update ref immediately
      await updateProperty(propertyId, { tenant_contract_other: updatedArray });
      await checkSuppliesCompletion();
      setUploadModalOpen(false);
    } catch (error) {
      console.error("Failed to upload other contract:", error);
      alert(`Error al subir el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
      throw error;
    }
  };

  // Handle delete other contract
  const handleDeleteOtherContract = async (url: string) => {
    try {
      await deleteDocument('tenant_contract_other', propertyId, url);
      const updatedArray = tenantContractOther.filter(doc => doc.url !== url);
      setTenantContractOther(updatedArray);
      tenantContractOtherRef.current = updatedArray; // Update ref immediately
      await updateProperty(propertyId, { tenant_contract_other: updatedArray });
      await checkSuppliesCompletion();
      setDeleteConfirmDialog({ open: false, url: null, label: "" });
    } catch (error) {
      console.error("Failed to delete other contract:", error);
      alert(`Error al eliminar el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  const suppliesCompleted = isTaskCompleted("suppliesChange", PHASE);
  const [suppliesSectionOpen, setSuppliesSectionOpen] = useState(() => !suppliesCompleted);

  const hasInitializedSuppliesCollapse = useRef(false);
  useEffect(() => {
    if (!hasInitializedSuppliesCollapse.current) {
      setSuppliesSectionOpen(!suppliesCompleted);
      hasInitializedSuppliesCollapse.current = true;
    }
  }, [suppliesCompleted]);

  // Re-check completion when contracts or toggles change
  useEffect(() => {
    if (hasInitializedContracts.current && hasInitializedToggles.current) {
      checkSuppliesCompletion();
    }
  }, [tenantContractElectricity, tenantContractWater, tenantContractGas, tenantContractOther, toggles, checkSuppliesCompletion]);

  return (
    <Card
      id="section-supplies-change"
      className={cn(
        "border transition-all shadow-sm",
        getSectionColorClasses(suppliesCompleted)
      )}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Cambio de suministros
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona el cambio de titularidad activando los suministros que asumirá el inquilino y sube los nuevos contratos; los servicios desactivados se mantendrán a nombre del propietario. Consulta las facturas y documentos originales al final de la sección para obtener los datos necesarios.
            </p>
          </div>
          {suppliesCompleted && (
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 border border-gray-300 flex-shrink-0 mt-0.5 ml-3">
              <Check className="h-3 w-3 text-green-600 stroke-[2.5]" />
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />

      {suppliesCompleted ? (
        <Accordion
          type="single"
          collapsible
          value={suppliesSectionOpen ? "supplies-change" : ""}
          onValueChange={(value) => {
            const wasOpen = suppliesSectionOpen;
            const isCollapsing = wasOpen && value === "";
            const isExpanding = !wasOpen && value === "supplies-change";
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            if (isCollapsing) {
              setSuppliesSectionOpen(false);
            } else if (isExpanding) {
              setSuppliesSectionOpen(true);
            } else {
              setSuppliesSectionOpen(value === "supplies-change");
            }
            
            requestAnimationFrame(() => {
              window.scrollTo({
                top: scrollTop,
                left: scrollLeft,
                behavior: 'auto'
              });
            });
          }}
        >
          <AccordionItem value="supplies-change" className="border-none">
            <AccordionTrigger className={cn(
              "px-4 py-3 hover:no-underline relative",
              suppliesSectionOpen ? "justify-end" : "justify-between"
            )}>
              {!suppliesSectionOpen && (
                <span className="text-sm text-muted-foreground absolute inset-0 flex items-center justify-center pointer-events-none">Ver campos</span>
              )}
              {!suppliesSectionOpen && <span className="invisible">placeholder</span>}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <SuppliesChangeContent
                supabaseProperty={supabaseProperty}
                toggles={toggles}
                onToggleChange={handleToggleChange}
                tenantContractElectricity={tenantContractElectricity}
                tenantContractWater={tenantContractWater}
                tenantContractGas={tenantContractGas}
                tenantContractOther={tenantContractOther}
                onContractUpdate={handleContractUpdate}
                onOtherContractUpload={handleOtherContractUpload}
                onDeleteOtherContract={handleDeleteOtherContract}
                propertyId={propertyId}
                uploadModalOpen={uploadModalOpen}
                setUploadModalOpen={setUploadModalOpen}
                previewModal={previewModal}
                setPreviewModal={setPreviewModal}
                deleteConfirmDialog={deleteConfirmDialog}
                setDeleteConfirmDialog={setDeleteConfirmDialog}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <CardContent className="space-y-6 px-4 py-4">
          <SuppliesChangeContent
            supabaseProperty={supabaseProperty}
            toggles={toggles}
            onToggleChange={handleToggleChange}
            tenantContractElectricity={tenantContractElectricity}
            tenantContractWater={tenantContractWater}
            tenantContractGas={tenantContractGas}
            tenantContractOther={tenantContractOther}
            onContractUpdate={handleContractUpdate}
            onOtherContractUpload={handleOtherContractUpload}
            onDeleteOtherContract={handleDeleteOtherContract}
            propertyId={propertyId}
            uploadModalOpen={uploadModalOpen}
            setUploadModalOpen={setUploadModalOpen}
            previewModal={previewModal}
            setPreviewModal={setPreviewModal}
            deleteConfirmDialog={deleteConfirmDialog}
            setDeleteConfirmDialog={setDeleteConfirmDialog}
          />
        </CardContent>
      )}
    </Card>
  );
}

// Content component for supplies change section
interface SuppliesChangeContentProps {
  supabaseProperty: any;
  toggles: { electricity: boolean; water: boolean; gas: boolean; other: boolean };
  onToggleChange: (supplyType: 'electricity' | 'water' | 'gas' | 'other', value: boolean) => Promise<void>;
  tenantContractElectricity: string | null;
  tenantContractWater: string | null;
  tenantContractGas: string | null;
  tenantContractOther: Array<{ title: string; url: string; createdAt: string }>;
  onContractUpdate: (supplyType: 'electricity' | 'water' | 'gas', url: string | null) => Promise<void>;
  onOtherContractUpload: (file: File, title: string) => Promise<void>;
  onDeleteOtherContract: (url: string) => Promise<void>;
  propertyId: string;
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  previewModal: { open: boolean; url: string | null; label: string };
  setPreviewModal: (modal: { open: boolean; url: string | null; label: string }) => void;
  deleteConfirmDialog: { open: boolean; url: string | null; label: string };
  setDeleteConfirmDialog: (dialog: { open: boolean; url: string | null; label: string }) => void;
}

function SuppliesChangeContent({
  supabaseProperty,
  toggles,
  onToggleChange,
  tenantContractElectricity,
  tenantContractWater,
  tenantContractGas,
  tenantContractOther,
  onContractUpdate,
  onOtherContractUpload,
  onDeleteOtherContract,
  propertyId,
  uploadModalOpen,
  setUploadModalOpen,
  previewModal,
  setPreviewModal,
  deleteConfirmDialog,
  setDeleteConfirmDialog,
}: SuppliesChangeContentProps) {
  const [ownerDocumentsOpen, setOwnerDocumentsOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Tenant contracts section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Documentos de suministros del Inquilino
        </h3>
        <div className="space-y-4">
          {/* Electricity */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg transition-all overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <Label htmlFor="toggle-electricity" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <Zap className="h-4 w-4" />
                Electricidad
              </Label>
              <Switch
                id="toggle-electricity"
                checked={toggles.electricity}
                onCheckedChange={(checked) => onToggleChange('electricity', checked)}
              />
            </div>
            {toggles.electricity && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <DocumentUploadField
                  label="Contrato de Electricidad del Inquilino"
                  documentTitle="Contrato de Electricidad"
                  fieldName="tenant_contract_electricity"
                  propertyId={propertyId}
                  value={tenantContractElectricity}
                  onUpdate={(url) => onContractUpdate('electricity', url)}
                  accept=".pdf,.doc,.docx"
                />
              </div>
            )}
          </div>

          {/* Water */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg transition-all overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <Label htmlFor="toggle-water" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <Droplets className="h-4 w-4" />
                Agua
              </Label>
              <Switch
                id="toggle-water"
                checked={toggles.water}
                onCheckedChange={(checked) => onToggleChange('water', checked)}
              />
            </div>
            {toggles.water && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <DocumentUploadField
                  label="Contrato de Agua del Inquilino"
                  documentTitle="Contrato de Agua"
                  fieldName="tenant_contract_water"
                  propertyId={propertyId}
                  value={tenantContractWater}
                  onUpdate={(url) => onContractUpdate('water', url)}
                  accept=".pdf,.doc,.docx"
                />
              </div>
            )}
          </div>

          {/* Gas */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg transition-all overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <Label htmlFor="toggle-gas" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <Flame className="h-4 w-4" />
                Gas
              </Label>
              <Switch
                id="toggle-gas"
                checked={toggles.gas}
                onCheckedChange={(checked) => onToggleChange('gas', checked)}
              />
            </div>
            {toggles.gas && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <DocumentUploadField
                  label="Contrato de Gas del Inquilino"
                  documentTitle="Contrato de Gas"
                  fieldName="tenant_contract_gas"
                  propertyId={propertyId}
                  value={tenantContractGas}
                  onUpdate={(url) => onContractUpdate('gas', url)}
                  accept=".pdf,.doc,.docx"
                />
              </div>
            )}
          </div>

          {/* Other */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg transition-all overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <Label htmlFor="toggle-other" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <Package className="h-4 w-4" />
                Otros
              </Label>
              <Switch
                id="toggle-other"
                checked={toggles.other}
                onCheckedChange={(checked) => onToggleChange('other', checked)}
              />
            </div>
            {toggles.other && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                {tenantContractOther.map((doc, index) => (
                  <div
                    key={`${doc.url}-${index}`}
                    className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => setPreviewModal({ open: true, url: doc.url, label: doc.title })}
                    >
                      <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                        <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                          {doc.title}
                        </p>
                        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                          {doc.url.split('/').pop()?.split('?')[0] || "PDF"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmDialog({ open: true, url: doc.url, label: doc.title });
                      }}
                      className="h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="w-full p-2 border border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                  <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Agregar contrato</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Display owner documents - Collapsible */}
      <Accordion
        type="single"
        collapsible
        value={ownerDocumentsOpen ? "owner-documents" : ""}
        onValueChange={(value) => setOwnerDocumentsOpen(value === "owner-documents")}
      >
        <AccordionItem value="owner-documents" className="border-b border-gray-200 dark:border-gray-700">
          <AccordionTrigger className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:no-underline py-4">
            Documentos de suministros del Inversor
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <SuppliesDisplaySection property={supabaseProperty} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Upload Modal for Other Contracts */}
      <DocumentUploadModal
        open={uploadModalOpen}
        onOpenChange={(open) => {
          setUploadModalOpen(open);
        }}
        onUpload={async (file, customTitle) => {
          if (customTitle && customTitle.trim()) {
            await onOtherContractUpload(file, customTitle.trim());
          }
        }}
        label="Contrato Otros Suministros"
        isEdit={false}
        allowCustomTitle={true}
      />

      {/* Preview Modal */}
      <DocumentPreviewModal
        open={previewModal.open && !!previewModal.url}
        onOpenChange={(open) => setPreviewModal({ ...previewModal, open })}
        documentUrl={previewModal.url || undefined}
        documentName={previewModal.label}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmDialog.open && deleteConfirmDialog.url && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ¿Estás seguro de que deseas eliminar "{deleteConfirmDialog.label}"?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmDialog({ open: false, url: null, label: "" })}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirmDialog.url) {
                    onDeleteOtherContract(deleteConfirmDialog.url);
                  }
                }}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
