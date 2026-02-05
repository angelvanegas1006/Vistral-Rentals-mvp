"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from "react";
import { useUpdateProperty } from "@/hooks/use-update-property";
import { mapPropertyToSupabase } from "@/lib/supabase/mappers";
import { detectAndResetPropheroSection } from "@/lib/prophero-field-change-detector";

interface PropertyFormContextType {
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: (errors: Record<string, string>) => void;
  updateField: (sectionId: string, fieldId: string, value: any) => void;
  updateFieldError: (sectionId: string, fieldId: string, error: string | null) => void;
  initializeFormData: (data: Record<string, any>) => void;
}

const PropertyFormContext = createContext<PropertyFormContextType | undefined>(undefined);

export function PropertyFormProvider({ 
  children, 
  propertyId 
}: { 
  children: ReactNode;
  propertyId?: string;
}) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { updateProperty } = useUpdateProperty();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef<boolean>(false);

  // Inicializar formData con datos externos (desde Supabase)
  // Usar useCallback para memoizar y evitar recrear la función en cada render
  const initializeFormData = useCallback((data: Record<string, any>) => {
    setFormData((prevData) => {
      // Merge con datos existentes, pero sobrescribir con los nuevos datos de Supabase
      // Esto asegura que los valores guardados se carguen correctamente
      return { ...prevData, ...data };
    });
    // Marcar como inicializado después de establecer los datos
    initializedRef.current = true;
  }, []); // Sin dependencias para que la función sea estable

  const updateField = (sectionId: string, fieldId: string, value: any) => {
    const updated = {
      ...formData,
      [`${sectionId}.${fieldId}`]: value,
    };
    setFormData(updated);

    // Guardar automáticamente en Supabase con debounce (1 segundo)
    if (propertyId) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveToSupabase(updated, sectionId);
      }, 1000);
    }
  };

  // Función para guardar en Supabase
  const saveToSupabase = async (data: Record<string, any>, sectionId: string) => {
    if (!propertyId) {
      console.warn("⚠️ No propertyId provided, cannot save to Supabase");
      return;
    }

    // Mapear solo los campos de la sección actual a formato Supabase
    const updates: Record<string, any> = {};
    
    if (sectionId === "readyToRent") {
      // Sección 1: Presentación al Cliente
      // Guardar siempre que el campo esté presente en formData, incluso si es null
      if (`${sectionId}.clientPresentationDone` in data) {
        const clientPresentationDone = data[`${sectionId}.clientPresentationDone`];
        updates.client_presentation_done = clientPresentationDone === null ? null : clientPresentationDone;
      }
      
      if (`${sectionId}.clientPresentationDate` in data) {
        const clientPresentationDate = data[`${sectionId}.clientPresentationDate`];
        // Manejar string vacío, null, o undefined
        if (clientPresentationDate === null || clientPresentationDate === undefined || clientPresentationDate === "") {
          updates.client_presentation_date = null;
        } else {
          const dateStr = String(clientPresentationDate).trim();
          updates.client_presentation_date = dateStr !== "" ? dateStr : null;
        }
      }
      
      if (`${sectionId}.clientPresentationChannel` in data) {
        const clientPresentationChannel = data[`${sectionId}.clientPresentationChannel`];
        // Manejar string vacío, null, o undefined
        if (clientPresentationChannel === null || clientPresentationChannel === undefined || clientPresentationChannel === "") {
          updates.client_presentation_channel = null;
        } else {
          const channelStr = String(clientPresentationChannel).trim();
          updates.client_presentation_channel = channelStr !== "" ? channelStr : null;
        }
      }
      
      // Sección 2: Estrategia de Precio
      if (`${sectionId}.announcementPrice` in data) {
        const announcementPrice = data[`${sectionId}.announcementPrice`];
        // Manejar string vacío, null, undefined, o número
        if (announcementPrice === null || announcementPrice === undefined || announcementPrice === "") {
          updates.announcement_price = null;
        } else {
          const priceStr = String(announcementPrice).trim();
          if (priceStr !== "" && !isNaN(Number(priceStr))) {
            updates.announcement_price = Number(priceStr);
          } else {
            updates.announcement_price = null;
          }
        }
      }
      
      // Guardar target_rent_price y expected_yield si están presentes
      if (`${sectionId}.targetRentPrice` in data) {
        const targetRentPrice = data[`${sectionId}.targetRentPrice`];
        if (targetRentPrice === null || targetRentPrice === undefined || targetRentPrice === "") {
          updates.target_rent_price = null;
        } else {
          const priceStr = String(targetRentPrice).trim();
          if (priceStr !== "" && !isNaN(Number(priceStr))) {
            updates.target_rent_price = Number(priceStr);
          } else {
            updates.target_rent_price = null;
          }
        }
      }
      
      if (`${sectionId}.expectedYield` in data) {
        const expectedYield = data[`${sectionId}.expectedYield`];
        if (expectedYield === null || expectedYield === undefined || expectedYield === "") {
          updates.expected_yield = null;
        } else {
          const yieldStr = String(expectedYield).trim();
          if (yieldStr !== "" && !isNaN(Number(yieldStr))) {
            updates.expected_yield = Number(yieldStr);
          } else {
            updates.expected_yield = null;
          }
        }
      }
      
      if (`${sectionId}.priceApproval` in data) {
        const priceApproval = data[`${sectionId}.priceApproval`];
        updates.price_approval = priceApproval === null ? null : priceApproval;
      }
      
      // Campos legacy (mantener compatibilidad)
      if (`${sectionId}.technicalValidation` in data) {
        const technicalValidation = data[`${sectionId}.technicalValidation`];
        updates.technical_validation = technicalValidation === null ? null : technicalValidation;
      }
      
      if (`${sectionId}.monthlyRent` in data) {
        const monthlyRent = data[`${sectionId}.monthlyRent`];
        if (monthlyRent === null || monthlyRent === undefined || monthlyRent === "") {
          updates.monthly_rent = null;
        } else {
          const rentStr = String(monthlyRent).trim();
          if (rentStr !== "" && !isNaN(Number(rentStr))) {
            updates.monthly_rent = Number(rentStr);
          } else {
            updates.monthly_rent = null;
          }
        }
      }
      
      if (`${sectionId}.ownerNotified` in data) {
        const ownerNotified = data[`${sectionId}.ownerNotified`];
        updates.owner_notified = ownerNotified === null ? null : ownerNotified;
      }
      
      // Sección 4: Lanzamiento Comercial
      if (`${sectionId}.publishOnline` in data) {
        const publishOnlineValue = data[`${sectionId}.publishOnline`];
        updates.publish_online = publishOnlineValue === null ? null : publishOnlineValue;
      }
      
      if (`${sectionId}.idealistaDescription` in data) {
        const idealistaDescription = data[`${sectionId}.idealistaDescription`];
        if (idealistaDescription === null || idealistaDescription === undefined || idealistaDescription === "") {
          updates.idealista_description = null;
        } else {
          const descStr = String(idealistaDescription).trim();
          updates.idealista_description = descStr !== "" ? descStr : null;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      console.log("💾 Guardando en Supabase:", { propertyId, sectionId, updates });
      const success = await updateProperty(propertyId, updates);
      if (success) {
        console.log("✅ Guardado exitoso en Supabase:", updates);
        
        // Detectar cambios en campos de secciones Prophero y resetear si es necesario
        // Esto se ejecuta incluso si la tarjeta no está abierta
        detectAndResetPropheroSection(propertyId, updates).catch((error) => {
          console.error("Error detecting prophero field changes:", error);
        });
        
        // Disparar evento para actualizar el kanban board y otros componentes que escuchan cambios
        window.dispatchEvent(new CustomEvent('property-updated', {
          detail: { propertyId }
        }));
      } else {
        console.error("❌ Error al guardar en Supabase");
      }
    } else {
      console.warn("⚠️ No hay actualizaciones para guardar en sección:", sectionId);
    }
  };

  // Resetear initializedRef cuando cambia el propertyId o cuando se limpia el formData
  useEffect(() => {
    if (propertyId) {
      // Solo resetear si cambia el propertyId, no en cada render
      initializedRef.current = false;
    }
  }, [propertyId]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const updateFieldError = (sectionId: string, fieldId: string, error: string | null) => {
    const fieldKey = `${sectionId}.${fieldId}`;
    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (error) {
        updated[fieldKey] = error;
      } else {
        delete updated[fieldKey];
      }
      return updated;
    });
  };

  return (
    <PropertyFormContext.Provider
      value={{
        formData,
        setFormData,
        fieldErrors,
        setFieldErrors,
        updateField,
        updateFieldError,
        initializeFormData,
      }}
    >
      {children}
    </PropertyFormContext.Provider>
  );
}

export function usePropertyForm() {
  const context = useContext(PropertyFormContext);
  if (context === undefined) {
    throw new Error("usePropertyForm must be used within a PropertyFormProvider");
  }
  return context;
}
