"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePropertyForm } from "./property-form-context";
import { useProperty } from "@/hooks/use-property";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadDocument } from "@/lib/document-upload";
import { deleteDocument } from "@/lib/document-upload";
import { StatusSelector } from "./status-selector";

interface ReadyToRentTasksProps {
  property: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
}

export function ReadyToRentTasks({ property }: ReadyToRentTasksProps) {
  const { formData, updateField, initializeFormData } = usePropertyForm();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const { property: supabaseProperty, loading } = useProperty(property.property_unique_id);
  
  // Estados para las fotos de cada sección
  const [photosCommonAreas, setPhotosCommonAreas] = useState<string[]>([]);
  const [photosEntryHallways, setPhotosEntryHallways] = useState<string[]>([]);
  const [photosBedrooms, setPhotosBedrooms] = useState<Record<number, string[]>>({});
  const [photosLivingRoom, setPhotosLivingRoom] = useState<string[]>([]);
  const [photosBathrooms, setPhotosBathrooms] = useState<Record<number, string[]>>({});
  const [photosKitchen, setPhotosKitchen] = useState<string[]>([]);
  const [photosExterior, setPhotosExterior] = useState<string[]>([]);
  const [photosGarage, setPhotosGarage] = useState<string[]>([]);
  const [photosStorage, setPhotosStorage] = useState<string[]>([]);
  const [photosTerrace, setPhotosTerrace] = useState<string[]>([]);
  
  // Estados para los selectores de estado (good = buen estado, incident = incidencia)
  // Inicializados en null para que el usuario seleccione manualmente
  const [statusCommonAreas, setStatusCommonAreas] = useState<"good" | "incident" | null>(null);
  const [statusEntryHallways, setStatusEntryHallways] = useState<"good" | "incident" | null>(null);
  const [statusBedrooms, setStatusBedrooms] = useState<Record<number, "good" | "incident" | null>>({});
  const [statusLivingRoom, setStatusLivingRoom] = useState<"good" | "incident" | null>(null);
  const [statusBathrooms, setStatusBathrooms] = useState<Record<number, "good" | "incident" | null>>({});
  const [statusKitchen, setStatusKitchen] = useState<"good" | "incident" | null>(null);
  const [statusExterior, setStatusExterior] = useState<"good" | "incident" | null>(null);
  const [statusGarage, setStatusGarage] = useState<"good" | "incident" | null>(null);
  const [statusTerrace, setStatusTerrace] = useState<"good" | "incident" | null>(null);
  
  // Estados para los comentarios de cada zona
  const [commentCommonAreas, setCommentCommonAreas] = useState<string>("");
  const [commentEntryHallways, setCommentEntryHallways] = useState<string>("");
  const [commentBedrooms, setCommentBedrooms] = useState<Record<number, string>>({});
  const [commentLivingRoom, setCommentLivingRoom] = useState<string>("");
  const [commentBathrooms, setCommentBathrooms] = useState<Record<number, string>>({});
  const [commentKitchen, setCommentKitchen] = useState<string>("");
  const [commentExterior, setCommentExterior] = useState<string>("");
  const [commentGarage, setCommentGarage] = useState<string>("");
  const [commentTerrace, setCommentTerrace] = useState<string>("");
  
  // Estados para saber si la incidencia afecta la comercialización (obligatorio cuando hay incidencia)
  const [affectsCommercializationCommonAreas, setAffectsCommercializationCommonAreas] = useState<boolean | null>(null);
  const [affectsCommercializationEntryHallways, setAffectsCommercializationEntryHallways] = useState<boolean | null>(null);
  const [affectsCommercializationBedrooms, setAffectsCommercializationBedrooms] = useState<Record<number, boolean | null>>({});
  const [affectsCommercializationLivingRoom, setAffectsCommercializationLivingRoom] = useState<boolean | null>(null);
  const [affectsCommercializationBathrooms, setAffectsCommercializationBathrooms] = useState<Record<number, boolean | null>>({});
  const [affectsCommercializationKitchen, setAffectsCommercializationKitchen] = useState<boolean | null>(null);
  const [affectsCommercializationExterior, setAffectsCommercializationExterior] = useState<boolean | null>(null);
  const [affectsCommercializationGarage, setAffectsCommercializationGarage] = useState<boolean | null>(null);
  const [affectsCommercializationTerrace, setAffectsCommercializationTerrace] = useState<boolean | null>(null);

  const sectionId = "readyToRent";
  const hasInitializedRef = useRef(false);

  // Resetear hasInitializedRef cuando cambia la propiedad
  useEffect(() => {
    hasInitializedRef.current = false;
  }, [property.property_unique_id]);

  // Cargar datos desde Supabase cuando se monta el componente
  useEffect(() => {
    // Solo inicializar una vez cuando los datos de Supabase estén disponibles
    if (supabaseProperty && !loading && !hasInitializedRef.current) {
      console.log("📥 Cargando datos desde Supabase:", {
        property_unique_id: property.property_unique_id,
        technical_validation: supabaseProperty.technical_validation,
        monthly_rent: supabaseProperty.monthly_rent,
      });
      
      const initialData: Record<string, any> = {};
      
      if (supabaseProperty.monthly_rent !== null && supabaseProperty.monthly_rent !== undefined) {
        initialData[`${sectionId}.monthlyRent`] = String(supabaseProperty.monthly_rent);
      }
      if (supabaseProperty.announcement_price !== null && supabaseProperty.announcement_price !== undefined) {
        initialData[`${sectionId}.announcementPrice`] = String(supabaseProperty.announcement_price);
      }
      // Cargar owner_notified (incluyendo false como valor válido)
      if (supabaseProperty.owner_notified !== null && supabaseProperty.owner_notified !== undefined) {
        initialData[`${sectionId}.ownerNotified`] = supabaseProperty.owner_notified;
      }
      if (supabaseProperty.publish_online) {
        initialData[`${sectionId}.publishOnline`] = supabaseProperty.publish_online;
      }
      if (supabaseProperty.idealista_price !== null && supabaseProperty.idealista_price !== undefined) {
        initialData[`${sectionId}.idealistaPrice`] = String(supabaseProperty.idealista_price);
      }
      if (supabaseProperty.idealista_description) {
        initialData[`${sectionId}.idealistaDescription`] = supabaseProperty.idealista_description;
      }
      if (supabaseProperty.idealista_address) {
        initialData[`${sectionId}.idealistaAddress`] = supabaseProperty.idealista_address;
      }
      if (supabaseProperty.idealista_city) {
        initialData[`${sectionId}.idealistaCity`] = supabaseProperty.idealista_city;
      }
      if (supabaseProperty.idealista_photos && supabaseProperty.idealista_photos.length > 0) {
        setUploadedImages(supabaseProperty.idealista_photos);
      }
      
      // Cargar fotos de las diferentes secciones
      if (supabaseProperty.photos_common_areas && Array.isArray(supabaseProperty.photos_common_areas)) {
        setPhotosCommonAreas(supabaseProperty.photos_common_areas.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.photos_entry_hallways && Array.isArray(supabaseProperty.photos_entry_hallways)) {
        setPhotosEntryHallways(supabaseProperty.photos_entry_hallways.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.photos_living_room && Array.isArray(supabaseProperty.photos_living_room)) {
        setPhotosLivingRoom(supabaseProperty.photos_living_room.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.photos_kitchen && Array.isArray(supabaseProperty.photos_kitchen)) {
        setPhotosKitchen(supabaseProperty.photos_kitchen.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.photos_exterior && Array.isArray(supabaseProperty.photos_exterior)) {
        setPhotosExterior(supabaseProperty.photos_exterior.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.photos_garage && Array.isArray(supabaseProperty.photos_garage)) {
        setPhotosGarage(supabaseProperty.photos_garage.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.photos_storage && Array.isArray(supabaseProperty.photos_storage)) {
        setPhotosStorage(supabaseProperty.photos_storage.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.photos_terrace && Array.isArray(supabaseProperty.photos_terrace)) {
        setPhotosTerrace(supabaseProperty.photos_terrace.filter((url): url is string => typeof url === "string"));
      }
      
      // Cargar fotos de habitaciones y baños (arrays dinámicos)
      // Nota: Estos campos almacenan arrays de arrays, donde cada índice corresponde a una habitación/baño
      if (supabaseProperty.photos_bedrooms && Array.isArray(supabaseProperty.photos_bedrooms)) {
        const bedroomsPhotos: Record<number, string[]> = {};
        supabaseProperty.photos_bedrooms.forEach((roomPhotos, index) => {
          if (Array.isArray(roomPhotos)) {
            bedroomsPhotos[index] = roomPhotos.filter((url): url is string => typeof url === "string");
          }
        });
        setPhotosBedrooms(bedroomsPhotos);
      }
      if (supabaseProperty.photos_bathrooms && Array.isArray(supabaseProperty.photos_bathrooms)) {
        const bathroomsPhotos: Record<number, string[]> = {};
        supabaseProperty.photos_bathrooms.forEach((bathPhotos, index) => {
          if (Array.isArray(bathPhotos)) {
            bathroomsPhotos[index] = bathPhotos.filter((url): url is string => typeof url === "string");
          }
        });
        setPhotosBathrooms(bathroomsPhotos);
      }
      
      // Cargar estados de verificación (good, incident)
      // Convertir valores antiguos a nuevos si es necesario
      const normalizeStatus = (status: string | null | undefined): "good" | "incident" | null => {
        if (!status) return null;
        if (status === "repair" || status === "replace") return "incident";
        if (status === "not_applicable") return "good";
        if (status === "good" || status === "incident") return status;
        return null;
      };

      if (supabaseProperty.check_common_areas) {
        const normalized = normalizeStatus(supabaseProperty.check_common_areas);
        if (normalized) setStatusCommonAreas(normalized);
      }
      if (supabaseProperty.check_entry_hallways) {
        const normalized = normalizeStatus(supabaseProperty.check_entry_hallways);
        if (normalized) setStatusEntryHallways(normalized);
      }
      if (supabaseProperty.check_living_room) {
        const normalized = normalizeStatus(supabaseProperty.check_living_room);
        if (normalized) setStatusLivingRoom(normalized);
      }
      if (supabaseProperty.check_kitchen) {
        const normalized = normalizeStatus(supabaseProperty.check_kitchen);
        if (normalized) setStatusKitchen(normalized);
      }
      if (supabaseProperty.check_exterior) {
        const normalized = normalizeStatus(supabaseProperty.check_exterior);
        if (normalized) setStatusExterior(normalized);
      }
      if (supabaseProperty.check_garage) {
        const normalized = normalizeStatus(supabaseProperty.check_garage);
        if (normalized) setStatusGarage(normalized);
      }
      if (supabaseProperty.check_terrace) {
        const normalized = normalizeStatus(supabaseProperty.check_terrace);
        if (normalized) setStatusTerrace(normalized);
      }
      
      // Cargar estados de habitaciones y baños (arrays de "good" | "incident")
      if (supabaseProperty.check_bedrooms && Array.isArray(supabaseProperty.check_bedrooms)) {
        const bedroomsStatus: Record<number, "good" | "incident" | null> = {};
        supabaseProperty.check_bedrooms.forEach((status, index) => {
          if (typeof status === "string") {
            // Convertir valores antiguos a nuevos
            const normalizedStatus = status === "repair" || status === "replace" ? "incident" : status === "not_applicable" ? "good" : status;
            if (normalizedStatus === "good" || normalizedStatus === "incident") {
              bedroomsStatus[index] = normalizedStatus;
            }
          }
        });
        setStatusBedrooms(bedroomsStatus);
      }
      if (supabaseProperty.check_bathrooms && Array.isArray(supabaseProperty.check_bathrooms)) {
        const bathroomsStatus: Record<number, "good" | "incident" | null> = {};
        supabaseProperty.check_bathrooms.forEach((status, index) => {
          if (typeof status === "string") {
            // Convertir valores antiguos a nuevos
            const normalizedStatus = status === "repair" || status === "replace" ? "incident" : status === "not_applicable" ? "good" : status;
            if (normalizedStatus === "good" || normalizedStatus === "incident") {
              bathroomsStatus[index] = normalizedStatus;
            }
          }
        });
        setStatusBathrooms(bathroomsStatus);
      }
      
      // Cargar comentarios
      if (supabaseProperty.comment_common_areas) {
        setCommentCommonAreas(supabaseProperty.comment_common_areas);
      }
      if (supabaseProperty.comment_entry_hallways) {
        setCommentEntryHallways(supabaseProperty.comment_entry_hallways);
      }
      if (supabaseProperty.comment_living_room) {
        setCommentLivingRoom(supabaseProperty.comment_living_room);
      }
      if (supabaseProperty.comment_kitchen) {
        setCommentKitchen(supabaseProperty.comment_kitchen);
      }
      if (supabaseProperty.comment_exterior) {
        setCommentExterior(supabaseProperty.comment_exterior);
      }
      if (supabaseProperty.comment_garage) {
        setCommentGarage(supabaseProperty.comment_garage);
      }
      if (supabaseProperty.comment_terrace) {
        setCommentTerrace(supabaseProperty.comment_terrace);
      }
      
      // Cargar comentarios de habitaciones y baños (arrays)
      if (supabaseProperty.comment_bedrooms && Array.isArray(supabaseProperty.comment_bedrooms)) {
        const bedroomsComments: Record<number, string> = {};
        supabaseProperty.comment_bedrooms.forEach((comment, index) => {
          if (typeof comment === "string") {
            bedroomsComments[index] = comment;
          }
        });
        setCommentBedrooms(bedroomsComments);
      }
      if (supabaseProperty.comment_bathrooms && Array.isArray(supabaseProperty.comment_bathrooms)) {
        const bathroomsComments: Record<number, string> = {};
        supabaseProperty.comment_bathrooms.forEach((comment, index) => {
          if (typeof comment === "string") {
            bathroomsComments[index] = comment;
          }
        });
        setCommentBathrooms(bathroomsComments);
      }
      
      // Cargar estados de afectación a comercialización
      if (supabaseProperty.affects_commercialization_common_areas !== null && supabaseProperty.affects_commercialization_common_areas !== undefined) {
        setAffectsCommercializationCommonAreas(supabaseProperty.affects_commercialization_common_areas);
      }
      if (supabaseProperty.affects_commercialization_entry_hallways !== null && supabaseProperty.affects_commercialization_entry_hallways !== undefined) {
        setAffectsCommercializationEntryHallways(supabaseProperty.affects_commercialization_entry_hallways);
      }
      if (supabaseProperty.affects_commercialization_living_room !== null && supabaseProperty.affects_commercialization_living_room !== undefined) {
        setAffectsCommercializationLivingRoom(supabaseProperty.affects_commercialization_living_room);
      }
      if (supabaseProperty.affects_commercialization_kitchen !== null && supabaseProperty.affects_commercialization_kitchen !== undefined) {
        setAffectsCommercializationKitchen(supabaseProperty.affects_commercialization_kitchen);
      }
      if (supabaseProperty.affects_commercialization_exterior !== null && supabaseProperty.affects_commercialization_exterior !== undefined) {
        setAffectsCommercializationExterior(supabaseProperty.affects_commercialization_exterior);
      }
      if (supabaseProperty.affects_commercialization_garage !== null && supabaseProperty.affects_commercialization_garage !== undefined) {
        setAffectsCommercializationGarage(supabaseProperty.affects_commercialization_garage);
      }
      if (supabaseProperty.affects_commercialization_terrace !== null && supabaseProperty.affects_commercialization_terrace !== undefined) {
        setAffectsCommercializationTerrace(supabaseProperty.affects_commercialization_terrace);
      }
      
      // Cargar arrays de afectación a comercialización para habitaciones y baños
      if (supabaseProperty.affects_commercialization_bedrooms && Array.isArray(supabaseProperty.affects_commercialization_bedrooms)) {
        const bedroomsAffects: Record<number, boolean | null> = {};
        supabaseProperty.affects_commercialization_bedrooms.forEach((affects, index) => {
          if (typeof affects === "boolean") {
            bedroomsAffects[index] = affects;
          }
        });
        setAffectsCommercializationBedrooms(bedroomsAffects);
      }
      if (supabaseProperty.affects_commercialization_bathrooms && Array.isArray(supabaseProperty.affects_commercialization_bathrooms)) {
        const bathroomsAffects: Record<number, boolean | null> = {};
        supabaseProperty.affects_commercialization_bathrooms.forEach((affects, index) => {
          if (typeof affects === "boolean") {
            bathroomsAffects[index] = affects;
          }
        });
        setAffectsCommercializationBathrooms(bathroomsAffects);
      }

      if (Object.keys(initialData).length > 0) {
        initializeFormData(initialData);
        hasInitializedRef.current = true;
      }
    }
  }, [supabaseProperty, loading, initializeFormData, sectionId]);

  // Obtener valores del formulario o valores por defecto
  const monthlyRent = formData[`${sectionId}.monthlyRent`] || "";
  const announcementPrice = formData[`${sectionId}.announcementPrice`] || "";
  const ownerNotified = formData[`${sectionId}.ownerNotified`] || false;
  const publishOnline = formData[`${sectionId}.publishOnline`] || "";
  const idealistaPrice = formData[`${sectionId}.idealistaPrice`] || announcementPrice || "";
  const idealistaDescription = formData[`${sectionId}.idealistaDescription`] || "";
  const idealistaAddress = formData[`${sectionId}.idealistaAddress`] || property.address || "";
  const idealistaCity = formData[`${sectionId}.idealistaCity`] || property.city || "";


  const handleMonthlyRentChange = (value: string) => {
    updateField(sectionId, "monthlyRent", value);
  };

  const handleAnnouncementPriceChange = (value: string) => {
    updateField(sectionId, "announcementPrice", value);
    // Si el precio de idealista está vacío, actualizarlo también
    if (!idealistaPrice) {
      updateField(sectionId, "idealistaPrice", value);
    }
  };

  const handleOwnerNotifiedChange = (checked: boolean) => {
    updateField(sectionId, "ownerNotified", checked);
  };

  const handlePublishOnlineChange = (value: string) => {
    updateField(sectionId, "publishOnline", value);
  };

  const handleIdealistaFieldChange = (field: string, value: string) => {
    updateField(sectionId, field, value);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Por ahora guardamos las URLs locales (blob URLs)
      // TODO: En producción, subir las imágenes a Supabase Storage y guardar las URLs permanentes
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
      const updatedImages = [...uploadedImages, ...newImages];
      setUploadedImages(updatedImages);
      
      // Guardar las URLs en el formulario (por ahora son blob URLs temporales)
      updateField(sectionId, "idealistaPhotos", updatedImages);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index]);
      newImages.splice(index, 1);
      
      // Actualizar el formulario
      updateField(sectionId, "idealistaPhotos", newImages);
      
      return newImages;
    });
  };

  // Función para actualizar el estado de verificación en Supabase
  const handleStatusChange = async (
    fieldName: string,
    status: "good" | "incident",
    roomIndex?: number
  ) => {
    if (!supabaseProperty?.property_unique_id) {
      toast.error("Error: No se pudo identificar la propiedad");
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Para habitaciones y baños (arrays de StatusValue)
      if ((fieldName === "check_bedrooms" || fieldName === "check_bathrooms") && roomIndex !== undefined) {
        const { data: currentProperty } = await supabase
          .from("properties")
          .select(fieldName)
          .eq("property_unique_id", supabaseProperty.property_unique_id)
          .single();

        const currentArray = (Array.isArray(currentProperty?.[fieldName])
          ? currentProperty[fieldName]
          : []) as string[];

        // Asegurar que el array tenga suficientes elementos
        while (currentArray.length <= roomIndex) {
          currentArray.push("good"); // Por defecto "good"
        }

        // Normalizar el valor antes de guardarlo
        const normalizedStatus = status === "repair" || status === "replace" ? "incident" : status === "not_applicable" ? "good" : status;
        currentArray[roomIndex] = normalizedStatus;

        await supabase
          .from("properties")
          .update({ [fieldName]: currentArray })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        // Actualizar estado local
        if (fieldName === "check_bedrooms") {
          setStatusBedrooms((prev) => ({ ...prev, [roomIndex]: status }));
        } else {
          setStatusBathrooms((prev) => ({ ...prev, [roomIndex]: status }));
        }
      } else {
        // Para campos simples (StatusValue como texto)
        await supabase
          .from("properties")
          .update({ [fieldName]: status })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        // Actualizar estado local
        switch (fieldName) {
          case "check_common_areas":
            setStatusCommonAreas(status);
            break;
          case "check_entry_hallways":
            setStatusEntryHallways(status);
            break;
          case "check_living_room":
            setStatusLivingRoom(status);
            break;
          case "check_kitchen":
            setStatusKitchen(status);
            break;
          case "check_exterior":
            setStatusExterior(status);
            break;
          case "check_garage":
            setStatusGarage(status);
            break;
          case "check_terrace":
            setStatusTerrace(status);
            break;
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(`Error al actualizar el estado: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Helper para determinar si se debe mostrar el campo de fotos (cuando hay un estado seleccionado)
  const shouldShowPhotos = (status: "good" | "incident" | null): boolean => {
    return status !== null;
  };

  // Helper para determinar si se debe mostrar el campo de comentario (solo para incidencias)
  const shouldShowComment = (status: "good" | "incident" | null): boolean => {
    return status === "incident";
  };

  // Función para guardar si afecta la comercialización en Supabase
  const handleAffectsCommercializationChange = async (
    fieldName: string,
    affects: boolean,
    roomIndex?: number
  ) => {
    if (!supabaseProperty?.property_unique_id) {
      toast.error("Error: No se pudo identificar la propiedad");
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Para habitaciones y baños (arrays)
      if ((fieldName === "affects_commercialization_bedrooms" || fieldName === "affects_commercialization_bathrooms") && roomIndex !== undefined) {
        const { data: currentProperty } = await supabase
          .from("properties")
          .select(fieldName)
          .eq("property_unique_id", supabaseProperty.property_unique_id)
          .single();

        const currentArray = (Array.isArray(currentProperty?.[fieldName])
          ? currentProperty[fieldName]
          : []) as boolean[];

        // Asegurar que el array tenga suficientes elementos
        while (currentArray.length <= roomIndex) {
          currentArray.push(false);
        }

        currentArray[roomIndex] = affects;

        await supabase
          .from("properties")
          .update({ [fieldName]: currentArray })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        // Actualizar estado local
        if (fieldName === "affects_commercialization_bedrooms") {
          setAffectsCommercializationBedrooms((prev) => ({ ...prev, [roomIndex]: affects }));
        } else {
          setAffectsCommercializationBathrooms((prev) => ({ ...prev, [roomIndex]: affects }));
        }
      } else {
        // Para campos simples (boolean)
        await supabase
          .from("properties")
          .update({ [fieldName]: affects })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        // Actualizar estado local
        switch (fieldName) {
          case "affects_commercialization_common_areas":
            setAffectsCommercializationCommonAreas(affects);
            break;
          case "affects_commercialization_entry_hallways":
            setAffectsCommercializationEntryHallways(affects);
            break;
          case "affects_commercialization_living_room":
            setAffectsCommercializationLivingRoom(affects);
            break;
          case "affects_commercialization_kitchen":
            setAffectsCommercializationKitchen(affects);
            break;
          case "affects_commercialization_exterior":
            setAffectsCommercializationExterior(affects);
            break;
          case "affects_commercialization_garage":
            setAffectsCommercializationGarage(affects);
            break;
          case "affects_commercialization_terrace":
            setAffectsCommercializationTerrace(affects);
            break;
        }
      }
    } catch (error) {
      console.error("Error updating affects commercialization:", error);
      toast.error(`Error al guardar: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Función para guardar comentarios en Supabase
  const handleCommentChange = async (
    fieldName: string,
    comment: string,
    roomIndex?: number
  ) => {
    if (!supabaseProperty?.property_unique_id) {
      toast.error("Error: No se pudo identificar la propiedad");
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Para habitaciones y baños (arrays)
      if ((fieldName === "comment_bedrooms" || fieldName === "comment_bathrooms") && roomIndex !== undefined) {
        const { data: currentProperty } = await supabase
          .from("properties")
          .select(fieldName)
          .eq("property_unique_id", supabaseProperty.property_unique_id)
          .single();

        const currentArray = (Array.isArray(currentProperty?.[fieldName])
          ? currentProperty[fieldName]
          : []) as string[];

        // Asegurar que el array tenga suficientes elementos
        while (currentArray.length <= roomIndex) {
          currentArray.push("");
        }

        currentArray[roomIndex] = comment;

        await supabase
          .from("properties")
          .update({ [fieldName]: currentArray })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        // Actualizar estado local
        if (fieldName === "comment_bedrooms") {
          setCommentBedrooms((prev) => ({ ...prev, [roomIndex]: comment }));
        } else {
          setCommentBathrooms((prev) => ({ ...prev, [roomIndex]: comment }));
        }
      } else {
        // Para campos simples (texto)
        await supabase
          .from("properties")
          .update({ [fieldName]: comment || null })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        // Actualizar estado local
        switch (fieldName) {
          case "comment_common_areas":
            setCommentCommonAreas(comment);
            break;
          case "comment_entry_hallways":
            setCommentEntryHallways(comment);
            break;
          case "comment_living_room":
            setCommentLivingRoom(comment);
            break;
          case "comment_kitchen":
            setCommentKitchen(comment);
            break;
          case "comment_exterior":
            setCommentExterior(comment);
            break;
          case "comment_garage":
            setCommentGarage(comment);
            break;
          case "comment_terrace":
            setCommentTerrace(comment);
            break;
        }
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error(`Error al guardar el comentario: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Helper function para subir fotos a una sección específica
  const handlePhotoUpload = async (
    fieldName: string,
    files: FileList,
    currentPhotos: string[],
    setPhotos: (photos: string[]) => void,
    roomIndex?: number // Para habitaciones y baños dinámicos
  ) => {
    if (!supabaseProperty?.property_unique_id) {
      toast.error("Error: No se pudo identificar la propiedad");
      return;
    }

    try {
      // Para habitaciones y baños, necesitamos manejar arrays de arrays
      const isArrayOfArrays = roomIndex !== undefined && (fieldName === "photos_bedrooms" || fieldName === "photos_bathrooms");
      
      if (isArrayOfArrays) {
        // Para habitaciones y baños: subir directamente y actualizar el array de arrays
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        // Obtener el array actual
        const { data: currentProperty } = await supabase
          .from("properties")
          .select(fieldName)
          .eq("property_unique_id", supabaseProperty.property_unique_id)
          .single();
        
        const currentArrayOfArrays = (Array.isArray(currentProperty?.[fieldName]) 
          ? currentProperty[fieldName] 
          : []) as string[][];
        
        // Asegurar que el array tenga suficientes elementos
        while (currentArrayOfArrays.length <= roomIndex) {
          currentArrayOfArrays.push([]);
        }
        
        // Subir las fotos usando el API con roomIndex
        const uploadPromises = Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("fieldName", fieldName);
          formData.append("propertyId", supabaseProperty.property_unique_id);
          formData.append("roomIndex", String(roomIndex));
          
          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(errorData.error || `Upload failed with status ${response.status}`);
          }
          
          const data = await response.json();
          return data.url;
        });
        
        const newUrls = await Promise.all(uploadPromises);
        
        // Obtener el array actualizado (el API lo habrá actualizado)
        const { data: updatedProperty } = await supabase
          .from("properties")
          .select(fieldName)
          .eq("property_unique_id", supabaseProperty.property_unique_id)
          .single();
        
        const updatedArrayOfArrays = (Array.isArray(updatedProperty?.[fieldName]) 
          ? updatedProperty[fieldName] 
          : []) as string[][];
        
        const updatedRoomPhotos = updatedArrayOfArrays[roomIndex] || [];
        setPhotos(updatedRoomPhotos);
        toast.success(`${newUrls.length} foto(s) subida(s) correctamente`);
      } else {
        // Para campos simples (arrays de strings)
        const uploadPromises = Array.from(files).map(async (file) => {
          const url = await uploadDocument(fieldName, supabaseProperty.property_unique_id, file);
          return url;
        });

        const newUrls = await Promise.all(uploadPromises);
        const updatedPhotos = [...currentPhotos, ...newUrls];
        setPhotos(updatedPhotos);
        toast.success(`${newUrls.length} foto(s) subida(s) correctamente`);
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error(`Error al subir las fotos: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Helper function para eliminar una foto de una sección específica
  const handlePhotoDelete = async (
    fieldName: string,
    photoUrl: string,
    currentPhotos: string[],
    setPhotos: (photos: string[]) => void,
    roomIndex?: number // Para habitaciones y baños dinámicos
  ) => {
    if (!supabaseProperty?.property_unique_id) {
      toast.error("Error: No se pudo identificar la propiedad");
      return;
    }

    try {
      const isArrayOfArrays = roomIndex !== undefined && (fieldName === "photos_bedrooms" || fieldName === "photos_bathrooms");
      
      if (isArrayOfArrays) {
        // Eliminar del array de arrays
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        // Obtener el array actual
        const { data: currentProperty } = await supabase
          .from("properties")
          .select(fieldName)
          .eq("property_unique_id", supabaseProperty.property_unique_id)
          .single();
        
        const currentArrayOfArrays = (Array.isArray(currentProperty?.[fieldName]) 
          ? currentProperty[fieldName] 
          : []) as string[][];
        
        // Eliminar la URL del array específico
        if (currentArrayOfArrays[roomIndex]) {
          currentArrayOfArrays[roomIndex] = currentArrayOfArrays[roomIndex].filter(url => url !== photoUrl);
          
          // Actualizar en Supabase
          await supabase
            .from("properties")
            .update({ [fieldName]: currentArrayOfArrays })
            .eq("property_unique_id", supabaseProperty.property_unique_id);
        }
        
        // Eliminar del array de arrays primero
        // Luego eliminar el archivo del storage
        const deleteResponse = await fetch("/api/documents/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fieldName: fieldName,
            propertyId: supabaseProperty.property_unique_id,
            fileUrl: photoUrl,
            roomIndex: roomIndex, // Pasar roomIndex para arrays de arrays
          }),
        });
        
        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `Delete failed with status ${deleteResponse.status}`);
        }
        
        const updatedPhotos = currentPhotos.filter((url) => url !== photoUrl);
        setPhotos(updatedPhotos);
      } else {
        // Para campos simples
        await deleteDocument(fieldName, supabaseProperty.property_unique_id, photoUrl);
        const updatedPhotos = currentPhotos.filter((url) => url !== photoUrl);
        setPhotos(updatedPhotos);
      }
      
      toast.success("Foto eliminada correctamente");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error(`Error al eliminar la foto: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Componente para mostrar un campo de subida de fotos
  const PhotoUploadSection = ({
    title,
    fieldName,
    photos,
    setPhotos,
    roomIndex,
  }: {
    title: string;
    fieldName: string;
    photos: string[];
    setPhotos: (photos: string[]) => void;
    roomIndex?: number;
  }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handlePhotoUpload(fieldName, e.target.files, photos, setPhotos, roomIndex);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    const handleDelete = (photoUrl: string) => {
      handlePhotoDelete(fieldName, photoUrl, photos, setPhotos, roomIndex);
    };

    return (
      <div className="space-y-2">
        {title && <Label className="text-sm font-medium">{title}</Label>}
        <div className="border-2 border-dashed border-border rounded-lg p-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id={`photo-upload-${fieldName}`}
            />
            <label
              htmlFor={`photo-upload-${fieldName}`}
              className="flex flex-col items-center justify-center w-full cursor-pointer"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground text-center">
                Haz clic para subir fotos o arrastra y suelta
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF hasta 10MB
              </span>
            </label>
          </div>

          {/* Preview de imágenes subidas */}
          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`${title} ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(imageUrl)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Final check y fotos de la Propiedad */}
      <div id="section-photos" className="space-y-6">
        <div className="border-b pb-2">
          <h2 className="text-xl font-semibold">Final check y fotos de la propiedad</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Evalúa cada zona si está en buen estado sube cada foto y si está en mal estado sube la foto y agrega un comentario.
          </p>
        </div>

        {/* Accordion principal para todas las secciones de fotos */}
        <Accordion type="multiple" className="w-full space-y-4">
          {/* Entorno y zonas comunes */}
          <AccordionItem value="common-areas" className="border rounded-lg overflow-hidden">
            <Card>
              <CardHeader className="pb-3 p-6">
                <AccordionTrigger className="hover:no-underline py-0 items-center">
                  <CardTitle className="text-base font-semibold flex-1 text-left">Entorno y zonas comunes de la vivienda</CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="pt-0 space-y-4">
                  <StatusSelector
                    variant="final-check"
                    value={statusCommonAreas}
                    onChange={(value) => handleStatusChange("check_common_areas", value as "good" | "incident")}
                  />
                  {shouldShowPhotos(statusCommonAreas) && (
                    <>
                      {shouldShowComment(statusCommonAreas) && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              ¿Afecta la comercialización? <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="affects-commercialization-common-areas"
                                  value="yes"
                                  checked={affectsCommercializationCommonAreas === true}
                                  onChange={() => handleAffectsCommercializationChange("affects_commercialization_common_areas", true)}
                                  className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                  required
                                />
                                <span className="text-sm">Sí</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="affects-commercialization-common-areas"
                                  value="no"
                                  checked={affectsCommercializationCommonAreas === false}
                                  onChange={() => handleAffectsCommercializationChange("affects_commercialization_common_areas", false)}
                                  className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                  required
                                />
                                <span className="text-sm">No</span>
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="comment-common-areas" className="text-sm font-medium">
                              Comentario
                            </Label>
                            <Textarea
                              id="comment-common-areas"
                              placeholder="Describe el problema o el estado de esta zona..."
                              value={commentCommonAreas}
                              onChange={(e) => handleCommentChange("comment_common_areas", e.target.value)}
                              rows={3}
                            />
                          </div>
                        </>
                      )}
                      <PhotoUploadSection
                        title=""
                        fieldName="photos_common_areas"
                        photos={photosCommonAreas}
                        setPhotos={setPhotosCommonAreas}
                      />
                    </>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Entrada y pasillos */}
          <AccordionItem value="entry-hallways" className="border rounded-lg overflow-hidden">
            <Card>
              <CardHeader className="pb-3 p-6">
                <AccordionTrigger className="hover:no-underline py-0 items-center">
                  <CardTitle className="text-base font-semibold flex-1 text-left">Entrada y pasillos de la vivienda</CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="pt-0 space-y-4">
                  <StatusSelector
                    variant="final-check"
                    value={statusEntryHallways}
                    onChange={(value) => handleStatusChange("check_entry_hallways", value as "good" | "incident")}
                  />
                  {shouldShowPhotos(statusEntryHallways) && (
                    <>
                      {shouldShowComment(statusEntryHallways) && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              ¿Afecta la comercialización? <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="affects-commercialization-entry-hallways"
                                  value="yes"
                                  checked={affectsCommercializationEntryHallways === true}
                                  onChange={() => handleAffectsCommercializationChange("affects_commercialization_entry_hallways", true)}
                                  className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                  required
                                />
                                <span className="text-sm">Sí</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="affects-commercialization-entry-hallways"
                                  value="no"
                                  checked={affectsCommercializationEntryHallways === false}
                                  onChange={() => handleAffectsCommercializationChange("affects_commercialization_entry_hallways", false)}
                                  className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                  required
                                />
                                <span className="text-sm">No</span>
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="comment-entry-hallways" className="text-sm font-medium">
                              Comentario
                            </Label>
                            <Textarea
                              id="comment-entry-hallways"
                              placeholder="Describe el problema o el estado de esta zona..."
                              value={commentEntryHallways}
                              onChange={(e) => handleCommentChange("comment_entry_hallways", e.target.value)}
                              rows={3}
                            />
                          </div>
                        </>
                      )}
                      <PhotoUploadSection
                        title=""
                        fieldName="photos_entry_hallways"
                        photos={photosEntryHallways}
                        setPhotos={setPhotosEntryHallways}
                      />
                    </>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Habitaciones - Dinámico según número de habitaciones */}
          {supabaseProperty?.bedrooms && supabaseProperty.bedrooms > 0 && (
            <>
              {supabaseProperty.bedrooms === 1 ? (
                // Si solo hay una habitación, mostrar directamente en accordion
                <AccordionItem value="bedroom-0" className="border rounded-lg overflow-hidden">
                  <Card>
                    <CardHeader className="pb-3 p-6">
                      <AccordionTrigger className="hover:no-underline py-0 items-center">
                        <CardTitle className="text-base font-semibold flex-1 text-left">Habitación 1</CardTitle>
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                      <CardContent className="pt-0 space-y-4">
                        <StatusSelector
                          variant="final-check"
                          value={statusBedrooms[0] ?? null}
                          onChange={(value) => handleStatusChange("check_bedrooms", value as "good" | "incident", 0)}
                        />
                        {shouldShowPhotos(statusBedrooms[0]) && (
                          <>
                            {shouldShowComment(statusBedrooms[0]) && (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    ¿Afecta la comercialización? <span className="text-red-500">*</span>
                                  </Label>
                                  <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name="affects-commercialization-bedroom-0"
                                        value="yes"
                                        checked={affectsCommercializationBedrooms[0] === true}
                                        onChange={() => handleAffectsCommercializationChange("affects_commercialization_bedrooms", true, 0)}
                                        className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                        required
                                      />
                                      <span className="text-sm">Sí</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name="affects-commercialization-bedroom-0"
                                        value="no"
                                        checked={affectsCommercializationBedrooms[0] === false}
                                        onChange={() => handleAffectsCommercializationChange("affects_commercialization_bedrooms", false, 0)}
                                        className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                        required
                                      />
                                      <span className="text-sm">No</span>
                                    </label>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="comment-bedroom-0" className="text-sm font-medium">
                                    Comentario
                                  </Label>
                                  <Textarea
                                    id="comment-bedroom-0"
                                    placeholder="Describe el problema o el estado de esta habitación..."
                                    value={commentBedrooms[0] || ""}
                                    onChange={(e) => handleCommentChange("comment_bedrooms", e.target.value, 0)}
                                    rows={3}
                                  />
                                </div>
                              </>
                            )}
                            <PhotoUploadSection
                              title=""
                              fieldName="photos_bedrooms"
                              photos={photosBedrooms[0] || []}
                              setPhotos={(newPhotos) => {
                                setPhotosBedrooms((prev) => ({ ...prev, [0]: newPhotos }));
                              }}
                              roomIndex={0}
                            />
                          </>
                        )}
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ) : (
                // Si hay múltiples habitaciones, usar accordion anidado
                <AccordionItem value="bedrooms" className="border rounded-lg overflow-hidden">
                  <Card>
                    <CardHeader className="pb-3 p-6">
                      <AccordionTrigger className="hover:no-underline py-0 items-center">
                        <CardTitle className="text-base font-semibold flex-1 text-left">Habitaciones</CardTitle>
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                      <CardContent className="pt-0">
                        <Accordion type="multiple" className="w-full">
                          {Array.from({ length: supabaseProperty.bedrooms }, (_, index) => (
                            <AccordionItem key={`bedroom-${index}`} value={`bedroom-${index}`} className="border-b">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="text-sm font-medium">Habitación {index + 1}</span>
                              </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                          <StatusSelector
                            variant="final-check"
                            value={statusBedrooms[index] ?? null}
                            onChange={(value) => handleStatusChange("check_bedrooms", value as "good" | "incident", index)}
                          />
                          {shouldShowPhotos(statusBedrooms[index]) && (
                            <>
                              {shouldShowComment(statusBedrooms[index]) && (
                                <>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                      ¿Afecta la comercialización? <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex gap-4">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`affects-commercialization-bedroom-${index}`}
                                          value="yes"
                                          checked={affectsCommercializationBedrooms[index] === true}
                                          onChange={() => handleAffectsCommercializationChange("affects_commercialization_bedrooms", true, index)}
                                          className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                          required
                                        />
                                        <span className="text-sm">Sí</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`affects-commercialization-bedroom-${index}`}
                                          value="no"
                                          checked={affectsCommercializationBedrooms[index] === false}
                                          onChange={() => handleAffectsCommercializationChange("affects_commercialization_bedrooms", false, index)}
                                          className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                          required
                                        />
                                        <span className="text-sm">No</span>
                                      </label>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`comment-bedroom-${index}`} className="text-sm font-medium">
                                      Comentario
                                    </Label>
                                    <Textarea
                                      id={`comment-bedroom-${index}`}
                                      placeholder="Describe el problema o el estado de esta habitación..."
                                      value={commentBedrooms[index] || ""}
                                      onChange={(e) => handleCommentChange("comment_bedrooms", e.target.value, index)}
                                      rows={3}
                                    />
                                  </div>
                                </>
                              )}
                              <PhotoUploadSection
                                title=""
                                fieldName="photos_bedrooms"
                                photos={photosBedrooms[index] || []}
                                setPhotos={(newPhotos) => {
                                  setPhotosBedrooms((prev) => ({ ...prev, [index]: newPhotos }));
                                }}
                                roomIndex={index}
                              />
                            </>
                          )}
                        </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              )}
            </>
          )}

          {/* Salón */}
          <AccordionItem value="living-room" className="border rounded-lg overflow-hidden">
            <Card>
              <CardHeader className="pb-3 p-6">
                <AccordionTrigger className="hover:no-underline py-0 items-center">
                  <CardTitle className="text-base font-semibold flex-1 text-left">Salón</CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="pt-0 space-y-4">
                  <StatusSelector
                    variant="final-check"
                    value={statusLivingRoom}
                    onChange={(value) => handleStatusChange("check_living_room", value as "good" | "incident")}
                  />
                  {shouldShowPhotos(statusLivingRoom) && (
                    <>
                      {shouldShowComment(statusLivingRoom) && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              ¿Afecta la comercialización? <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="affects-commercialization-living-room"
                                  value="yes"
                                  checked={affectsCommercializationLivingRoom === true}
                                  onChange={() => handleAffectsCommercializationChange("affects_commercialization_living_room", true)}
                                  className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                  required
                                />
                                <span className="text-sm">Sí</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="affects-commercialization-living-room"
                                  value="no"
                                  checked={affectsCommercializationLivingRoom === false}
                                  onChange={() => handleAffectsCommercializationChange("affects_commercialization_living_room", false)}
                                  className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                  required
                                />
                                <span className="text-sm">No</span>
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="comment-living-room" className="text-sm font-medium">
                              Comentario
                            </Label>
                            <Textarea
                              id="comment-living-room"
                              placeholder="Describe el problema o el estado del salón..."
                              value={commentLivingRoom}
                              onChange={(e) => handleCommentChange("comment_living_room", e.target.value)}
                              rows={3}
                            />
                          </div>
                        </>
                      )}
                      <PhotoUploadSection
                        title=""
                        fieldName="photos_living_room"
                        photos={photosLivingRoom}
                        setPhotos={setPhotosLivingRoom}
                      />
                    </>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Baños - Dinámico según número de baños */}
          {supabaseProperty?.bathrooms && supabaseProperty.bathrooms > 0 && (
            <>
              {supabaseProperty.bathrooms === 1 ? (
                // Si solo hay un baño, mostrar directamente en accordion
                <AccordionItem value="bathroom-0" className="border rounded-lg overflow-hidden">
                  <Card>
                    <CardHeader className="pb-3 p-6">
                      <AccordionTrigger className="hover:no-underline py-0 items-center">
                        <CardTitle className="text-base font-semibold flex-1 text-left">Baño 1</CardTitle>
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                      <CardContent className="pt-0 space-y-4">
                        <StatusSelector
                          variant="final-check"
                          value={statusBathrooms[0] ?? null}
                          onChange={(value) => handleStatusChange("check_bathrooms", value as "good" | "incident", 0)}
                        />
                        {shouldShowPhotos(statusBathrooms[0]) && (
                          <>
                            {shouldShowComment(statusBathrooms[0]) && (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    ¿Afecta la comercialización? <span className="text-red-500">*</span>
                                  </Label>
                                  <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name="affects-commercialization-bathroom-0"
                                        value="yes"
                                        checked={affectsCommercializationBathrooms[0] === true}
                                        onChange={() => handleAffectsCommercializationChange("affects_commercialization_bathrooms", true, 0)}
                                        className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                        required
                                      />
                                      <span className="text-sm">Sí</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name="affects-commercialization-bathroom-0"
                                        value="no"
                                        checked={affectsCommercializationBathrooms[0] === false}
                                        onChange={() => handleAffectsCommercializationChange("affects_commercialization_bathrooms", false, 0)}
                                        className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                        required
                                      />
                                      <span className="text-sm">No</span>
                                    </label>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="comment-bathroom-0" className="text-sm font-medium">
                                    Comentario
                                  </Label>
                                  <Textarea
                                    id="comment-bathroom-0"
                                    placeholder="Describe el problema o el estado de este baño..."
                                    value={commentBathrooms[0] || ""}
                                    onChange={(e) => handleCommentChange("comment_bathrooms", e.target.value, 0)}
                                    rows={3}
                                  />
                                </div>
                              </>
                            )}
                            <PhotoUploadSection
                              title=""
                              fieldName="photos_bathrooms"
                              photos={photosBathrooms[0] || []}
                              setPhotos={(newPhotos) => {
                                setPhotosBathrooms((prev) => ({ ...prev, [0]: newPhotos }));
                              }}
                              roomIndex={0}
                            />
                          </>
                        )}
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ) : (
                // Si hay múltiples baños, usar accordion anidado
                <AccordionItem value="bathrooms" className="border rounded-lg overflow-hidden">
                  <Card>
                    <CardHeader className="pb-3 p-6">
                      <AccordionTrigger className="hover:no-underline py-0 items-center">
                        <CardTitle className="text-base font-semibold flex-1 text-left">Baños</CardTitle>
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                      <CardContent className="pt-0">
                        <Accordion type="multiple" className="w-full">
                          {Array.from({ length: supabaseProperty.bathrooms }, (_, index) => (
                            <AccordionItem key={`bathroom-${index}`} value={`bathroom-${index}`} className="border-b">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="text-sm font-medium">Baño {index + 1}</span>
                              </AccordionTrigger>
                              <AccordionContent className="pt-4 space-y-4">
                                <StatusSelector
                                  variant="final-check"
                                  value={statusBathrooms[index] ?? null}
                                  onChange={(value) => handleStatusChange("check_bathrooms", value as "good" | "incident", index)}
                                />
                                {shouldShowPhotos(statusBathrooms[index]) && (
                                  <>
                                    {shouldShowComment(statusBathrooms[index]) && (
                                      <>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            ¿Afecta la comercialización? <span className="text-red-500">*</span>
                                          </Label>
                                          <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input
                                                type="radio"
                                                name={`affects-commercialization-bathroom-${index}`}
                                                value="yes"
                                                checked={affectsCommercializationBathrooms[index] === true}
                                                onChange={() => handleAffectsCommercializationChange("affects_commercialization_bathrooms", true, index)}
                                                className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                                required
                                              />
                                              <span className="text-sm">Sí</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input
                                                type="radio"
                                                name={`affects-commercialization-bathroom-${index}`}
                                                value="no"
                                                checked={affectsCommercializationBathrooms[index] === false}
                                                onChange={() => handleAffectsCommercializationChange("affects_commercialization_bathrooms", false, index)}
                                                className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                                required
                                              />
                                              <span className="text-sm">No</span>
                                            </label>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`comment-bathroom-${index}`} className="text-sm font-medium">
                                            Comentario
                                          </Label>
                                          <Textarea
                                            id={`comment-bathroom-${index}`}
                                            placeholder="Describe el problema o el estado de este baño..."
                                            value={commentBathrooms[index] || ""}
                                            onChange={(e) => handleCommentChange("comment_bathrooms", e.target.value, index)}
                                            rows={3}
                                          />
                                        </div>
                                      </>
                                    )}
                                    <PhotoUploadSection
                                      title=""
                                      fieldName="photos_bathrooms"
                                      photos={photosBathrooms[index] || []}
                                      setPhotos={(newPhotos) => {
                                        setPhotosBathrooms((prev) => ({ ...prev, [index]: newPhotos }));
                                      }}
                                      roomIndex={index}
                                    />
                                  </>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              )}
            </>
          )}

          {/* Cocina */}
          <AccordionItem value="kitchen" className="border rounded-lg overflow-hidden">
            <Card>
              <CardHeader className="pb-3 p-6">
                <AccordionTrigger className="hover:no-underline py-0 items-center">
                  <CardTitle className="text-base font-semibold flex-1 text-left">Cocina</CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="pt-0 space-y-4">
                  <StatusSelector
                    variant="final-check"
                    value={statusKitchen}
                    onChange={(value) => handleStatusChange("check_kitchen", value as "good" | "incident")}
                  />
                  {shouldShowPhotos(statusKitchen) && (
                    <>
                      {shouldShowComment(statusKitchen) && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              ¿Afecta la comercialización? <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="affects-commercialization-kitchen"
                                  value="yes"
                                  checked={affectsCommercializationKitchen === true}
                                  onChange={() => handleAffectsCommercializationChange("affects_commercialization_kitchen", true)}
                                  className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                  required
                                />
                                <span className="text-sm">Sí</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="affects-commercialization-kitchen"
                                  value="no"
                                  checked={affectsCommercializationKitchen === false}
                                  onChange={() => handleAffectsCommercializationChange("affects_commercialization_kitchen", false)}
                                  className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                  required
                                />
                                <span className="text-sm">No</span>
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="comment-kitchen" className="text-sm font-medium">
                              Comentario
                            </Label>
                            <Textarea
                              id="comment-kitchen"
                              placeholder="Describe el problema o el estado de la cocina..."
                              value={commentKitchen}
                              onChange={(e) => handleCommentChange("comment_kitchen", e.target.value)}
                              rows={3}
                            />
                          </div>
                        </>
                      )}
                      <PhotoUploadSection
                        title=""
                        fieldName="photos_kitchen"
                        photos={photosKitchen}
                        setPhotos={setPhotosKitchen}
                      />
                    </>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Exteriores */}
          <AccordionItem value="exterior" className="border rounded-lg overflow-hidden">
            <Card>
              <CardHeader className="pb-3 p-6">
                <AccordionTrigger className="hover:no-underline py-0 items-center">
                  <CardTitle className="text-base font-semibold flex-1 text-left">Exteriores de la vivienda</CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="pt-0 space-y-4">
                    <StatusSelector
                      variant="final-check"
                      value={statusExterior}
                      onChange={(value) => handleStatusChange("check_exterior", value as "good" | "incident")}
                  />
                  {shouldShowPhotos(statusExterior) && (
                    <>
                      {shouldShowComment(statusExterior) && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              ¿Afecta la comercialización? <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="affects-commercialization-exterior"
                                  value="yes"
                                  checked={affectsCommercializationExterior === true}
                                  onChange={() => handleAffectsCommercializationChange("affects_commercialization_exterior", true)}
                                  className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                  required
                                />
                                <span className="text-sm">Sí</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="affects-commercialization-exterior"
                                  value="no"
                                  checked={affectsCommercializationExterior === false}
                                  onChange={() => handleAffectsCommercializationChange("affects_commercialization_exterior", false)}
                                  className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                  required
                                />
                                <span className="text-sm">No</span>
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="comment-exterior" className="text-sm font-medium">
                              Comentario
                            </Label>
                            <Textarea
                              id="comment-exterior"
                              placeholder="Describe el problema o el estado de los exteriores..."
                              value={commentExterior}
                              onChange={(e) => handleCommentChange("comment_exterior", e.target.value)}
                              rows={3}
                            />
                          </div>
                        </>
                      )}
                      <PhotoUploadSection
                        title=""
                        fieldName="photos_exterior"
                        photos={photosExterior}
                        setPhotos={setPhotosExterior}
                      />
                    </>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Garaje - Condicional */}
          {supabaseProperty?.garage && 
           supabaseProperty.garage.toLowerCase() !== "no tiene" && 
           supabaseProperty.garage.trim() !== "" && (
            <AccordionItem value="garage" className="border rounded-lg overflow-hidden">
              <Card>
                <CardHeader className="pb-3 p-6">
                  <AccordionTrigger className="hover:no-underline py-0 items-center">
                    <CardTitle className="text-base font-semibold flex-1 text-left">Garaje</CardTitle>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent>
                  <CardContent className="pt-0 space-y-4">
                    <StatusSelector
                      variant="final-check"
                      value={statusGarage}
                      onChange={(value) => handleStatusChange("check_garage", value as "good" | "incident")}
                    />
                    {shouldShowPhotos(statusGarage) && (
                      <>
                        {shouldShowComment(statusGarage) && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                ¿Afecta la comercialización? <span className="text-red-500">*</span>
                              </Label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="affects-commercialization-garage"
                                    value="yes"
                                    checked={affectsCommercializationGarage === true}
                                    onChange={() => handleAffectsCommercializationChange("affects_commercialization_garage", true)}
                                    className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                    required
                                  />
                                  <span className="text-sm">Sí</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="affects-commercialization-garage"
                                    value="no"
                                    checked={affectsCommercializationGarage === false}
                                    onChange={() => handleAffectsCommercializationChange("affects_commercialization_garage", false)}
                                    className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                    required
                                  />
                                  <span className="text-sm">No</span>
                                </label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="comment-garage" className="text-sm font-medium">
                                Comentario
                              </Label>
                              <Textarea
                                id="comment-garage"
                                placeholder="Describe el problema o el estado del garaje..."
                                value={commentGarage}
                                onChange={(e) => handleCommentChange("comment_garage", e.target.value)}
                                rows={3}
                              />
                            </div>
                          </>
                        )}
                        <PhotoUploadSection
                          title=""
                          fieldName="photos_garage"
                          photos={photosGarage}
                          setPhotos={setPhotosGarage}
                        />
                      </>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}

          {/* Trastero - Condicional (asumimos que si no hay campo específico, no se muestra) */}
          {/* Nota: Si en el futuro se añade un campo has_storage o storage, usar ese campo aquí */}

          {/* Terraza - Condicional */}
          {supabaseProperty?.has_terrace === true && (
            <AccordionItem value="terrace" className="border rounded-lg overflow-hidden">
              <Card>
                <CardHeader className="pb-3 p-6">
                  <AccordionTrigger className="hover:no-underline py-0 items-center">
                    <CardTitle className="text-base font-semibold flex-1 text-left">Terraza</CardTitle>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent>
                  <CardContent className="pt-0 space-y-4">
                    <StatusSelector
                      variant="final-check"
                      value={statusTerrace}
                      onChange={(value) => handleStatusChange("check_terrace", value as "good" | "incident")}
                    />
                    {shouldShowPhotos(statusTerrace) && (
                      <>
                        {shouldShowComment(statusTerrace) && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                ¿Afecta la comercialización? <span className="text-red-500">*</span>
                              </Label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="affects-commercialization-terrace"
                                    value="yes"
                                    checked={affectsCommercializationTerrace === true}
                                    onChange={() => handleAffectsCommercializationChange("affects_commercialization_terrace", true)}
                                    className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                    required
                                  />
                                  <span className="text-sm">Sí</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="affects-commercialization-terrace"
                                    value="no"
                                    checked={affectsCommercializationTerrace === false}
                                    onChange={() => handleAffectsCommercializationChange("affects_commercialization_terrace", false)}
                                    className="w-4 h-4 text-[var(--vistral-blue-500)] focus:ring-[var(--vistral-blue-500)]"
                                    required
                                  />
                                  <span className="text-sm">No</span>
                                </label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="comment-terrace" className="text-sm font-medium">
                                Comentario
                              </Label>
                              <Textarea
                                id="comment-terrace"
                                placeholder="Describe el problema o el estado de la terraza..."
                                value={commentTerrace}
                                onChange={(e) => handleCommentChange("comment_terrace", e.target.value)}
                                rows={3}
                              />
                            </div>
                          </>
                        )}
                        <PhotoUploadSection
                          title=""
                          fieldName="photos_terrace"
                          photos={photosTerrace}
                          setPhotos={setPhotosTerrace}
                        />
                      </>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      {/* Precio */}
      <Card id="section-pricing">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Precio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyRent" className="text-sm font-medium">
              Renta mensual prevista
            </Label>
            <Input
              id="monthlyRent"
              type="number"
              placeholder="Ej: 1200"
              value={monthlyRent}
              onChange={(e) => handleMonthlyRentChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="announcementPrice" className="text-sm font-medium">
              Precio de anuncio
            </Label>
            <Input
              id="announcementPrice"
              type="number"
              placeholder="Ej: 1250"
              value={announcementPrice}
              onChange={(e) => handleAnnouncementPriceChange(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ownerNotified"
              checked={ownerNotified}
              onCheckedChange={(checked) => handleOwnerNotifiedChange(checked === true)}
            />
            <Label
              htmlFor="ownerNotified"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Se ha comunicado el precio al propietario
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Publicación */}
      <Card id="section-publication">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Publicación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="publishOnline" className="text-sm font-medium">
              ¿Se publicará la propiedad en Internet?
            </Label>
            <Select value={publishOnline} onValueChange={handlePublishOnlineChange}>
              <SelectTrigger id="publishOnline" className="w-full">
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Sí</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subir Anuncio a Idealista - Solo si publishOnline === "yes" */}
      {publishOnline === "yes" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Subir Anuncio a Idealista</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="idealistaPrice" className="text-sm font-medium">
                Precio anuncio
              </Label>
              <Input
                id="idealistaPrice"
                type="number"
                placeholder="Ej: 1250"
                value={idealistaPrice}
                onChange={(e) => handleIdealistaFieldChange("idealistaPrice", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idealistaDescription" className="text-sm font-medium">
                Descripción
              </Label>
              <Textarea
                id="idealistaDescription"
                placeholder="Descripción del inmueble..."
                value={idealistaDescription}
                onChange={(e) =>
                  handleIdealistaFieldChange("idealistaDescription", e.target.value)
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idealistaAddress" className="text-sm font-medium">
                Dirección
              </Label>
              <Input
                id="idealistaAddress"
                type="text"
                placeholder="Dirección completa"
                value={idealistaAddress}
                onChange={(e) => handleIdealistaFieldChange("idealistaAddress", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idealistaCity" className="text-sm font-medium">
                Localidad
              </Label>
              <Input
                id="idealistaCity"
                type="text"
                placeholder="Localidad"
                value={idealistaCity}
                onChange={(e) => handleIdealistaFieldChange("idealistaCity", e.target.value)}
              />
            </div>

            {/* Zona de subida de fotos */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fotos</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <input
                    type="file"
                    id="imageUpload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="flex flex-col items-center justify-center w-full cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      Haz clic para subir fotos o arrastra y suelta
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF hasta 10MB
                    </span>
                  </label>
                </div>

                {/* Preview de imágenes subidas */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
