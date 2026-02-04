"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { usePropertyForm } from "./property-form-context";
import { useProperty } from "@/hooks/use-property";
import { Upload, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Phase2SectionWidget } from "./phase2-section-widget";
import { FinancialPerformanceWidget } from "@/components/property/FinancialPerformanceWidget";
import { StatusSelector } from "./status-selector";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadDocument } from "@/lib/document-upload";
import { deleteDocument } from "@/lib/document-upload";
import { usePhaseSections } from "@/hooks/use-phase-sections";

interface ReadyToRentTasksProps {
  property: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
}

// Tipo para estancias de la propiedad
type RoomType = 
  | "common_areas" 
  | "entry_hallways" 
  | "living_room" 
  | "kitchen" 
  | "exterior" 
  | "bedrooms" 
  | "bathrooms" 
  | "garage" 
  | "terrace" 
  | "storage";

export function ReadyToRentTasks({ property }: ReadyToRentTasksProps) {
  const { formData, updateField, initializeFormData } = usePropertyForm();
  const { property: supabaseProperty, loading } = useProperty(property.property_unique_id);
  const { sections: phaseSections } = usePhaseSections("Listo para Alquilar");
  const sectionId = "readyToRent";
  const hasInitializedRef = useRef(false);
  const lastPropertyIdRef = useRef<string | null>(null);
  
  // Helper para obtener las instrucciones de una sección
  const getSectionInstructions = (sectionId: string): string | undefined => {
    const section = phaseSections.find(s => s.id === sectionId);
    return section?.instructions;
  };

  // Estados Sección 1: Presentación al Cliente
  const [clientPresentationDone, setClientPresentationDone] = useState<boolean | null>(null);
  const [clientPresentationDate, setClientPresentationDate] = useState<string>("");
  const [clientPresentationChannel, setClientPresentationChannel] = useState<string>("");

  // Estados Sección 2: Estrategia de Precio
  const [announcementPrice, setAnnouncementPrice] = useState<string>("");
  const [priceApproval, setPriceApproval] = useState<boolean | null>(null);

  // Estados Sección 3: Inspección Técnica (por estancia)
  // Fijas
  const [statusCommonAreas, setStatusCommonAreas] = useState<"good" | "incident" | null>(null);
  const [statusEntryHallways, setStatusEntryHallways] = useState<"good" | "incident" | null>(null);
  const [statusLivingRoom, setStatusLivingRoom] = useState<"good" | "incident" | null>(null);
  const [statusKitchen, setStatusKitchen] = useState<"good" | "incident" | null>(null);
  const [statusExterior, setStatusExterior] = useState<"good" | "incident" | null>(null);
  const [statusGarage, setStatusGarage] = useState<"good" | "incident" | null>(null);
  const [statusTerrace, setStatusTerrace] = useState<"good" | "incident" | null>(null);
  const [statusStorage, setStatusStorage] = useState<"good" | "incident" | null>(null);
  // Dinámicas
  const [statusBedrooms, setStatusBedrooms] = useState<Record<number, "good" | "incident" | null>>({});
  const [statusBathrooms, setStatusBathrooms] = useState<Record<number, "good" | "incident" | null>>({});
  
  // Comentarios
  const [commentCommonAreas, setCommentCommonAreas] = useState<string>("");
  const [commentEntryHallways, setCommentEntryHallways] = useState<string>("");
  const [commentLivingRoom, setCommentLivingRoom] = useState<string>("");
  const [commentKitchen, setCommentKitchen] = useState<string>("");
  const [commentExterior, setCommentExterior] = useState<string>("");
  const [commentGarage, setCommentGarage] = useState<string>("");
  const [commentTerrace, setCommentTerrace] = useState<string>("");
  const [commentStorage, setCommentStorage] = useState<string>("");
  const [commentBedrooms, setCommentBedrooms] = useState<Record<number, string>>({});
  const [commentBathrooms, setCommentBathrooms] = useState<Record<number, string>>({});
  
  // Afecta comercialización
  const [affectsCommercializationCommonAreas, setAffectsCommercializationCommonAreas] = useState<boolean | null>(null);
  const [affectsCommercializationEntryHallways, setAffectsCommercializationEntryHallways] = useState<boolean | null>(null);
  const [affectsCommercializationLivingRoom, setAffectsCommercializationLivingRoom] = useState<boolean | null>(null);
  const [affectsCommercializationKitchen, setAffectsCommercializationKitchen] = useState<boolean | null>(null);
  const [affectsCommercializationExterior, setAffectsCommercializationExterior] = useState<boolean | null>(null);
  const [affectsCommercializationGarage, setAffectsCommercializationGarage] = useState<boolean | null>(null);
  const [affectsCommercializationTerrace, setAffectsCommercializationTerrace] = useState<boolean | null>(null);
  const [affectsCommercializationStorage, setAffectsCommercializationStorage] = useState<boolean | null>(null);
  const [affectsCommercializationBedrooms, setAffectsCommercializationBedrooms] = useState<Record<number, boolean | null>>({});
  const [affectsCommercializationBathrooms, setAffectsCommercializationBathrooms] = useState<Record<number, boolean | null>>({});
  
  // Fotos comerciales
  const [photosCommonAreas, setPhotosCommonAreas] = useState<string[]>([]);
  const [photosEntryHallways, setPhotosEntryHallways] = useState<string[]>([]);
  const [photosLivingRoom, setPhotosLivingRoom] = useState<string[]>([]);
  const [photosKitchen, setPhotosKitchen] = useState<string[]>([]);
  const [photosExterior, setPhotosExterior] = useState<string[]>([]);
  const [photosGarage, setPhotosGarage] = useState<string[]>([]);
  const [photosTerrace, setPhotosTerrace] = useState<string[]>([]);
  const [photosStorage, setPhotosStorage] = useState<string[]>([]);
  const [photosBedrooms, setPhotosBedrooms] = useState<Record<number, string[]>>({});
  const [photosBathrooms, setPhotosBathrooms] = useState<Record<number, string[]>>({});
  
  // Fotos incidencias
  const [incidentPhotosCommonAreas, setIncidentPhotosCommonAreas] = useState<string[]>([]);
  const [incidentPhotosEntryHallways, setIncidentPhotosEntryHallways] = useState<string[]>([]);
  const [incidentPhotosLivingRoom, setIncidentPhotosLivingRoom] = useState<string[]>([]);
  const [incidentPhotosKitchen, setIncidentPhotosKitchen] = useState<string[]>([]);
  const [incidentPhotosExterior, setIncidentPhotosExterior] = useState<string[]>([]);
  const [incidentPhotosGarage, setIncidentPhotosGarage] = useState<string[]>([]);
  const [incidentPhotosTerrace, setIncidentPhotosTerrace] = useState<string[]>([]);
  const [incidentPhotosStorage, setIncidentPhotosStorage] = useState<string[]>([]);
  const [incidentPhotosBedrooms, setIncidentPhotosBedrooms] = useState<Record<number, string[]>>({});
  const [incidentPhotosBathrooms, setIncidentPhotosBathrooms] = useState<Record<number, string[]>>({});

  // Estados Sección 4: Lanzamiento Comercial
  const [publishOnline, setPublishOnline] = useState<boolean | null>(null);
  const [idealistaDescription, setIdealistaDescription] = useState<string>("");

  // Resetear ref cuando cambia la propiedad
  useEffect(() => {
    if (property.property_unique_id !== lastPropertyIdRef.current) {
      hasInitializedRef.current = false;
      lastPropertyIdRef.current = property.property_unique_id;
    }
  }, [property.property_unique_id]);

  // Inicializar datos desde Supabase
  useEffect(() => {
    if (supabaseProperty && !loading && !hasInitializedRef.current) {
      const initialData: Record<string, any> = {};

      // Sección 1: Presentación al Cliente
      // Cargar siempre, incluso si es null, para mantener sincronización
      const clientPresentationDoneValue = supabaseProperty.client_presentation_done ?? null;
      setClientPresentationDone(clientPresentationDoneValue);
      initialData[`${sectionId}.clientPresentationDone`] = clientPresentationDoneValue;
      
      // Cargar fecha - usar null si no existe, no cadena vacía
      const clientPresentationDateValue = supabaseProperty.client_presentation_date || "";
      setClientPresentationDate(clientPresentationDateValue);
      initialData[`${sectionId}.clientPresentationDate`] = clientPresentationDateValue || null;
      
      // Cargar canal - usar cadena vacía para el estado local si es null/undefined
      // pero guardar null en formData para que se guarde correctamente en Supabase
      const clientPresentationChannelValue = supabaseProperty.client_presentation_channel;
      // Para el estado local del componente, usar cadena vacía si es null/undefined
      setClientPresentationChannel(clientPresentationChannelValue || "");
      // Para formData, usar null si no hay valor (para que se guarde como null en DB)
      initialData[`${sectionId}.clientPresentationChannel`] = clientPresentationChannelValue || null;

      // Sección 2: Estrategia de Precio
      if (supabaseProperty.announcement_price !== null && supabaseProperty.announcement_price !== undefined) {
        setAnnouncementPrice(String(supabaseProperty.announcement_price));
        initialData[`${sectionId}.announcementPrice`] = String(supabaseProperty.announcement_price);
      } else {
        setAnnouncementPrice("");
        initialData[`${sectionId}.announcementPrice`] = "";
      }
      
      // Cargar siempre, incluso si es null, para mantener sincronización
      setPriceApproval(supabaseProperty.price_approval ?? null);
      initialData[`${sectionId}.priceApproval`] = supabaseProperty.price_approval ?? null;

      // Sección 3 - Cargar estados, comentarios, fotos comerciales e incidencias
      // Cargar fotos comerciales
      if (supabaseProperty.marketing_photos_common_areas && Array.isArray(supabaseProperty.marketing_photos_common_areas)) {
        setPhotosCommonAreas(supabaseProperty.marketing_photos_common_areas.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.marketing_photos_entry_hallways && Array.isArray(supabaseProperty.marketing_photos_entry_hallways)) {
        setPhotosEntryHallways(supabaseProperty.marketing_photos_entry_hallways.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.marketing_photos_living_room && Array.isArray(supabaseProperty.marketing_photos_living_room)) {
        setPhotosLivingRoom(supabaseProperty.marketing_photos_living_room.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.marketing_photos_kitchen && Array.isArray(supabaseProperty.marketing_photos_kitchen)) {
        setPhotosKitchen(supabaseProperty.marketing_photos_kitchen.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.marketing_photos_exterior && Array.isArray(supabaseProperty.marketing_photos_exterior)) {
        setPhotosExterior(supabaseProperty.marketing_photos_exterior.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.marketing_photos_garage && Array.isArray(supabaseProperty.marketing_photos_garage)) {
        setPhotosGarage(supabaseProperty.marketing_photos_garage.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.marketing_photos_terrace && Array.isArray(supabaseProperty.marketing_photos_terrace)) {
        setPhotosTerrace(supabaseProperty.marketing_photos_terrace.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.marketing_photos_storage && Array.isArray(supabaseProperty.marketing_photos_storage)) {
        setPhotosStorage(supabaseProperty.marketing_photos_storage.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.marketing_photos_bedrooms && Array.isArray(supabaseProperty.marketing_photos_bedrooms)) {
        const bedroomsPhotos: Record<number, string[]> = {};
        supabaseProperty.marketing_photos_bedrooms.forEach((roomPhotos, index) => {
          if (Array.isArray(roomPhotos)) {
            bedroomsPhotos[index] = roomPhotos.filter((url): url is string => typeof url === "string");
          }
        });
        setPhotosBedrooms(bedroomsPhotos);
      }
      if (supabaseProperty.marketing_photos_bathrooms && Array.isArray(supabaseProperty.marketing_photos_bathrooms)) {
        const bathroomsPhotos: Record<number, string[]> = {};
        supabaseProperty.marketing_photos_bathrooms.forEach((bathPhotos, index) => {
          if (Array.isArray(bathPhotos)) {
            bathroomsPhotos[index] = bathPhotos.filter((url): url is string => typeof url === "string");
          }
        });
        setPhotosBathrooms(bathroomsPhotos);
      }
      
      // Cargar fotos de incidencias
      if (supabaseProperty.incident_photos_common_areas && Array.isArray(supabaseProperty.incident_photos_common_areas)) {
        setIncidentPhotosCommonAreas(supabaseProperty.incident_photos_common_areas.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.incident_photos_entry_hallways && Array.isArray(supabaseProperty.incident_photos_entry_hallways)) {
        setIncidentPhotosEntryHallways(supabaseProperty.incident_photos_entry_hallways.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.incident_photos_living_room && Array.isArray(supabaseProperty.incident_photos_living_room)) {
        setIncidentPhotosLivingRoom(supabaseProperty.incident_photos_living_room.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.incident_photos_kitchen && Array.isArray(supabaseProperty.incident_photos_kitchen)) {
        setIncidentPhotosKitchen(supabaseProperty.incident_photos_kitchen.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.incident_photos_exterior && Array.isArray(supabaseProperty.incident_photos_exterior)) {
        setIncidentPhotosExterior(supabaseProperty.incident_photos_exterior.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.incident_photos_garage && Array.isArray(supabaseProperty.incident_photos_garage)) {
        setIncidentPhotosGarage(supabaseProperty.incident_photos_garage.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.incident_photos_terrace && Array.isArray(supabaseProperty.incident_photos_terrace)) {
        setIncidentPhotosTerrace(supabaseProperty.incident_photos_terrace.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.incident_photos_storage && Array.isArray(supabaseProperty.incident_photos_storage)) {
        setIncidentPhotosStorage(supabaseProperty.incident_photos_storage.filter((url): url is string => typeof url === "string"));
      }
      if (supabaseProperty.incident_photos_bedrooms && Array.isArray(supabaseProperty.incident_photos_bedrooms)) {
        const bedroomsIncidentPhotos: Record<number, string[]> = {};
        supabaseProperty.incident_photos_bedrooms.forEach((roomPhotos, index) => {
          if (Array.isArray(roomPhotos)) {
            bedroomsIncidentPhotos[index] = roomPhotos.filter((url): url is string => typeof url === "string");
          }
        });
        setIncidentPhotosBedrooms(bedroomsIncidentPhotos);
      }
      if (supabaseProperty.incident_photos_bathrooms && Array.isArray(supabaseProperty.incident_photos_bathrooms)) {
        const bathroomsIncidentPhotos: Record<number, string[]> = {};
        supabaseProperty.incident_photos_bathrooms.forEach((bathPhotos, index) => {
          if (Array.isArray(bathPhotos)) {
            bathroomsIncidentPhotos[index] = bathPhotos.filter((url): url is string => typeof url === "string");
          }
        });
        setIncidentPhotosBathrooms(bathroomsIncidentPhotos);
      }
      
      // Cargar estados
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
      if (supabaseProperty.check_bedrooms && Array.isArray(supabaseProperty.check_bedrooms)) {
        const bedroomsStatus: Record<number, "good" | "incident" | null> = {};
        supabaseProperty.check_bedrooms.forEach((status, index) => {
          if (typeof status === "string") {
            const normalized = normalizeStatus(status);
            if (normalized) bedroomsStatus[index] = normalized;
          }
        });
        setStatusBedrooms(bedroomsStatus);
      }
      if (supabaseProperty.check_bathrooms && Array.isArray(supabaseProperty.check_bathrooms)) {
        const bathroomsStatus: Record<number, "good" | "incident" | null> = {};
        supabaseProperty.check_bathrooms.forEach((status, index) => {
          if (typeof status === "string") {
            const normalized = normalizeStatus(status);
            if (normalized) bathroomsStatus[index] = normalized;
          }
        });
        setStatusBathrooms(bathroomsStatus);
      }
      
      // Cargar comentarios
      if (supabaseProperty.comment_common_areas) setCommentCommonAreas(supabaseProperty.comment_common_areas);
      if (supabaseProperty.comment_entry_hallways) setCommentEntryHallways(supabaseProperty.comment_entry_hallways);
      if (supabaseProperty.comment_living_room) setCommentLivingRoom(supabaseProperty.comment_living_room);
      if (supabaseProperty.comment_kitchen) setCommentKitchen(supabaseProperty.comment_kitchen);
      if (supabaseProperty.comment_exterior) setCommentExterior(supabaseProperty.comment_exterior);
      if (supabaseProperty.comment_garage) setCommentGarage(supabaseProperty.comment_garage);
      if (supabaseProperty.comment_terrace) setCommentTerrace(supabaseProperty.comment_terrace);
      if (supabaseProperty.comment_bedrooms && Array.isArray(supabaseProperty.comment_bedrooms)) {
        const bedroomsComments: Record<number, string> = {};
        supabaseProperty.comment_bedrooms.forEach((comment, index) => {
          if (typeof comment === "string") bedroomsComments[index] = comment;
        });
        setCommentBedrooms(bedroomsComments);
      }
      if (supabaseProperty.comment_bathrooms && Array.isArray(supabaseProperty.comment_bathrooms)) {
        const bathroomsComments: Record<number, string> = {};
        supabaseProperty.comment_bathrooms.forEach((comment, index) => {
          if (typeof comment === "string") bathroomsComments[index] = comment;
        });
        setCommentBathrooms(bathroomsComments);
      }
      
      // Cargar afecta comercialización
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
      if (supabaseProperty.affects_commercialization_bedrooms && Array.isArray(supabaseProperty.affects_commercialization_bedrooms)) {
        const bedroomsAffects: Record<number, boolean | null> = {};
        supabaseProperty.affects_commercialization_bedrooms.forEach((affects, index) => {
          if (typeof affects === "boolean") bedroomsAffects[index] = affects;
        });
        setAffectsCommercializationBedrooms(bedroomsAffects);
      }
      if (supabaseProperty.affects_commercialization_bathrooms && Array.isArray(supabaseProperty.affects_commercialization_bathrooms)) {
        const bathroomsAffects: Record<number, boolean | null> = {};
        supabaseProperty.affects_commercialization_bathrooms.forEach((affects, index) => {
          if (typeof affects === "boolean") bathroomsAffects[index] = affects;
        });
        setAffectsCommercializationBathrooms(bathroomsAffects);
      }

      // Sección 4
      if (supabaseProperty.publish_online !== null && supabaseProperty.publish_online !== undefined) {
        setPublishOnline(supabaseProperty.publish_online);
        initialData[`${sectionId}.publishOnline`] = supabaseProperty.publish_online;
      }
      if (supabaseProperty.idealista_description) {
        setIdealistaDescription(supabaseProperty.idealista_description);
        initialData[`${sectionId}.idealistaDescription`] = supabaseProperty.idealista_description;
      }

      // Inicializar formData - siempre sincronizar con Supabase
      initializeFormData(initialData);
      hasInitializedRef.current = true;
    }
  }, [supabaseProperty, loading, initializeFormData, sectionId]);

  // Validación de completitud
  const isSection1Complete = () => {
    return clientPresentationDone === true && 
           clientPresentationDate !== "" && 
           clientPresentationChannel !== "";
  };

  const isSection2Complete = () => {
    return announcementPrice !== "" && 
           parseFloat(announcementPrice) > 0 && 
           priceApproval === true;
  };

  const isSection3Complete = () => {
    // Obtener todas las estancias que deben estar completas
    const allRooms = getAllRooms();
    
    return allRooms.every(room => {
      const status = getRoomStatus(room);
      if (!status) return false;
      
      if (status === "good") {
        // Buen Estado: debe tener fotos comerciales
        return getRoomCommercialPhotos(room).length > 0;
      } else if (status === "incident") {
        // Con Incidencias: debe tener descripción, fotos incidencias, y afecta comercialización
        const comment = getRoomComment(room);
        const incidentPhotos = getRoomIncidentPhotos(room);
        const affects = getRoomAffectsCommercialization(room);
        
        if (!comment || incidentPhotos.length === 0 || affects === null) return false;
        
        // Si afecta comercialización (BLOQUEANTE): la sección NO está completa
        if (affects === true) return false;
        
        // Si no afecta (NO BLOQUEANTE): debe tener fotos comerciales también
        return getRoomCommercialPhotos(room).length > 0;
      }
      
      return false;
    });
  };
  
  // Helper para obtener todas las estancias
  const getAllRooms = (): Array<{ type: string; index?: number; label: string }> => {
    const rooms: Array<{ type: string; index?: number; label: string }> = [
      { type: "common_areas", label: "Entorno y zonas comunes" },
      { type: "entry_hallways", label: "Entrada y pasillos" },
      { type: "living_room", label: "Salón" },
      { type: "kitchen", label: "Cocina" },
      { type: "exterior", label: "Exteriores" },
    ];
    
    // Habitaciones dinámicas
    const bedrooms = supabaseProperty?.bedrooms || 0;
    for (let i = 0; i < bedrooms; i++) {
      rooms.push({ type: "bedrooms", index: i, label: `Habitación ${i + 1}` });
    }
    
    // Baños dinámicos
    const bathrooms = supabaseProperty?.bathrooms || 0;
    for (let i = 0; i < bathrooms; i++) {
      rooms.push({ type: "bathrooms", index: i, label: `Baño ${i + 1}` });
    }
    
    // Condicionales
    if (supabaseProperty?.garage && supabaseProperty.garage !== "No tiene") {
      rooms.push({ type: "garage", label: "Garaje" });
    }
    if (supabaseProperty?.has_terrace) {
      rooms.push({ type: "terrace", label: "Terraza" });
    }
    // Storage - asumimos que existe si hay trastero (puedes ajustar la condición)
    // rooms.push({ type: "storage", label: "Trastero" });
    
    return rooms;
  };
  
  // Helper para determinar el estado de una instancia
  const getRoomState = (room: { type: string; index?: number }): "incomplete" | "good" | "blocking" | "non-blocking" => {
    const status = getRoomStatus(room);
    if (!status) return "incomplete";

    // Estado 1: Buen Estado
    // check_* = 'good' y marketing_photos_* tiene fotos comerciales
    if (status === "good") {
      const commercialPhotos = getRoomCommercialPhotos(room);
      return commercialPhotos.length > 0 ? "good" : "incomplete";
    }

    // Estado 2 y 3: Con Incidencias
    if (status === "incident") {
      const comment = getRoomComment(room);
      const incidentPhotos = getRoomIncidentPhotos(room);
      const affects = getRoomAffectsCommercialization(room);

      // Si no tiene los datos mínimos, está incompleto
      if (!comment.trim() || incidentPhotos.length === 0 || affects === null) {
        return "incomplete";
      }

      // Estado 2: Con Incidencias Bloqueantes
      // affects_commercialization_* = true
      if (affects === true) {
        return "blocking";
      }

      // Estado 3: Con Incidencias No Bloqueantes
      // affects_commercialization_* = false y marketing_photos_* tiene fotos comerciales
      const commercialPhotos = getRoomCommercialPhotos(room);
      return commercialPhotos.length > 0 ? "non-blocking" : "incomplete";
    }

    return "incomplete";
  };

  // Helpers para obtener estado/comentarios/fotos por estancia
  const getRoomStatus = (room: { type: string; index?: number }): "good" | "incident" | null => {
    if (room.type === "bedrooms" && room.index !== undefined) {
      return statusBedrooms[room.index] || null;
    }
    if (room.type === "bathrooms" && room.index !== undefined) {
      return statusBathrooms[room.index] || null;
    }
    const statusMap: Record<string, "good" | "incident" | null> = {
      common_areas: statusCommonAreas,
      entry_hallways: statusEntryHallways,
      living_room: statusLivingRoom,
      kitchen: statusKitchen,
      exterior: statusExterior,
      garage: statusGarage,
      terrace: statusTerrace,
      storage: statusStorage,
    };
    return statusMap[room.type] || null;
  };
  
  const getRoomComment = (room: { type: string; index?: number }): string => {
    if (room.type === "bedrooms" && room.index !== undefined) {
      return commentBedrooms[room.index] || "";
    }
    if (room.type === "bathrooms" && room.index !== undefined) {
      return commentBathrooms[room.index] || "";
    }
    const commentMap: Record<string, string> = {
      common_areas: commentCommonAreas,
      entry_hallways: commentEntryHallways,
      living_room: commentLivingRoom,
      kitchen: commentKitchen,
      exterior: commentExterior,
      garage: commentGarage,
      terrace: commentTerrace,
      storage: commentStorage,
    };
    return commentMap[room.type] || "";
  };
  
  const getRoomAffectsCommercialization = (room: { type: string; index?: number }): boolean | null => {
    if (room.type === "bedrooms" && room.index !== undefined) {
      return affectsCommercializationBedrooms[room.index] ?? null;
    }
    if (room.type === "bathrooms" && room.index !== undefined) {
      return affectsCommercializationBathrooms[room.index] ?? null;
    }
    const affectsMap: Record<string, boolean | null> = {
      common_areas: affectsCommercializationCommonAreas,
      entry_hallways: affectsCommercializationEntryHallways,
      living_room: affectsCommercializationLivingRoom,
      kitchen: affectsCommercializationKitchen,
      exterior: affectsCommercializationExterior,
      garage: affectsCommercializationGarage,
      terrace: affectsCommercializationTerrace,
      storage: affectsCommercializationStorage,
    };
    return affectsMap[room.type] ?? null;
  };
  
  const getRoomCommercialPhotos = (room: { type: string; index?: number }): string[] => {
    if (room.type === "bedrooms" && room.index !== undefined) {
      return photosBedrooms[room.index] || [];
    }
    if (room.type === "bathrooms" && room.index !== undefined) {
      return photosBathrooms[room.index] || [];
    }
    const photosMap: Record<string, string[]> = {
      common_areas: photosCommonAreas,
      entry_hallways: photosEntryHallways,
      living_room: photosLivingRoom,
      kitchen: photosKitchen,
      exterior: photosExterior,
      garage: photosGarage,
      terrace: photosTerrace,
      storage: photosStorage,
    };
    return photosMap[room.type] || [];
  };
  
  const getRoomIncidentPhotos = (room: { type: string; index?: number }): string[] => {
    if (room.type === "bedrooms" && room.index !== undefined) {
      return incidentPhotosBedrooms[room.index] || [];
    }
    if (room.type === "bathrooms" && room.index !== undefined) {
      return incidentPhotosBathrooms[room.index] || [];
    }
    const photosMap: Record<string, string[]> = {
      common_areas: incidentPhotosCommonAreas,
      entry_hallways: incidentPhotosEntryHallways,
      living_room: incidentPhotosLivingRoom,
      kitchen: incidentPhotosKitchen,
      exterior: incidentPhotosExterior,
      garage: incidentPhotosGarage,
      terrace: incidentPhotosTerrace,
      storage: incidentPhotosStorage,
    };
    return photosMap[room.type] || [];
  };

  const isSection4Complete = () => {
    return publishOnline === false || 
           (publishOnline === true && idealistaDescription.trim() !== "");
  };

  // Handlers Sección 1
  const handlePresentationDoneChange = (value: string) => {
    if (value === "") {
      setClientPresentationDone(null);
      updateField(sectionId, "clientPresentationDone", null);
      return;
    }
    const isDone = value === "yes";
    setClientPresentationDone(isDone);
    updateField(sectionId, "clientPresentationDone", isDone);
    
    if (isDone && !clientPresentationDate) {
      // Autocompletar con fecha de hoy
      const today = new Date().toISOString().split('T')[0];
      setClientPresentationDate(today);
      updateField(sectionId, "clientPresentationDate", today);
    }
  };

  const handleClearPresentationDone = () => {
    setClientPresentationDone(null);
    updateField(sectionId, "clientPresentationDone", null);
  };

  const handlePresentationDateChange = (value: string) => {
    setClientPresentationDate(value);
    updateField(sectionId, "clientPresentationDate", value);
  };

  const handlePresentationChannelChange = (value: string) => {
    if (value === "") {
      setClientPresentationChannel("");
      updateField(sectionId, "clientPresentationChannel", null);
      return;
    }
    setClientPresentationChannel(value);
    updateField(sectionId, "clientPresentationChannel", value);
  };

  const handleClearPresentationChannel = () => {
    setClientPresentationChannel("");
    updateField(sectionId, "clientPresentationChannel", null);
  };

  // Handlers Sección 2
  const handleAnnouncementPriceChange = (value: string) => {
    setAnnouncementPrice(value);
    updateField(sectionId, "announcementPrice", value);
  };

  const handlePriceApprovalChange = (value: string) => {
    if (value === "") {
      setPriceApproval(null);
      updateField(sectionId, "priceApproval", null);
      return;
    }
    const approved = value === "yes";
    setPriceApproval(approved);
    updateField(sectionId, "priceApproval", approved);
  };

  const handleClearPriceApproval = () => {
    setPriceApproval(null);
    updateField(sectionId, "priceApproval", null);
  };

  // Handlers Sección 4
  const handlePublishOnlineChange = (value: string) => {
    const boolValue = value === "yes" ? true : value === "no" ? false : null;
    setPublishOnline(boolValue);
    updateField(sectionId, "publishOnline", boolValue);
  };

  const handleIdealistaDescriptionChange = (value: string) => {
    setIdealistaDescription(value);
    updateField(sectionId, "idealistaDescription", value);
  };

  // Handlers Sección 3: Estados
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
      const supabase = createClient();

      if ((fieldName === "check_bedrooms" || fieldName === "check_bathrooms") && roomIndex !== undefined) {
        const { data: currentProperty } = await supabase
          .from("properties")
          .select(fieldName)
          .eq("property_unique_id", supabaseProperty.property_unique_id)
          .single();

        const currentArray = (Array.isArray(currentProperty?.[fieldName])
          ? currentProperty[fieldName]
          : []) as string[];

        while (currentArray.length <= roomIndex) {
          currentArray.push("good");
        }

        currentArray[roomIndex] = status;

        await supabase
          .from("properties")
          .update({ [fieldName]: currentArray })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        if (fieldName === "check_bedrooms") {
          setStatusBedrooms((prev) => ({ ...prev, [roomIndex]: status }));
        } else {
          setStatusBathrooms((prev) => ({ ...prev, [roomIndex]: status }));
        }
      } else {
        await supabase
          .from("properties")
          .update({ [fieldName]: status })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        switch (fieldName) {
          case "check_common_areas": setStatusCommonAreas(status); break;
          case "check_entry_hallways": setStatusEntryHallways(status); break;
          case "check_living_room": setStatusLivingRoom(status); break;
          case "check_kitchen": setStatusKitchen(status); break;
          case "check_exterior": setStatusExterior(status); break;
          case "check_garage": setStatusGarage(status); break;
          case "check_terrace": setStatusTerrace(status); break;
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(`Error al actualizar el estado: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Handlers Sección 3: Comentarios
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
      const supabase = createClient();

      if ((fieldName === "comment_bedrooms" || fieldName === "comment_bathrooms") && roomIndex !== undefined) {
        const { data: currentProperty } = await supabase
          .from("properties")
          .select(fieldName)
          .eq("property_unique_id", supabaseProperty.property_unique_id)
          .single();

        const currentArray = (Array.isArray(currentProperty?.[fieldName])
          ? currentProperty[fieldName]
          : []) as string[];

        while (currentArray.length <= roomIndex) {
          currentArray.push("");
        }

        currentArray[roomIndex] = comment;

        await supabase
          .from("properties")
          .update({ [fieldName]: currentArray })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        if (fieldName === "comment_bedrooms") {
          setCommentBedrooms((prev) => ({ ...prev, [roomIndex]: comment }));
        } else {
          setCommentBathrooms((prev) => ({ ...prev, [roomIndex]: comment }));
        }
      } else {
        await supabase
          .from("properties")
          .update({ [fieldName]: comment || null })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        switch (fieldName) {
          case "comment_common_areas": setCommentCommonAreas(comment); break;
          case "comment_entry_hallways": setCommentEntryHallways(comment); break;
          case "comment_living_room": setCommentLivingRoom(comment); break;
          case "comment_kitchen": setCommentKitchen(comment); break;
          case "comment_exterior": setCommentExterior(comment); break;
          case "comment_garage": setCommentGarage(comment); break;
          case "comment_terrace": setCommentTerrace(comment); break;
        }
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error(`Error al guardar el comentario: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Handlers Sección 3: Afecta comercialización
  const handleAffectsCommercializationChange = async (
    fieldName: string,
    affects: boolean | null,
    roomIndex?: number
  ) => {
    if (!supabaseProperty?.property_unique_id) {
      toast.error("Error: No se pudo identificar la propiedad");
      return;
    }

    try {
      const supabase = createClient();

      if ((fieldName === "affects_commercialization_bedrooms" || fieldName === "affects_commercialization_bathrooms") && roomIndex !== undefined) {
        const { data: currentProperty } = await supabase
          .from("properties")
          .select(fieldName)
          .eq("property_unique_id", supabaseProperty.property_unique_id)
          .single();

        const currentArray = (Array.isArray(currentProperty?.[fieldName])
          ? currentProperty[fieldName]
          : []) as (boolean | null)[];

        while (currentArray.length <= roomIndex) {
          currentArray.push(null);
        }

        currentArray[roomIndex] = affects;

        await supabase
          .from("properties")
          .update({ [fieldName]: currentArray })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        if (fieldName === "affects_commercialization_bedrooms") {
          setAffectsCommercializationBedrooms((prev) => ({ ...prev, [roomIndex]: affects }));
        } else {
          setAffectsCommercializationBathrooms((prev) => ({ ...prev, [roomIndex]: affects }));
        }
      } else {
        await supabase
          .from("properties")
          .update({ [fieldName]: affects })
          .eq("property_unique_id", supabaseProperty.property_unique_id);

        switch (fieldName) {
          case "affects_commercialization_common_areas": setAffectsCommercializationCommonAreas(affects); break;
          case "affects_commercialization_entry_hallways": setAffectsCommercializationEntryHallways(affects); break;
          case "affects_commercialization_living_room": setAffectsCommercializationLivingRoom(affects); break;
          case "affects_commercialization_kitchen": setAffectsCommercializationKitchen(affects); break;
          case "affects_commercialization_exterior": setAffectsCommercializationExterior(affects); break;
          case "affects_commercialization_garage": setAffectsCommercializationGarage(affects); break;
          case "affects_commercialization_terrace": setAffectsCommercializationTerrace(affects); break;
        }
      }
    } catch (error) {
      console.error("Error updating affects commercialization:", error);
      toast.error(`Error al guardar: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Helper para subir fotos
  const handlePhotoUpload = async (
    fieldName: string,
    files: FileList,
    currentPhotos: string[],
    setPhotos: (photos: string[]) => void,
    roomIndex?: number
  ) => {
    if (!supabaseProperty?.property_unique_id) {
      toast.error("Error: No se pudo identificar la propiedad");
      return;
    }

    try {
      const isArrayOfArrays = roomIndex !== undefined && (
        fieldName === "marketing_photos_bedrooms" || fieldName === "marketing_photos_bathrooms" ||
        fieldName === "incident_photos_bedrooms" || fieldName === "incident_photos_bathrooms"
      );
      
      if (isArrayOfArrays) {
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
        
        await Promise.all(uploadPromises);
        
        const supabase = createClient();
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
        toast.success(`${files.length} foto(s) subida(s) correctamente`);
      } else {
        const uploadPromises = Array.from(files).map(async (file) => {
          return await uploadDocument(fieldName, supabaseProperty.property_unique_id, file);
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

  // Helper para eliminar fotos
  const handlePhotoDelete = async (
    fieldName: string,
    photoUrl: string,
    currentPhotos: string[],
    setPhotos: (photos: string[]) => void,
    roomIndex?: number
  ) => {
    if (!supabaseProperty?.property_unique_id) {
      toast.error("Error: No se pudo identificar la propiedad");
      return;
    }

    try {
      const isArrayOfArrays = roomIndex !== undefined && (
        fieldName === "marketing_photos_bedrooms" || fieldName === "marketing_photos_bathrooms" ||
        fieldName === "incident_photos_bedrooms" || fieldName === "incident_photos_bathrooms"
      );
      
      if (isArrayOfArrays) {
        const deleteResponse = await fetch("/api/documents/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fieldName: fieldName,
            propertyId: supabaseProperty.property_unique_id,
            fileUrl: photoUrl,
            roomIndex: roomIndex,
          }),
        });
        
        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `Delete failed with status ${deleteResponse.status}`);
        }
        
        const updatedPhotos = currentPhotos.filter((url) => url !== photoUrl);
        setPhotos(updatedPhotos);
      } else {
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

  // Componente para subida de fotos
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
              id={`photo-upload-${fieldName}-${roomIndex ?? ""}`}
            />
            <label
              htmlFor={`photo-upload-${fieldName}-${roomIndex ?? ""}`}
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

  if (!supabaseProperty) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Sección 1: Presentación al Cliente */}
      <Phase2SectionWidget
        id="client-presentation"
        title="Presentación al Cliente"
        instructions={getSectionInstructions("client-presentation")}
        required
        isComplete={isSection1Complete()}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                ¿Se ha realizado la presentación del servicio al cliente?
              </Label>
              {clientPresentationDone !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClearPresentationDone();
                  }}
                  className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-3 w-3 mr-1" />
                  Borrar selección
                </Button>
              )}
            </div>
            <RadioGroup
              value={clientPresentationDone === null ? "" : clientPresentationDone ? "yes" : "no"}
              onValueChange={handlePresentationDoneChange}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="presentation-yes" />
                <Label htmlFor="presentation-yes" className="cursor-pointer">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="presentation-no" />
                <Label htmlFor="presentation-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          {clientPresentationDone === true && (
            <>
              <div className="space-y-2">
                <Label htmlFor="presentation-date" className="text-sm font-medium">
                  Fecha de Presentación <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="presentation-date"
                  type="date"
                  value={clientPresentationDate}
                  onChange={(e) => handlePresentationDateChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Canal de Comunicación <span className="text-red-500">*</span>
                  </Label>
                  {clientPresentationChannel && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleClearPresentationChannel();
                      }}
                      className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Borrar selección
                    </Button>
                  )}
                </div>
                <RadioGroup
                  value={clientPresentationChannel || ""}
                  onValueChange={handlePresentationChannelChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Llamada telefónica" id="channel-phone" />
                    <Label htmlFor="channel-phone" className="cursor-pointer">Llamada telefónica</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Correo electrónico" id="channel-email" />
                    <Label htmlFor="channel-email" className="cursor-pointer">Correo electrónico</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Ambos" id="channel-both" />
                    <Label htmlFor="channel-both" className="cursor-pointer">Ambos</Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}
        </div>
      </Phase2SectionWidget>

      {/* Sección 2: Estrategia de Precio */}
      <Phase2SectionWidget
        id="pricing-strategy"
        title="Estrategia de Precio"
        instructions={getSectionInstructions("pricing-strategy")}
        required
        isComplete={isSection2Complete()}
      >
        <div className="space-y-4">
          <FinancialPerformanceWidget 
            property={{
              ...supabaseProperty,
              announcement_price: announcementPrice ? parseFloat(announcementPrice) : supabaseProperty.announcement_price,
            }} 
            currentPhase="Listo para Alquilar" 
          />
          
          <div className="space-y-2">
            <Label htmlFor="announcement-price" className="text-sm font-medium">
              Precio de Publicación <span className="text-red-500">*</span>
            </Label>
            <Input
              id="announcement-price"
              type="number"
              placeholder="Ej: 1200"
              value={announcementPrice}
              onChange={(e) => handleAnnouncementPriceChange(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          {announcementPrice && parseFloat(announcementPrice) > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  ¿Ha aprobado el cliente este precio de publicación? <span className="text-red-500">*</span>
                </Label>
                {priceApproval !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClearPriceApproval();
                    }}
                    className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Borrar selección
                  </Button>
                )}
              </div>
              <RadioGroup
                value={priceApproval === null ? "" : priceApproval ? "yes" : "no"}
                onValueChange={handlePriceApprovalChange}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="approval-yes" />
                  <Label htmlFor="approval-yes" className="cursor-pointer">Sí</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="approval-no" />
                  <Label htmlFor="approval-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
      </Phase2SectionWidget>

      {/* Sección 3: Inspección Técnica y Reportaje */}
      <Phase2SectionWidget
        id="technical-inspection"
        title="Inspección Técnica y Reportaje"
        instructions={getSectionInstructions("technical-inspection")}
        required
        isComplete={isSection3Complete()}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Evalúa cada estancia/zona de la propiedad. Valida su estado y sube las fotos comerciales.
          </p>
          
          <Accordion type="multiple" className="w-full space-y-4">
            {getAllRooms().map((room) => {
              const status = getRoomStatus(room);
              const comment = getRoomComment(room);
              const affects = getRoomAffectsCommercialization(room);
              const commercialPhotos = getRoomCommercialPhotos(room);
              const incidentPhotos = getRoomIncidentPhotos(room);
              
              // Determinar nombres de campos según tipo de estancia
              const getFieldNames = () => {
                if (room.type === "bedrooms" && room.index !== undefined) {
                  return {
                    check: "check_bedrooms",
                    comment: "comment_bedrooms",
                    affects: "affects_commercialization_bedrooms",
                    photos: "marketing_photos_bedrooms",
                    incidentPhotos: "incident_photos_bedrooms",
                  };
                }
                if (room.type === "bathrooms" && room.index !== undefined) {
                  return {
                    check: "check_bathrooms",
                    comment: "comment_bathrooms",
                    affects: "affects_commercialization_bathrooms",
                    photos: "marketing_photos_bathrooms",
                    incidentPhotos: "incident_photos_bathrooms",
                  };
                }
                const fieldMap: Record<string, any> = {
                  common_areas: {
                    check: "check_common_areas",
                    comment: "comment_common_areas",
                    affects: "affects_commercialization_common_areas",
                    photos: "marketing_photos_common_areas",
                    incidentPhotos: "incident_photos_common_areas",
                  },
                  entry_hallways: {
                    check: "check_entry_hallways",
                    comment: "comment_entry_hallways",
                    affects: "affects_commercialization_entry_hallways",
                    photos: "marketing_photos_entry_hallways",
                    incidentPhotos: "incident_photos_entry_hallways",
                  },
                  living_room: {
                    check: "check_living_room",
                    comment: "comment_living_room",
                    affects: "affects_commercialization_living_room",
                    photos: "marketing_photos_living_room",
                    incidentPhotos: "incident_photos_living_room",
                  },
                  kitchen: {
                    check: "check_kitchen",
                    comment: "comment_kitchen",
                    affects: "affects_commercialization_kitchen",
                    photos: "marketing_photos_kitchen",
                    incidentPhotos: "incident_photos_kitchen",
                  },
                  exterior: {
                    check: "check_exterior",
                    comment: "comment_exterior",
                    affects: "affects_commercialization_exterior",
                    photos: "marketing_photos_exterior",
                    incidentPhotos: "incident_photos_exterior",
                  },
                  garage: {
                    check: "check_garage",
                    comment: "comment_garage",
                    affects: "affects_commercialization_garage",
                    photos: "marketing_photos_garage",
                    incidentPhotos: "incident_photos_garage",
                  },
                  terrace: {
                    check: "check_terrace",
                    comment: "comment_terrace",
                    affects: "affects_commercialization_terrace",
                    photos: "marketing_photos_terrace",
                    incidentPhotos: "incident_photos_terrace",
                  },
                  storage: {
                    check: "check_storage",
                    comment: "comment_storage",
                    affects: "affects_commercialization_storage",
                    photos: "marketing_photos_storage",
                    incidentPhotos: "incident_photos_storage",
                  },
                };
                return fieldMap[room.type] || {};
              };
              
              const fieldNames = getFieldNames();
              
              // Helpers para setters
              const getSetters = () => {
                if (room.type === "bedrooms" && room.index !== undefined) {
                  return {
                    setStatus: (s: "good" | "incident") => setStatusBedrooms((prev) => ({ ...prev, [room.index!]: s })),
                    setComment: (c: string) => setCommentBedrooms((prev) => ({ ...prev, [room.index!]: c })),
                    setAffects: (a: boolean) => setAffectsCommercializationBedrooms((prev) => ({ ...prev, [room.index!]: a })),
                    setCommercialPhotos: (p: string[]) => setPhotosBedrooms((prev) => ({ ...prev, [room.index!]: p })),
                    setIncidentPhotos: (p: string[]) => setIncidentPhotosBedrooms((prev) => ({ ...prev, [room.index!]: p })),
                  };
                }
                if (room.type === "bathrooms" && room.index !== undefined) {
                  return {
                    setStatus: (s: "good" | "incident") => setStatusBathrooms((prev) => ({ ...prev, [room.index!]: s })),
                    setComment: (c: string) => setCommentBathrooms((prev) => ({ ...prev, [room.index!]: c })),
                    setAffects: (a: boolean) => setAffectsCommercializationBathrooms((prev) => ({ ...prev, [room.index!]: a })),
                    setCommercialPhotos: (p: string[]) => setPhotosBathrooms((prev) => ({ ...prev, [room.index!]: p })),
                    setIncidentPhotos: (p: string[]) => setIncidentPhotosBathrooms((prev) => ({ ...prev, [room.index!]: p })),
                  };
                }
                const setterMap: Record<string, any> = {
                  common_areas: {
                    setStatus: setStatusCommonAreas,
                    setComment: setCommentCommonAreas,
                    setAffects: setAffectsCommercializationCommonAreas,
                    setCommercialPhotos: setPhotosCommonAreas,
                    setIncidentPhotos: setIncidentPhotosCommonAreas,
                  },
                  entry_hallways: {
                    setStatus: setStatusEntryHallways,
                    setComment: setCommentEntryHallways,
                    setAffects: setAffectsCommercializationEntryHallways,
                    setCommercialPhotos: setPhotosEntryHallways,
                    setIncidentPhotos: setIncidentPhotosEntryHallways,
                  },
                  living_room: {
                    setStatus: setStatusLivingRoom,
                    setComment: setCommentLivingRoom,
                    setAffects: setAffectsCommercializationLivingRoom,
                    setCommercialPhotos: setPhotosLivingRoom,
                    setIncidentPhotos: setIncidentPhotosLivingRoom,
                  },
                  kitchen: {
                    setStatus: setStatusKitchen,
                    setComment: setCommentKitchen,
                    setAffects: setAffectsCommercializationKitchen,
                    setCommercialPhotos: setPhotosKitchen,
                    setIncidentPhotos: setIncidentPhotosKitchen,
                  },
                  exterior: {
                    setStatus: setStatusExterior,
                    setComment: setCommentExterior,
                    setAffects: setAffectsCommercializationExterior,
                    setCommercialPhotos: setPhotosExterior,
                    setIncidentPhotos: setIncidentPhotosExterior,
                  },
                  garage: {
                    setStatus: setStatusGarage,
                    setComment: setCommentGarage,
                    setAffects: setAffectsCommercializationGarage,
                    setCommercialPhotos: setPhotosGarage,
                    setIncidentPhotos: setIncidentPhotosGarage,
                  },
                  terrace: {
                    setStatus: setStatusTerrace,
                    setComment: setCommentTerrace,
                    setAffects: setAffectsCommercializationTerrace,
                    setCommercialPhotos: setPhotosTerrace,
                    setIncidentPhotos: setIncidentPhotosTerrace,
                  },
                  storage: {
                    setStatus: setStatusStorage,
                    setComment: setCommentStorage,
                    setAffects: setAffectsCommercializationStorage,
                    setCommercialPhotos: setPhotosStorage,
                    setIncidentPhotos: setIncidentPhotosStorage,
                  },
                };
                return setterMap[room.type] || {};
              };
              
              const setters = getSetters();
              
              const roomState = getRoomState(room);
              
              // Función para obtener la clase de color según el estado
              const getColorClass = () => {
                switch (roomState) {
                  case "good":
                    return "bg-green-500";
                  case "blocking":
                    return "bg-red-500";
                  case "non-blocking":
                    return "bg-orange-500";
                  default:
                    return "bg-gray-300";
                }
              };

              const getStateLabel = () => {
                switch (roomState) {
                  case "good":
                    return "Buen Estado";
                  case "blocking":
                    return "Incidencias Bloqueantes";
                  case "non-blocking":
                    return "Incidencias No Bloqueantes";
                  default:
                    return "Sin completar";
                }
              };

              return (
                <AccordionItem key={`${room.type}-${room.index ?? ""}`} value={`${room.type}-${room.index ?? ""}`} className="border rounded-lg overflow-hidden">
                  <Card>
                    <CardHeader className="pb-3 p-6">
                      <AccordionTrigger className="hover:no-underline py-0 items-center">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`h-3 w-3 rounded-full ${getColorClass()}`} title={getStateLabel()} />
                          <CardTitle className="text-base font-semibold text-left">{room.label}</CardTitle>
                        </div>
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                      <CardContent className="pt-0 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">¿Estado de la estancia?</Label>
                          <StatusSelector
                            variant="final-check"
                            value={status}
                            onChange={(value) => {
                              const newStatus = value as "good" | "incident";
                              setters.setStatus(newStatus);
                              handleStatusChange(fieldNames.check, newStatus, room.index);
                            }}
                          />
                        </div>
                        
                        {status !== null && (
                          <>
                            {status === "incident" && (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Descripción <span className="text-red-500">*</span>
                                  </Label>
                                  <Textarea
                                    placeholder="Describe el problema o el estado de esta estancia..."
                                    value={comment}
                                    onChange={(e) => {
                                      setters.setComment(e.target.value);
                                      handleCommentChange(fieldNames.comment, e.target.value, room.index);
                                    }}
                                    rows={3}
                                  />
                                </div>
                                
                                <PhotoUploadSection
                                  title="FOTOS DE LA INCIDENCIA"
                                  fieldName={fieldNames.incidentPhotos}
                                  photos={incidentPhotos}
                                  setPhotos={setters.setIncidentPhotos}
                                  roomIndex={room.index}
                                />
                                
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">
                                      ¿Afecta esta incidencia a la comercialización? <span className="text-red-500">*</span>
                                    </Label>
                                    {affects !== null && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          await handleAffectsCommercializationChange(fieldNames.affects, null, room.index);
                                        }}
                                        className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Borrar selección
                                      </Button>
                                    )}
                                  </div>
                                  <RadioGroup
                                    value={affects === null ? "" : affects ? "yes" : "no"}
                                    onValueChange={(value) => {
                                      if (value === "") {
                                        handleAffectsCommercializationChange(fieldNames.affects, null, room.index);
                                        return;
                                      }
                                      const newAffects = value === "yes";
                                      setters.setAffects(newAffects);
                                      handleAffectsCommercializationChange(fieldNames.affects, newAffects, room.index);
                                    }}
                                    className="flex gap-6"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="yes" id={`affects-yes-${room.type}-${room.index ?? ""}`} />
                                      <Label htmlFor={`affects-yes-${room.type}-${room.index ?? ""}`} className="cursor-pointer">Sí</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="no" id={`affects-no-${room.type}-${room.index ?? ""}`} />
                                      <Label htmlFor={`affects-no-${room.type}-${room.index ?? ""}`} className="cursor-pointer">No</Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                                
                                {affects === false && (
                                  <PhotoUploadSection
                                    title="FOTOS PARA COMERCIALIZACIÓN"
                                    fieldName={fieldNames.photos}
                                    photos={commercialPhotos}
                                    setPhotos={setters.setCommercialPhotos}
                                    roomIndex={room.index}
                                  />
                                )}
                              </>
                            )}
                            
                            {status === "good" && (
                              <PhotoUploadSection
                                title="FOTOS PARA COMERCIALIZACIÓN"
                                fieldName={fieldNames.photos}
                                photos={commercialPhotos}
                                setPhotos={setters.setCommercialPhotos}
                                roomIndex={room.index}
                              />
                            )}
                          </>
                        )}
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </Phase2SectionWidget>

      {/* Sección 4: Lanzamiento Comercial */}
      <Phase2SectionWidget
        id="commercial-launch"
        title="Lanzamiento Comercial"
        instructions={getSectionInstructions("commercial-launch")}
        required
        isComplete={isSection4Complete()}
        isBlocked={!isSection1Complete() || !isSection2Complete() || !isSection3Complete()}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                ¿Se publicará la propiedad en portales inmobiliarios? <span className="text-red-500">*</span>
              </Label>
              {publishOnline !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setPublishOnline(null);
                    updateField(sectionId, "publishOnline", null);
                  }}
                  className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-3 w-3 mr-1" />
                  Borrar selección
                </Button>
              )}
            </div>
            <RadioGroup
              value={publishOnline === true ? "yes" : publishOnline === false ? "no" : ""}
              onValueChange={handlePublishOnlineChange}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="publish-yes" />
                <Label htmlFor="publish-yes" className="cursor-pointer">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="publish-no" />
                <Label htmlFor="publish-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          {publishOnline === true && (
            <div className="space-y-2">
              <Label htmlFor="idealista-description" className="text-sm font-medium">
                Descripción del Inmueble para el Anuncio <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="idealista-description"
                placeholder="Escribe la descripción del inmueble para el anuncio..."
                value={idealistaDescription}
                onChange={(e) => handleIdealistaDescriptionChange(e.target.value)}
                rows={6}
                required
              />
            </div>
          )}
        </div>
      </Phase2SectionWidget>
    </div>
  );
}
