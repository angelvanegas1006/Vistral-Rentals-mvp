"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePropertyTasks } from "@/hooks/use-property-tasks";
import { useProperty } from "@/hooks/use-property";
import { useUpdateProperty } from "@/hooks/use-update-property";
import { uploadDocument, deleteDocument } from "@/lib/document-upload";
import { Upload, FileText, Building2, Check, Trash2, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentPreviewModal } from "@/components/rentals/document-preview-modal";
import { DocumentUploadModal } from "@/components/rentals/document-upload-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface TenantAcceptedTasksProps {
  propertyId: string;
  property?: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
}

const PHASE = "Inquilino aceptado";

export function TenantAcceptedTasks({ propertyId, property }: TenantAcceptedTasksProps) {
  const { tasks, isTaskCompleted, getTaskData, updateTask, loading: tasksLoading } = usePropertyTasks({
    propertyId,
    phase: PHASE,
  });
  
  const { property: supabaseProperty } = useProperty(propertyId);
  const { updateProperty } = useUpdateProperty();
  
  // Bank account confirmation state
  const [wantsToChangeAccount, setWantsToChangeAccount] = useState<boolean | null>(null);
  const [rentReceivingIban, setRentReceivingIban] = useState<string>("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [isDraggingCertificate, setIsDraggingCertificate] = useState(false);
  const [ibanError, setIbanError] = useState<string>("");
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    url: string | null;
    label: string;
  }>({ open: false, url: null, label: "" });
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Contract state
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [signatureDate, setSignatureDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [durationUnit, setDurationUnit] = useState<"meses" | "años" | "">("");
  const [endDate, setEndDate] = useState<string>("");
  const [rentAmount, setRentAmount] = useState<string>("");
  const [uploadingContract, setUploadingContract] = useState(false);
  const [isDraggingContract, setIsDraggingContract] = useState(false);
  const [isEndDateManuallyEdited, setIsEndDateManuallyEdited] = useState(false);
  const [contractUploadModalOpen, setContractUploadModalOpen] = useState(false);
  
  // Ref to track if rent amount field is being actively edited
  const isRentAmountEditingRef = useRef(false);
  
  // Guarantee state
  const [guaranteeSentToSignature, setGuaranteeSentToSignature] = useState<boolean | null>(null);
  
  // Get completion status
  const bankDataConfirmed = isTaskCompleted("bankDataConfirmed", PHASE);
  const contractCompleted = isTaskCompleted("contractCompleted", PHASE);
  const guaranteeCompleted = isTaskCompleted("guaranteeSentToSignature", PHASE);
  
  // Initialize collapse state using lazy initialization based on tasks completion status
  // Calculate initial state directly from tasks to avoid flicker
  const [bankSectionOpen, setBankSectionOpen] = useState(() => {
    // If tasks are loaded, use the completion status, otherwise default to collapsed
    return !bankDataConfirmed;
  });
  const [contractSectionOpen, setContractSectionOpen] = useState(() => {
    return !contractCompleted;
  });
  const [guaranteeSectionOpen, setGuaranteeSectionOpen] = useState(() => {
    return !guaranteeCompleted;
  });
  
  // Initialize collapse state only once when tasks are loaded: closed if completed, open if not
  // This ensures sections are collapsed when completed on initial load, but doesn't
  // auto-collapse when a section becomes completed later
  const hasInitializedCollapse = useRef(false);
  useEffect(() => {
    // Wait for tasks to load before initializing collapse state
    if (!tasksLoading && !hasInitializedCollapse.current) {
      setBankSectionOpen(!bankDataConfirmed);
      setContractSectionOpen(!contractCompleted);
      setGuaranteeSectionOpen(!guaranteeCompleted);
      hasInitializedCollapse.current = true;
    }
  }, [tasksLoading, bankDataConfirmed, contractCompleted, guaranteeCompleted]);

  // Function to mask bank account number (show only last 4 digits)
  const maskBankAccount = (accountNumber: string): string => {
    if (!accountNumber) return "";
    
    // Extract only digits from the account number
    const digits = accountNumber.replace(/\D/g, "");
    
    if (digits.length <= 4) {
      return accountNumber;
    }
    
    // Show first 4 and last 4 digits, mask the middle
    const firstFour = digits.substring(0, 4);
    const lastFour = digits.substring(digits.length - 4);
    return `${firstFour} **** **** ${lastFour}`;
  };

  // Function to validate IBAN format
  const validateIBAN = (iban: string): { isValid: boolean; error: string } => {
    if (!iban || iban.trim() === "") {
      return { isValid: false, error: "" };
    }

    // Remove spaces and convert to uppercase
    const cleanedIban = iban.replace(/\s/g, "").toUpperCase();

    // Basic IBAN format check: 2 letters (country code) + 2 digits (check digits) + up to 30 alphanumeric characters
    const ibanPattern = /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/;

    if (!ibanPattern.test(cleanedIban)) {
      return {
        isValid: false,
        error: "El formato del IBAN no es válido. Debe tener 2 letras (código de país), 2 dígitos y entre 4 y 30 caracteres alfanuméricos.",
      };
    }

    // Check for Spanish IBAN (ES) - should be 24 characters total
    if (cleanedIban.startsWith("ES")) {
      if (cleanedIban.length !== 24) {
        return {
          isValid: false,
          error: "El IBAN español debe tener 24 caracteres.",
        };
      }
    }

    return { isValid: true, error: "" };
  };

  // Initialize bank account fields from property data
  // Only initialize once when component mounts or when wantsToChangeAccount changes
  const hasInitializedRef = useRef(false);
  const previousWantsToChangeRef = useRef<boolean | null>(null);
  const lastCertificateUrlRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (supabaseProperty) {
      const dbWantsToChange = supabaseProperty.client_wants_to_change_bank_account;
      const dbCertificateUrl = supabaseProperty.client_rent_receiving_bank_certificate_url;
      
      // Initialize wantsToChangeAccount from database
      if (dbWantsToChange !== null && dbWantsToChange !== undefined) {
        // Only update state if it's different from current state or if not initialized yet
        if (wantsToChangeAccount !== dbWantsToChange || !hasInitializedRef.current) {
          setWantsToChangeAccount(dbWantsToChange);
          previousWantsToChangeRef.current = dbWantsToChange;
        }
        
        // Only initialize fields if they DON'T want to change (use existing account)
        // And only on first load or when wantsToChangeAccount changes
        if (dbWantsToChange === false && (!hasInitializedRef.current || previousWantsToChangeRef.current !== false)) {
          // If they don't want to change, initialize with existing values
          if (supabaseProperty.client_rent_receiving_iban) {
            setRentReceivingIban(supabaseProperty.client_rent_receiving_iban);
          }
          if (dbCertificateUrl) {
            setCertificateUrl(dbCertificateUrl);
            lastCertificateUrlRef.current = dbCertificateUrl;
          }
        } else if (dbWantsToChange === true && (!hasInitializedRef.current || previousWantsToChangeRef.current !== true)) {
          // If they want to change and this is first load or state changed, initialize empty
          // But don't reset if user already has local changes (has certificateUrl or certificateFile)
          if (!certificateUrl && !certificateFile && !rentReceivingIban) {
            setRentReceivingIban("");
            setCertificateUrl(null);
            setCertificateFile(null);
          }
        }
        
        // Sync certificateUrl from DB if it changed externally (but not if user just uploaded)
        // Only sync if DB has a new value and we don't have a local file being uploaded
        if (dbCertificateUrl && dbCertificateUrl !== lastCertificateUrlRef.current && !certificateFile) {
          // Only update if local state is empty or if DB value is different
          if (!certificateUrl || certificateUrl !== dbCertificateUrl) {
            setCertificateUrl(dbCertificateUrl);
            lastCertificateUrlRef.current = dbCertificateUrl;
          }
        }
        
        hasInitializedRef.current = true;
      }
    }
  }, [supabaseProperty?.client_wants_to_change_bank_account, supabaseProperty?.client_rent_receiving_bank_certificate_url]);

  // Handle radio button change for bank account confirmation
  const handleBankAccountChoice = async (value: string) => {
    // value === "yes" means they DON'T want to change (use existing account)
    // value === "no" means they DO want to change (need new account)
    const wantsToChange = value === "no";
    setWantsToChangeAccount(wantsToChange);
    
    if (value === "yes" && supabaseProperty) {
      // If they DON'T want to change, copy existing values
      const updates: Record<string, any> = {
        client_wants_to_change_bank_account: false,
      };
      
      // Copy IBAN from existing account
      if (supabaseProperty.client_iban) {
        updates.client_rent_receiving_iban = supabaseProperty.client_iban;
        setRentReceivingIban(supabaseProperty.client_iban);
      }
      
      // Copy certificate URL from existing account
      if (supabaseProperty.client_bank_certificate_url) {
        updates.client_rent_receiving_bank_certificate_url = supabaseProperty.client_bank_certificate_url;
        setCertificateUrl(supabaseProperty.client_bank_certificate_url);
      }
      
      // Update database with copied values
      await updateProperty(propertyId, updates);
      
      // Mark section as completed
      await updateTask("bankDataConfirmed", PHASE, {
        is_completed: true,
      });
    } else if (value === "no") {
      // If they want to change, clear all fields and database values
      setRentReceivingIban("");
      setCertificateUrl(null);
      setCertificateFile(null);
      
      // Clear database fields
      await updateProperty(propertyId, {
        client_wants_to_change_bank_account: true,
        client_rent_receiving_iban: null,
        client_rent_receiving_bank_certificate_url: null,
      });
      
      // Clear completion until fields are filled
      await updateTask("bankDataConfirmed", PHASE, {
        is_completed: false,
      });
    }
  };

  // Handle clear bank account selection
  const handleClearBankAccountChoice = async () => {
    setWantsToChangeAccount(null);
    setRentReceivingIban("");
    setCertificateUrl(null);
    setCertificateFile(null);
    
    // Clear database fields
    await updateProperty(propertyId, {
      client_wants_to_change_bank_account: null,
      client_rent_receiving_iban: null,
      client_rent_receiving_bank_certificate_url: null,
    });
    
    // Clear completion
    await updateTask("bankDataConfirmed", PHASE, {
      is_completed: false,
    });
  };

  // Handle IBAN input change
  const handleIbanChange = async (value: string) => {
    setRentReceivingIban(value);
    
    // Validate IBAN format
    const validation = validateIBAN(value);
    setIbanError(validation.error);
    
    // Only update database if IBAN is valid or empty
    if (validation.isValid || value === "") {
      await updateProperty(propertyId, {
        client_rent_receiving_iban: value || null,
      });
      
      // Check if section can be completed (only if valid)
      if (validation.isValid) {
        checkBankDataCompletion(value, certificateUrl);
      } else {
        // If invalid, mark section as incomplete
        await updateTask("bankDataConfirmed", PHASE, {
          is_completed: false,
        });
      }
    }
  };

  // Handle certificate file upload
  const handleCertificateUpload = async (file: File) => {
    setUploadingCertificate(true);
    
    try {
      const url = await uploadDocument(
        "client_rent_receiving_bank_certificate_url",
        propertyId,
        file,
        certificateUrl || undefined
      );
      
      // Update local state immediately - keep file reference for display
      setCertificateFile(file);
      setCertificateUrl(url);
      lastCertificateUrlRef.current = url;
      
      await updateProperty(propertyId, {
        client_rent_receiving_bank_certificate_url: url,
      });
      
      // Check if section can be completed
      checkBankDataCompletion(rentReceivingIban, url);
    } catch (error) {
      console.error("Error uploading certificate:", error);
      alert("Error al subir el certificado. Por favor, inténtalo de nuevo.");
      setCertificateFile(null);
      // Re-throw error so modal doesn't close on error
      throw error;
    } finally {
      setUploadingCertificate(false);
    }
  };

  // Handle file input change
  const handleCertificateFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleCertificateUpload(files[0]);
    // Reset input
    if (e.target) {
      e.target.value = "";
    }
  };

  // Drag and drop handlers for certificate
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingCertificate(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCertificate(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCertificate(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validate file type
      const validTypes = [".pdf", ".doc", ".docx"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (validTypes.includes(fileExtension)) {
        await handleCertificateUpload(file);
      } else {
        alert("Por favor, sube un archivo PDF, DOC o DOCX");
      }
    }
  };

  // Handle certificate removal
  const handleRemoveCertificate = async () => {
    setCertificateFile(null);
    setCertificateUrl(null);
    await updateProperty(propertyId, {
      client_rent_receiving_bank_certificate_url: null,
    });
    
    // Uncomplete section if IBAN is also empty
    if (!rentReceivingIban) {
      await updateTask("bankDataConfirmed", PHASE, {
        is_completed: false,
      });
    }
  };

  // Check if bank data section can be completed
  const checkBankDataCompletion = async (iban: string, certUrl: string | null) => {
    if (wantsToChangeAccount === true) {
      // If they want to change, both fields must be filled
      if (iban && certUrl) {
        await updateTask("bankDataConfirmed", PHASE, {
          is_completed: true,
        });
      } else {
        await updateTask("bankDataConfirmed", PHASE, {
          is_completed: false,
        });
      }
    }
  };

  // Map Spanish UI values to database enum values
  const mapDurationUnitToDB = (unit: "meses" | "años"): "months" | "years" => {
    return unit === "meses" ? "months" : "years";
  };

  // Map database enum values to Spanish UI values
  const mapDurationUnitFromDB = (unit: string | null): "meses" | "años" | "" => {
    if (unit === "months") return "meses";
    if (unit === "years") return "años";
    return "";
  };

  // Calculate end date from start date and duration
  const calculateEndDate = (start: string, dur: string, unit: string): string | null => {
    if (!start || !dur || !unit) return null;
    
    try {
      const startDate = new Date(start);
      if (isNaN(startDate.getTime())) return null;
      
      const durationNum = parseInt(dur, 10);
      if (isNaN(durationNum) || durationNum <= 0) return null;
      
      const endDate = new Date(startDate);
      
      // Handle both Spanish UI values and English DB values
      if (unit === "meses" || unit === "months") {
        endDate.setMonth(endDate.getMonth() + durationNum);
      } else if (unit === "años" || unit === "years") {
        endDate.setFullYear(endDate.getFullYear() + durationNum);
      } else {
        return null;
      }
      
      // Format as YYYY-MM-DD
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, "0");
      const day = String(endDate.getDate()).padStart(2, "0");
      
      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  };

  // Initialize contract fields from property data
  useEffect(() => {
    if (supabaseProperty) {
      // Contract file
      if (supabaseProperty.signed_lease_contract_url) {
        setContractUrl(supabaseProperty.signed_lease_contract_url);
      }
      
      // Contract dates and data
      if (supabaseProperty.contract_signature_date) {
        setSignatureDate(supabaseProperty.contract_signature_date);
      }
      if (supabaseProperty.lease_start_date) {
        setStartDate(supabaseProperty.lease_start_date);
      }
      if (supabaseProperty.lease_duration) {
        setDuration(supabaseProperty.lease_duration);
      }
      if (supabaseProperty.lease_duration_unit) {
        setDurationUnit(mapDurationUnitFromDB(supabaseProperty.lease_duration_unit));
      }
      if (supabaseProperty.lease_end_date) {
        setEndDate(supabaseProperty.lease_end_date);
        // Check if end date matches calculated value
        const dbUnit = supabaseProperty.lease_duration_unit || "";
        const uiUnit = mapDurationUnitFromDB(dbUnit);
        const calculated = calculateEndDate(
          supabaseProperty.lease_start_date || "",
          supabaseProperty.lease_duration || "",
          uiUnit || dbUnit // Use UI unit if available, otherwise use DB unit
        );
        if (calculated && calculated !== supabaseProperty.lease_end_date) {
          setIsEndDateManuallyEdited(true);
        }
      }
      // Only update rent amount if not being actively edited
      if (!isRentAmountEditingRef.current) {
        if (supabaseProperty.final_rent_amount !== null && supabaseProperty.final_rent_amount !== undefined) {
          const dbValue = supabaseProperty.final_rent_amount.toString();
          // Only update if the value is different to avoid unnecessary re-renders
          if (rentAmount !== dbValue) {
            setRentAmount(dbValue);
          }
        } else if (rentAmount !== "") {
          // Clear the field if DB value is null/undefined and local state has a value
          setRentAmount("");
        }
      }
      
      // Guarantee data
      if (supabaseProperty.guarantee_sent_to_signature !== null && supabaseProperty.guarantee_sent_to_signature !== undefined) {
        setGuaranteeSentToSignature(supabaseProperty.guarantee_sent_to_signature);
      }
    }
  }, [supabaseProperty]);

  // Verify contract completion status when supabaseProperty changes
  // This ensures the completion status matches the actual data
  useEffect(() => {
    if (supabaseProperty && !tasksLoading) {
      const hasContractFile = supabaseProperty.signed_lease_contract_url && 
                              typeof supabaseProperty.signed_lease_contract_url === 'string' && 
                              supabaseProperty.signed_lease_contract_url.trim() !== '';
      const hasSignatureDate = supabaseProperty.contract_signature_date && 
                               typeof supabaseProperty.contract_signature_date === 'string' && 
                               supabaseProperty.contract_signature_date.trim() !== '';
      const hasStartDate = supabaseProperty.lease_start_date && 
                          typeof supabaseProperty.lease_start_date === 'string' && 
                          supabaseProperty.lease_start_date.trim() !== '';
      const hasDuration = supabaseProperty.lease_duration && 
                         supabaseProperty.lease_duration_unit && 
                         supabaseProperty.lease_duration.toString().trim() !== '' && 
                         (supabaseProperty.lease_duration_unit === 'months' || supabaseProperty.lease_duration_unit === 'years');
      const hasRentAmount = supabaseProperty.final_rent_amount !== null && 
                           supabaseProperty.final_rent_amount !== undefined && 
                           (typeof supabaseProperty.final_rent_amount === 'number' ? supabaseProperty.final_rent_amount > 0 : parseFloat(String(supabaseProperty.final_rent_amount)) > 0);
      
      const isComplete = hasContractFile && hasSignatureDate && hasStartDate && hasDuration && hasRentAmount;
      
      // Only update if the status has changed to avoid unnecessary updates
      if (isComplete !== contractCompleted) {
        updateTask("contractCompleted", PHASE, {
          is_completed: isComplete,
        });
      }
    }
  }, [supabaseProperty?.signed_lease_contract_url, supabaseProperty?.contract_signature_date, supabaseProperty?.lease_start_date, supabaseProperty?.lease_duration, supabaseProperty?.lease_duration_unit, supabaseProperty?.final_rent_amount, tasksLoading, contractCompleted]);

  // Handle contract upload
  const handleContractUpload = async (file: File) => {
    setContractFile(file);
    setUploadingContract(true);
    
    try {
      const url = await uploadDocument(
        "signed_lease_contract_url",
        propertyId,
        file,
        contractUrl || undefined
      );
      
      setContractUrl(url);
      await updateProperty(propertyId, {
        signed_lease_contract_url: url,
      });
      
      // Check if section can be completed
      checkContractCompletion();
    } catch (error) {
      console.error("Error uploading contract:", error);
      alert("Error al subir el contrato. Por favor, inténtalo de nuevo.");
      setContractFile(null);
    } finally {
      setUploadingContract(false);
    }
  };

  // Handle contract removal
  const handleRemoveContract = async () => {
    if (!contractUrl) return;
    
    try {
      await deleteDocument("signed_lease_contract_url", propertyId, contractUrl);
      setContractFile(null);
      setContractUrl(null);
      await updateProperty(propertyId, {
        signed_lease_contract_url: null,
      });
      
      // Check completion
      checkContractCompletion();
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert("Error al eliminar el contrato. Por favor, inténtalo de nuevo.");
    }
  };

  // Drag and drop handlers for contract
  const handleContractDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingContract(true);
    }
  };

  const handleContractDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleContractDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingContract(false);
  };

  const handleContractDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingContract(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validTypes = [".pdf", ".doc", ".docx"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (validTypes.includes(fileExtension)) {
        await handleContractUpload(file);
      } else {
        alert("Por favor, sube un archivo PDF, DOC o DOCX");
      }
    }
  };

  // Handle signature date change
  const handleSignatureDateChange = async (value: string) => {
    setSignatureDate(value);
    await updateProperty(propertyId, {
      contract_signature_date: value || null,
    });
    checkContractCompletion();
  };

  // Handle start date change
  const handleStartDateChange = async (value: string) => {
    setStartDate(value);
    await updateProperty(propertyId, {
      lease_start_date: value || null,
    });
    
    // Recalculate end date if not manually edited
    if (!isEndDateManuallyEdited && value && duration && durationUnit) {
      const calculated = calculateEndDate(value, duration, durationUnit);
      if (calculated) {
        setEndDate(calculated);
        await updateProperty(propertyId, {
          lease_end_date: calculated,
        });
      }
    }
    
    checkContractCompletion();
  };

  // Handle duration change
  const handleDurationChange = async (value: string) => {
    setDuration(value);
    await updateProperty(propertyId, {
      lease_duration: value || null,
    });
    
    // Recalculate end date if not manually edited
    if (!isEndDateManuallyEdited && startDate && value && durationUnit) {
      const calculated = calculateEndDate(startDate, value, durationUnit);
      if (calculated) {
        setEndDate(calculated);
        await updateProperty(propertyId, {
          lease_end_date: calculated,
        });
      }
    }
    
    checkContractCompletion();
  };

  // Handle duration unit change
  const handleDurationUnitChange = async (value: string) => {
    // Validate that value is either "meses" or "años"
    if (value !== "meses" && value !== "años") {
      console.error("Invalid duration unit value:", value);
      return;
    }
    
    const unit = value as "meses" | "años";
    setDurationUnit(unit);
    
    try {
      // Map Spanish UI value to English DB enum value
      const dbValue = mapDurationUnitToDB(unit);
      const success = await updateProperty(propertyId, {
        lease_duration_unit: dbValue,
      });
      
      if (!success) {
        console.error("Failed to update lease_duration_unit");
        // Revert the state change on error
        if (supabaseProperty?.lease_duration_unit) {
          setDurationUnit(mapDurationUnitFromDB(supabaseProperty.lease_duration_unit));
        } else {
          setDurationUnit("");
        }
        return;
      }
      
      // Recalculate end date if not manually edited
      if (!isEndDateManuallyEdited && startDate && duration && unit) {
        const calculated = calculateEndDate(startDate, duration, unit);
        if (calculated) {
          setEndDate(calculated);
          await updateProperty(propertyId, {
            lease_end_date: calculated,
          });
        }
      }
      
      checkContractCompletion();
    } catch (error) {
      console.error("Error updating duration unit:", error);
      // Revert the state change on error
      if (supabaseProperty?.lease_duration_unit) {
        setDurationUnit(mapDurationUnitFromDB(supabaseProperty.lease_duration_unit));
      } else {
        setDurationUnit("");
      }
    }
  };

  // Handle end date change (manual edit)
  const handleEndDateChange = async (value: string) => {
    setEndDate(value);
    setIsEndDateManuallyEdited(true);
    await updateProperty(propertyId, {
      lease_end_date: value || null,
    });
    checkContractCompletion();
  };

  // Handle rent amount change
  const handleRentAmountChange = async (value: string) => {
    setRentAmount(value);
    // Don't update database while user is typing - only update on blur
    // This prevents the field from losing focus
  };

  // Handle rent amount blur - update database when user finishes editing
  const handleRentAmountBlur = async () => {
    isRentAmountEditingRef.current = false;
    const numValue = rentAmount === "" || rentAmount === null || rentAmount === undefined 
      ? null 
      : parseFloat(rentAmount);
    await updateProperty(propertyId, {
      final_rent_amount: numValue,
    });
    checkContractCompletion();
  };

  // Handle rent amount focus - mark as being edited
  const handleRentAmountFocus = () => {
    isRentAmountEditingRef.current = true;
  };

  // Check if contract section can be completed
  // This must match exactly what the ProgressOverviewWidget counts (5 fields):
  // 1. Contract file (signed_lease_contract_url)
  // 2. Signature date (contract_signature_date)
  // 3. Start date (lease_start_date)
  // 4. Duration (lease_duration + lease_duration_unit counted together)
  // 5. Rent amount (final_rent_amount)
  const checkContractCompletion = async () => {
    const hasContractFile = contractUrl && typeof contractUrl === 'string' && contractUrl.trim() !== '';
    const hasSignatureDate = signatureDate && typeof signatureDate === 'string' && signatureDate.trim() !== '';
    const hasStartDate = startDate && typeof startDate === 'string' && startDate.trim() !== '';
    const hasDuration = duration && durationUnit && 
                        duration.toString().trim() !== '' && 
                        (durationUnit === 'meses' || durationUnit === 'años' || durationUnit === 'months' || durationUnit === 'years');
    const hasRentAmount = rentAmount && 
                          (typeof rentAmount === 'number' ? rentAmount > 0 : parseFloat(String(rentAmount)) > 0);
    
    if (hasContractFile && hasSignatureDate && hasStartDate && hasDuration && hasRentAmount) {
      await updateTask("contractCompleted", PHASE, {
        is_completed: true,
      });
    } else {
      await updateTask("contractCompleted", PHASE, {
        is_completed: false,
      });
    }
  };

  // Handle guarantee sent to signature change
  const handleGuaranteeSentChange = async (value: string) => {
    const sent = value === "yes";
    setGuaranteeSentToSignature(sent);
    
    await updateProperty(propertyId, {
      guarantee_sent_to_signature: sent,
    });
    
    // Mark section as completed if sent to signature
    if (sent) {
      await updateTask("guaranteeSentToSignature", PHASE, {
        is_completed: true,
      });
    } else {
      await updateTask("guaranteeSentToSignature", PHASE, {
        is_completed: false,
      });
    }
  };

  // Handle clear guarantee selection
  const handleClearGuaranteeSent = async () => {
    setGuaranteeSentToSignature(null);
    
    await updateProperty(propertyId, {
      guarantee_sent_to_signature: null,
    });
    
    // Clear completion
    await updateTask("guaranteeSentToSignature", PHASE, {
      is_completed: false,
    });
  };

  // Check if guarantee section can be completed
  const checkGuaranteeCompletion = async () => {
    if (guaranteeSentToSignature === true) {
      await updateTask("guaranteeSentToSignature", PHASE, {
        is_completed: true,
      });
    } else {
      await updateTask("guaranteeSentToSignature", PHASE, {
        is_completed: false,
      });
    }
  };


  // Get section color classes based on completion status
  const getSectionColorClasses = (isCompleted: boolean) => {
    if (isCompleted) {
      return "border-green-200 bg-green-50/30 dark:bg-green-900/10 dark:border-green-800/80";
    }
    return "border-gray-200 bg-white dark:bg-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Datos Bancarios */}
      <Card 
        id="section-bank-data"
        className={cn(
          "border transition-all shadow-sm",
          getSectionColorClasses(bankDataConfirmed)
        )}
      >
        {/* Título y descripción - dentro del Card */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Confirmación datos bancarios del Inversor
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Confirmar en qué cuenta bancaria quiere el Inversor recibir los ingresos.
              </p>
            </div>
            {bankDataConfirmed && (
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 border border-gray-300 flex-shrink-0 mt-0.5 ml-3">
                <Check className="h-3 w-3 text-green-600 stroke-[2.5]" />
              </div>
            )}
          </div>
        </div>

        {/* Línea de separación */}
        <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />

        {/* Si está completa, usar accordion para poder colapsar/expandir */}
        {bankDataConfirmed ? (
          <Accordion
            type="single"
            collapsible
            value={bankSectionOpen ? "bank-data" : ""}
            onValueChange={(value) => {
              const wasOpen = bankSectionOpen;
              const isCollapsing = wasOpen && value === "";
              const isExpanding = !wasOpen && value === "bank-data";
              
              // Guardar posición del scroll antes de cualquier cambio
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
              
              if (isCollapsing) {
                setBankSectionOpen(false);
              } else if (isExpanding) {
                setBankSectionOpen(true);
              } else {
                setBankSectionOpen(value === "bank-data");
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
            <AccordionItem value="bank-data" className="border-none">
              <AccordionTrigger className={cn(
                "px-4 py-3 hover:no-underline relative",
                bankSectionOpen ? "justify-end" : "justify-between"
              )}>
                {!bankSectionOpen && (
                  <span className="text-sm text-muted-foreground absolute inset-0 flex items-center justify-center pointer-events-none">Ver campos</span>
                )}
                {!bankSectionOpen && <span className="invisible">placeholder</span>}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Display existing IBAN */}
                  <div className="flex items-center justify-between p-4 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors bg-white dark:bg-[#1F2937] hover:bg-[#F9FAFB] dark:hover:bg-[#111827]">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-[#F3F4F6] dark:bg-[#374151] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#111827] dark:text-[#F9FAFB] uppercase tracking-wide mb-1">
                          Cuenta bancaria registrada
                        </p>
                        <p className={`text-sm font-semibold font-mono ${supabaseProperty?.client_iban ? 'text-[#6B7280] dark:text-[#9CA3AF]' : 'text-[#9CA3AF] dark:text-[#6B7280]'}`}>
                          {supabaseProperty?.client_iban ? maskBankAccount(supabaseProperty.client_iban) : "No disponible"}
                        </p>
                      </div>
                    </div>
                  </div>

          {/* Radio buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                ¿Es esta la cuenta bancaria donde el inversor quiere recibir los ingresos?
              </Label>
              {wantsToChangeAccount !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClearBankAccountChoice();
                  }}
                  className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-3 w-3 mr-1" />
                  Borrar selección
                </Button>
              )}
            </div>
            <RadioGroup
              value={wantsToChangeAccount === null ? "" : wantsToChangeAccount === false ? "yes" : "no"}
              onValueChange={handleBankAccountChoice}
              className="flex items-center gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="text-sm font-normal cursor-pointer">
                  Sí
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="text-sm font-normal cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Conditional fields when "No" is selected */}
          {wantsToChangeAccount === true && (
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/* New IBAN input */}
              <div className="space-y-2">
                <Label htmlFor="rent-receiving-iban" className="text-sm font-medium">
                  Cuenta de domiciliación de ingresos
                </Label>
                <Input
                  id="rent-receiving-iban"
                  type="text"
                  placeholder="ES91 2100 0418 4502 0005 1332"
                  value={rentReceivingIban}
                  onChange={(e) => handleIbanChange(e.target.value)}
                  className={cn(
                    "font-mono",
                    ibanError && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {ibanError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {ibanError}
                  </p>
                )}
              </div>

              {/* Certificate upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Certificado de titularidad bancaria
                </Label>
                {certificateFile || certificateUrl ? (
                  <div className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => {
                        if (certificateUrl) {
                          setPreviewModal({
                            open: true,
                            url: certificateUrl,
                            label: "Certificado de titularidad bancaria",
                          });
                        }
                      }}
                    >
                      <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                        <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                          Certificado de titularidad bancaria
                        </p>
                        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                          {certificateFile?.name || "PDF"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCertificate();
                      }}
                      disabled={uploadingCertificate}
                      className="h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="certificate-upload"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCertificateFileInput}
                      className="hidden"
                      disabled={uploadingCertificate}
                    />
                    <button
                      type="button"
                      onClick={() => setUploadModalOpen(true)}
                      disabled={uploadingCertificate}
                      className={cn(
                        "w-full p-2 border border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors flex items-center justify-center gap-2",
                        isDraggingCertificate && "bg-primary/5",
                        uploadingCertificate && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Upload className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                      <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                        Agregar documento
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <CardContent className="space-y-4 px-4 py-4">
            {/* Display existing IBAN */}
            <div className="flex items-center justify-between p-4 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors bg-white dark:bg-[#1F2937] hover:bg-[#F9FAFB] dark:hover:bg-[#111827]">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-[#F3F4F6] dark:bg-[#374151] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#111827] dark:text-[#F9FAFB] uppercase tracking-wide mb-1">
                    Cuenta bancaria registrada
                  </p>
                  <p className={`text-sm font-semibold font-mono ${supabaseProperty?.client_iban ? 'text-[#6B7280] dark:text-[#9CA3AF]' : 'text-[#9CA3AF] dark:text-[#6B7280]'}`}>
                    {supabaseProperty?.client_iban ? maskBankAccount(supabaseProperty.client_iban) : "No disponible"}
                  </p>
                </div>
              </div>
            </div>

            {/* Radio buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  ¿Es esta la cuenta bancaria donde el inversor quiere recibir los ingresos?
                </Label>
                {wantsToChangeAccount !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClearBankAccountChoice();
                    }}
                    className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Borrar selección
                  </Button>
                )}
              </div>
              <RadioGroup
                value={wantsToChangeAccount === null ? "" : wantsToChangeAccount === false ? "yes" : "no"}
                onValueChange={handleBankAccountChoice}
                className="flex items-center gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="text-sm font-normal cursor-pointer">
                    Sí
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="text-sm font-normal cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Conditional fields when "No" is selected */}
            {wantsToChangeAccount === true && (
              <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                {/* New IBAN input */}
                <div className="space-y-2">
                  <Label htmlFor="rent-receiving-iban" className="text-sm font-medium">
                    Cuenta de domiciliación de ingresos
                  </Label>
                  <Input
                    id="rent-receiving-iban"
                    type="text"
                    placeholder="ES91 2100 0418 4502 0005 1332"
                    value={rentReceivingIban}
                    onChange={(e) => handleIbanChange(e.target.value)}
                    className={cn(
                      "font-mono",
                      ibanError && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {ibanError && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {ibanError}
                    </p>
                  )}
                </div>

                {/* Certificate upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Certificado de titularidad bancaria
                  </Label>
                  {certificateFile || certificateUrl ? (
                    <div className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => {
                          if (certificateUrl) {
                            setPreviewModal({
                              open: true,
                              url: certificateUrl,
                              label: "Certificado de titularidad bancaria",
                            });
                          }
                        }}
                      >
                        <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                          <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                            Certificado de titularidad bancaria
                          </p>
                          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                            {certificateFile?.name || "PDF"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCertificate();
                        }}
                        disabled={uploadingCertificate}
                        className="h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        id="certificate-upload"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCertificateFileInput}
                        className="hidden"
                        disabled={uploadingCertificate}
                      />
                      <button
                        type="button"
                        onClick={() => setUploadModalOpen(true)}
                        disabled={uploadingCertificate}
                        className={cn(
                          "w-full p-2 border border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors flex items-center justify-center gap-2",
                          isDraggingCertificate && "bg-primary/5",
                          uploadingCertificate && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Upload className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                        <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                          Agregar documento
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <DocumentUploadModal
          open={uploadModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setUploadModalOpen(false);
            }
          }}
          onUpload={async (file) => {
            try {
              await handleCertificateUpload(file);
              // Modal will close automatically after successful upload
              setUploadModalOpen(false);
            } catch (error) {
              // Error ya está manejado en handleCertificateUpload
              // No cerrar el modal en caso de error para permitir reintentos
              throw error;
            }
          }}
          label="Certificado de titularidad bancaria"
          isEdit={false}
          allowCustomTitle={false}
        />
      )}

      {/* Preview Modal */}
      {previewModal.open && previewModal.url && (
        <DocumentPreviewModal
          open={previewModal.open}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewModal({ open: false, url: null, label: "" });
            }
          }}
          documentUrl={previewModal.url}
          documentName={previewModal.label}
        />
      )}

      {/* Contrato de alquiler */}
      <Card 
        id="section-contract"
        className={cn(
          "border transition-all shadow-sm",
          getSectionColorClasses(contractCompleted)
        )}
      >
        {/* Título y descripción */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Contrato de alquiler
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Subir el contrato firmado y registrar los datos del contrato.
              </p>
            </div>
            {contractCompleted && (
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 border border-gray-300 flex-shrink-0 mt-0.5 ml-3">
                <Check className="h-3 w-3 text-green-600 stroke-[2.5]" />
              </div>
            )}
          </div>
        </div>

        {/* Línea de separación */}
        <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />

        {/* Si está completa, usar accordion para poder colapsar/expandir */}
        {contractCompleted ? (
          <Accordion
            type="single"
            collapsible
            value={contractSectionOpen ? "contract" : ""}
            onValueChange={(value) => {
              const wasOpen = contractSectionOpen;
              const isCollapsing = wasOpen && value === "";
              const isExpanding = !wasOpen && value === "contract";
              
              // Guardar posición del scroll antes de cualquier cambio
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
              
              if (isCollapsing) {
                setContractSectionOpen(false);
              } else if (isExpanding) {
                setContractSectionOpen(true);
              } else {
                setContractSectionOpen(value === "contract");
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
            <AccordionItem value="contract" className="border-none">
              <AccordionTrigger className={cn(
                "px-4 py-3 hover:no-underline relative",
                contractSectionOpen ? "justify-end" : "justify-between"
              )}>
                {!contractSectionOpen && (
                  <span className="text-sm text-muted-foreground absolute inset-0 flex items-center justify-center pointer-events-none">Ver campos</span>
                )}
                {!contractSectionOpen && <span className="invisible">placeholder</span>}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Contract upload */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Contrato de alquiler firmado
                    </Label>
            {contractFile || contractUrl ? (
              <div className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => {
                    if (contractUrl) {
                      setPreviewModal({
                        open: true,
                        url: contractUrl,
                        label: "Contrato de alquiler",
                      });
                    }
                  }}
                >
                  <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                      Contrato de alquiler
                    </p>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      {contractFile?.name || "PDF"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveContract();
                  }}
                  disabled={uploadingContract}
                  className="h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleContractDragEnter}
                onDragOver={handleContractDragOver}
                onDragLeave={handleContractDragLeave}
                onDrop={handleContractDrop}
              >
                <input
                  type="file"
                  id="contract-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleContractUpload(files[0]);
                    }
                    if (e.target) {
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                  disabled={uploadingContract}
                />
                <button
                  type="button"
                  onClick={() => setContractUploadModalOpen(true)}
                  disabled={uploadingContract}
                  className={cn(
                    "w-full p-2 border border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors flex items-center justify-center gap-2",
                    isDraggingContract && "bg-primary/5",
                    uploadingContract && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Upload className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                  <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                    Agregar documento
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Contract data fields */}
          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Signature date */}
            <div className="space-y-2">
              <Label htmlFor="signature-date" className="text-sm font-medium">
                Fecha de firma
              </Label>
              <Input
                id="signature-date"
                type="date"
                value={signatureDate}
                onChange={(e) => handleSignatureDateChange(e.target.value)}
              />
            </div>

            {/* Start date */}
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium">
                Fecha de inicio
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  Duración
                </Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="12"
                  min="1"
                  value={duration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration-unit" className="text-sm font-medium">
                  Unidad
                </Label>
                <Select
                  value={durationUnit}
                  onValueChange={handleDurationUnitChange}
                >
                  <SelectTrigger id="duration-unit">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meses">Meses</SelectItem>
                    <SelectItem value="años">Años</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* End date */}
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium">
                Fecha de fin
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </div>

            {/* Rent amount */}
            <div className="space-y-2">
              <Label htmlFor="rent-amount" className="text-sm font-medium">
                Renta mensual (€)
              </Label>
              <Input
                id="rent-amount"
                type="number"
                placeholder="1200"
                min="0"
                step="0.01"
                value={rentAmount}
                onChange={(e) => handleRentAmountChange(e.target.value)}
                onFocus={handleRentAmountFocus}
                onBlur={handleRentAmountBlur}
              />
            </div>
          </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <CardContent className="space-y-4 px-4 py-4">
            {/* Contract upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Contrato de alquiler firmado
              </Label>
              {contractFile || contractUrl ? (
                <div className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => {
                      if (contractUrl) {
                        setPreviewModal({
                          open: true,
                          url: contractUrl,
                          label: "Contrato de alquiler",
                        });
                      }
                    }}
                  >
                    <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                        Contrato de alquiler
                      </p>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                        {contractFile?.name || "PDF"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveContract();
                    }}
                    disabled={uploadingContract}
                    className="h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragEnter={handleContractDragEnter}
                  onDragOver={handleContractDragOver}
                  onDragLeave={handleContractDragLeave}
                  onDrop={handleContractDrop}
                >
                  <input
                    type="file"
                    id="contract-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleContractUpload(files[0]);
                      }
                      if (e.target) {
                        e.target.value = "";
                      }
                    }}
                    className="hidden"
                    disabled={uploadingContract}
                  />
                  <button
                    type="button"
                    onClick={() => setContractUploadModalOpen(true)}
                    disabled={uploadingContract}
                    className={cn(
                      "w-full p-2 border border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors flex items-center justify-center gap-2",
                      isDraggingContract && "bg-primary/5",
                      uploadingContract && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Upload className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                    <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                      Agregar documento
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Contract data fields */}
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/* Signature date */}
              <div className="space-y-2">
                <Label htmlFor="signature-date" className="text-sm font-medium">
                  Fecha de firma
                </Label>
                <Input
                  id="signature-date"
                  type="date"
                  value={signatureDate}
                  onChange={(e) => handleSignatureDateChange(e.target.value)}
                />
              </div>

              {/* Start date */}
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm font-medium">
                  Fecha de inicio
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </div>

              {/* Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-medium">
                    Duración
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="12"
                    min="1"
                    value={duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration-unit" className="text-sm font-medium">
                    Unidad
                  </Label>
                  <Select
                    value={durationUnit}
                    onValueChange={handleDurationUnitChange}
                  >
                    <SelectTrigger id="duration-unit">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meses">Meses</SelectItem>
                      <SelectItem value="años">Años</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* End date */}
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-medium">
                  Fecha de fin
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                />
              </div>

              {/* Rent amount */}
              <div className="space-y-2">
                <Label htmlFor="rent-amount" className="text-sm font-medium">
                  Renta mensual (€)
                </Label>
                <Input
                  id="rent-amount"
                  type="number"
                  placeholder="1200"
                  min="0"
                  step="0.01"
                  value={rentAmount}
                  onChange={(e) => handleRentAmountChange(e.target.value)}
                  onFocus={handleRentAmountFocus}
                  onBlur={handleRentAmountBlur}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contract Upload Modal */}
      {contractUploadModalOpen && (
        <DocumentUploadModal
          open={contractUploadModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setContractUploadModalOpen(false);
            }
          }}
          onUpload={async (file) => {
            await handleContractUpload(file);
            setContractUploadModalOpen(false);
          }}
          label="Contrato de alquiler"
          isEdit={false}
          allowCustomTitle={false}
        />
      )}

      {/* Garantía de renta ilimitada de Finaer */}
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
                Garantía de renta ilimitada de Finaer
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Confirmar que la Garantía de renta ilimitada de Finaer ha sido enviada a firma.
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
                        ¿Se ha enviado la Garantía de renta ilimitada de Finaer a firma?
                      </Label>
                      {guaranteeSentToSignature !== null && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleClearGuaranteeSent();
                          }}
                          className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Borrar selección
                        </Button>
                      )}
                    </div>
                    <RadioGroup
                      value={guaranteeSentToSignature === null ? "" : guaranteeSentToSignature === true ? "yes" : "no"}
                      onValueChange={handleGuaranteeSentChange}
                      className="flex items-center gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="guarantee-yes" />
                        <Label htmlFor="guarantee-yes" className="text-sm font-normal cursor-pointer">
                          Sí
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="guarantee-no" />
                        <Label htmlFor="guarantee-no" className="text-sm font-normal cursor-pointer">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
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
                  ¿Se ha enviado la Garantía de renta ilimitada de Finaer a firma?
                </Label>
                {guaranteeSentToSignature !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClearGuaranteeSent();
                    }}
                    className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Borrar selección
                  </Button>
                )}
              </div>
              <RadioGroup
                value={guaranteeSentToSignature === null ? "" : guaranteeSentToSignature === true ? "yes" : "no"}
                onValueChange={handleGuaranteeSentChange}
                className="flex items-center gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="guarantee-yes" />
                  <Label htmlFor="guarantee-yes" className="text-sm font-normal cursor-pointer">
                    Sí
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="guarantee-no" />
                  <Label htmlFor="guarantee-no" className="text-sm font-normal cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        )}
      </Card>

    </div>
  );
}
