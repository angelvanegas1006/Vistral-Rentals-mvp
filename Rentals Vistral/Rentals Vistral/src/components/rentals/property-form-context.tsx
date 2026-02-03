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
    // Solo inicializar si no se ha inicializado antes
    if (!initializedRef.current) {
      setFormData((prevData) => {
        // Merge con datos existentes en lugar de reemplazar completamente
        return { ...prevData, ...data };
      });
      initializedRef.current = true;
    }
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
      // Para booleanos, usar verificación explícita de undefined/null
      const technicalValidation = data[`${sectionId}.technicalValidation`];
      updates.technical_validation = technicalValidation !== undefined && technicalValidation !== null ? technicalValidation : null;
      
      updates.monthly_rent = data[`${sectionId}.monthlyRent`] ? Number(data[`${sectionId}.monthlyRent`]) : null;
      updates.announcement_price = data[`${sectionId}.announcementPrice`] ? Number(data[`${sectionId}.announcementPrice`]) : null;
      
      const ownerNotified = data[`${sectionId}.ownerNotified`];
      updates.owner_notified = ownerNotified !== undefined && ownerNotified !== null ? ownerNotified : null;
      updates.publish_online = data[`${sectionId}.publishOnline`] || null;
      updates.idealista_price = data[`${sectionId}.idealistaPrice`] ? Number(data[`${sectionId}.idealistaPrice`]) : null;
      updates.idealista_description = data[`${sectionId}.idealistaDescription`] || null;
      updates.idealista_address = data[`${sectionId}.idealistaAddress`] || null;
      updates.idealista_city = data[`${sectionId}.idealistaCity`] || null;
      // idealista_photos: guardar solo si hay URLs válidas (no blob URLs temporales)
      const photos = data[`${sectionId}.idealistaPhotos`];
      if (photos && Array.isArray(photos) && photos.length > 0) {
        // Filtrar solo URLs permanentes (que empiezan con http/https)
        const permanentPhotos = photos.filter((url: string) => url.startsWith('http://') || url.startsWith('https://'));
        updates.idealista_photos = permanentPhotos.length > 0 ? permanentPhotos : null;
      } else {
        updates.idealista_photos = null;
      }
    }

    if (Object.keys(updates).length > 0) {
      console.log("💾 Guardando en Supabase:", { propertyId, updates });
      const success = await updateProperty(propertyId, updates);
      if (success) {
        console.log("✅ Guardado exitoso en Supabase");
        
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
      console.warn("⚠️ No hay actualizaciones para guardar");
    }
  };

  // Resetear initializedRef cuando cambia el propertyId
  useEffect(() => {
    initializedRef.current = false;
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
