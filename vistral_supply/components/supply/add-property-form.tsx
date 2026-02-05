"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Plus, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createProperty, saveProperty, getPropertyById, PropertyType, Property, PropertyData } from "@/lib/supply-property-storage";
import { createPropertyInSupabase, savePropertyToSupabase, savePropertyBasicData } from "@/lib/supply-property-supabase";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { validatePropertyComplete } from "@/lib/supply-property-validation";
import { toast } from "sonner";
import { useGoogleMapsAutocomplete, type GooglePlacePrediction } from "@/hooks/useGoogleMapsAutocomplete";
import { savePropertyAddress, extractAddressComponents } from "@/lib/supply-address-supabase";
import { getCurrentPropertyChecklist, checklistRowToChecklistData } from "@/lib/supply-checklist-supabase";

const PROPERTY_TYPES = [
  "Piso",
  "Casa",
  "Ático",
  "Dúplex",
  "Estudio",
  "Loft",
  "Casa adosada",
  "Local comercial",
  "Edificio",
  "Casa con terreno",
  "Terreno",
  "Obra nueva",
  "Residencia",
  "En construcción",
  "Garaje",
  "Trastero",
];

interface AddPropertyFormProps {
  onSuccess?: (propertyId: string) => void;
  showTitle?: boolean;
  propertyId?: string;
}

export function AddPropertyForm({ onSuccess, showTitle = false, propertyId }: AddPropertyFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [addressInput, setAddressInput] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<any>(null);
  const [streetNumber, setStreetNumber] = useState("");
  const [planta, setPlanta] = useState("");
  const [puerta, setPuerta] = useState("");
  const [bloque, setBloque] = useState("");
  const [escalera, setEscalera] = useState("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingPlaceDetails, setLoadingPlaceDetails] = useState(false);

  // Google Maps Autocomplete hook
  const { predictions, isLoading: isLoadingPredictions, error: autocompleteError, getPlaceDetails } = useGoogleMapsAutocomplete({
    input: addressInput,
    minLength: 3,
    debounceMs: 300,
    countryRestriction: "es", // España por defecto
  });

  // Load property data if editing
  useEffect(() => {
    if (propertyId) {
      const property = getPropertyById(propertyId);
      if (property) {
        setAddressInput(property.fullAddress || "");
        setStreetNumber(""); // Extract from address if needed
        setPlanta(property.planta || "");
        setPuerta(property.puerta || "");
        setBloque(property.bloque || "");
        setEscalera(property.escalera || "");
        setPropertyType(property.propertyType || "");
      }
    }
  }, [propertyId]);
  
  // Validation states
  const [errors, setErrors] = useState<{
    fullAddress?: string;
    streetNumber?: string;
    propertyType?: string;
    general?: string;
  }>({});
  
  const [showPredictions, setShowPredictions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Show predictions when available
  useEffect(() => {
    setShowPredictions(predictions.length > 0 && addressInput.length >= 3);
  }, [predictions, addressInput]);

  // Click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPrediction = async (prediction: GooglePlacePrediction) => {
    setAddressInput(prediction.description);
    setSelectedPlaceId(prediction.place_id);
    setShowPredictions(false);
    setLoadingPlaceDetails(true);

    try {
      // Obtener detalles completos del lugar
      const details = await getPlaceDetails(prediction.place_id);
      if (details) {
        setSelectedPlaceDetails(details);
        
        // Extraer número de calle si existe
        const streetNumberComponent = details.address_components?.find(
          (comp) => comp.types.includes("street_number")
        );
        
        if (streetNumberComponent) {
          setStreetNumber(streetNumberComponent.long_name);
        } else {
          // Si no hay número, dejar el campo vacío para que el usuario lo agregue
          setStreetNumber("");
        }
      }
    } catch (error) {
      console.error("Error loading place details:", error);
      toast.error("Error al cargar detalles de la dirección");
    } finally {
      setLoadingPlaceDetails(false);
    }
  };

  const handleSubmit = async () => {
    // Reset errors
    setErrors({});

    // Validate required fields
    if (!addressInput.trim()) {
      setErrors((prev) => ({
        ...prev,
        fullAddress: t.formLabels.required,
      }));
      return;
    }

    // Validar que se haya seleccionado una dirección de Google Maps
    if (!selectedPlaceDetails) {
      setErrors((prev) => ({
        ...prev,
        fullAddress: "Por favor, selecciona una dirección de la lista",
      }));
      return;
    }

    // El número de calle es opcional si ya viene en la dirección de Google
    // pero si el usuario lo ha ingresado manualmente, debe estar presente
    const hasStreetNumberInGoogle = selectedPlaceDetails.address_components?.some(
      (comp: any) => comp.types.includes("street_number")
    );
    
    if (!hasStreetNumberInGoogle && !streetNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        streetNumber: "Por favor, ingresa el número de la calle",
      }));
      return;
    }

    if (!propertyType) {
      setErrors((prev) => ({
        ...prev,
        propertyType: t.formLabels.required,
      }));
      return;
    }

    setLoading(true);
    try {
      // Extraer componentes de dirección de Google Maps
      const addressComponents = extractAddressComponents(
        selectedPlaceDetails,
        streetNumber.trim() || undefined
      );

      // Construir dirección completa para mostrar
      const fullAddressDisplay = addressComponents.address_line;

      let property: Property;
      let propertyIdToUse: string;
      
      if (propertyId) {
        // Update existing property
        const existingProperty = getPropertyById(propertyId);
        if (!existingProperty) {
          setErrors((prev) => ({
            ...prev,
            general: "Propiedad no encontrada",
          }));
          return;
        }
        
        property = {
          ...existingProperty,
          fullAddress: fullAddressDisplay,
          planta: planta.trim() || undefined,
          puerta: puerta.trim() || undefined,
          bloque: bloque.trim() || undefined,
          escalera: escalera.trim() || undefined,
          propertyType: propertyType as PropertyType,
          address: fullAddressDisplay,
        };

        // Save to Supabase
        propertyIdToUse = await savePropertyToSupabase(property);
        
        // Save address to address table
        await savePropertyAddress(propertyIdToUse, {
          property_id: propertyIdToUse,
          address_line: addressComponents.address_line,
          postal_code: addressComponents.postal_code,
          city: addressComponents.city,
          country: addressComponents.country,
          planta: planta.trim() || undefined,
          puerta: puerta.trim() || undefined,
          bloque: bloque.trim() || undefined,
          escalera: escalera.trim() || undefined,
          latitude: addressComponents.latitude,
          longitude: addressComponents.longitude,
        });
        
        // Also save to localStorage for offline support
        saveProperty(property);
      } else {
        // Create new property in Supabase first
        propertyIdToUse = await createPropertyInSupabase(
          fullAddressDisplay,
          propertyType as PropertyType,
          planta.trim() || undefined,
          puerta.trim() || undefined,
          bloque.trim() || undefined,
          escalera.trim() || undefined
        );

        // Then create local property object
        property = createProperty(
          fullAddressDisplay,
          propertyType as PropertyType,
          planta.trim() || undefined,
          puerta.trim() || undefined,
          bloque.trim() || undefined,
          escalera.trim() || undefined
        );
        
        // Update with Supabase ID
        property.id = propertyIdToUse;
        
        // Save basic data to Supabase (including address details)
        const basicData: PropertyData = {
          tipoPropiedad: propertyType as PropertyType,
        };
        await savePropertyBasicData(propertyIdToUse, basicData);
        
        // Save address to address table with coordinates
        await savePropertyAddress(propertyIdToUse, {
          property_id: propertyIdToUse,
          address_line: addressComponents.address_line,
          postal_code: addressComponents.postal_code,
          city: addressComponents.city,
          country: addressComponents.country,
          planta: planta.trim() || undefined,
          puerta: puerta.trim() || undefined,
          bloque: bloque.trim() || undefined,
          escalera: escalera.trim() || undefined,
          latitude: addressComponents.latitude,
          longitude: addressComponents.longitude,
        });
        
        // Save to localStorage for offline support
        saveProperty(property);
      }

      // Check if property is complete and update stage accordingly
      // Get checklist if it exists
      const checklistRow = await getCurrentPropertyChecklist(propertyIdToUse);
      const checklist = checklistRow ? checklistRowToChecklistData(checklistRow) : undefined;
      
      const isComplete = validatePropertyComplete(property.data, property.propertyType, checklist);
      if (isComplete && property.currentStage === "draft") {
        property.currentStage = "in-review";
        property.timeInStage = "0 días";
        // Update in Supabase if stage changed
        await savePropertyToSupabase(property);
      }
      
      toast.success(propertyId ? "Propiedad actualizada" : "Propiedad creada exitosamente");
      
      console.log("Property saved:", propertyIdToUse);

      // Call success callback if provided, otherwise redirect
      if (onSuccess) {
        onSuccess(propertyIdToUse);
      } else {
        // Redirect to edit page
        router.push(`/supply/property/${propertyIdToUse}/edit`);
      }
    } catch (error: any) {
      console.error("Error saving property:", error);
      setErrors((prev) => ({
        ...prev,
        general: error.message || "Error al guardar la propiedad. Por favor, intenta de nuevo.",
      }));
      toast.error(error.message || "Error al guardar la propiedad");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = 
    addressInput.trim() !== "" && 
    selectedPlaceDetails !== null &&
    propertyType !== "";

  return (
    <div className="flex flex-col items-start gap-4 p-0">
      {showTitle && (
        <h1 className="text-[24px] leading-[32px] font-medium tracking-[-1.5px] text-[#212121] dark:text-white">
          {propertyId ? t.property.edit : t.property.addNew}
        </h1>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{errors.general}</p>
        </div>
      )}

      {/* Full Address Field - Full width */}
      <div className="flex flex-col items-start gap-2 w-full">
        <Label htmlFor="fullAddress" className="text-[14px] leading-[20px] font-medium tracking-[-0.5px] text-[#212121] dark:text-white w-full">
          {t.property.fullAddress} <span className="text-red-500">*</span>
        </Label>
        <div className="relative w-full" ref={autocompleteRef}>
          <Input
            id="fullAddress"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              setSelectedPlaceId(null);
              setSelectedPlaceDetails(null);
            }}
            placeholder="Busca una dirección..."
            leftIcon={MapPin}
            rightIcon={(isLoadingPredictions || loadingPlaceDetails) ? Loader2 : undefined}
            error={!!errors.fullAddress}
            className={cn(
              "h-10 py-2 w-full text-[16px] leading-[24px] tracking-[-0.7px] placeholder:text-[#A1A1AA] text-[#212121] dark:text-white rounded-lg",
              errors.fullAddress && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          
          {/* Autocomplete predictions */}
          {showPredictions && predictions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-card dark:bg-[var(--prophero-gray-900)] border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  type="button"
                  onClick={() => handleSelectPrediction(prediction)}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--prophero-gray-100)] dark:hover:bg-[var(--prophero-gray-800)] transition-colors first:rounded-t-md last:rounded-b-md"
                >
                  <div className="font-medium text-sm">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Error message from Google Maps API */}
          {autocompleteError && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              {autocompleteError}
            </p>
          )}
        </div>
        {errors.fullAddress && (
          <p className="text-sm text-red-500">{errors.fullAddress}</p>
        )}
        {selectedPlaceDetails && (
          <p className="text-xs text-green-600 dark:text-green-400">
            ✓ Dirección seleccionada
          </p>
        )}
      </div>

      {/* Street Number - Full width */}
      <div className="flex flex-col items-start gap-2 w-full">
        <Label htmlFor="streetNumber" className="text-[14px] leading-[20px] font-medium tracking-[-0.5px] text-[#212121] dark:text-white w-full">
          {t.formLabels.streetNumber || "Número de la calle"}
          {selectedPlaceDetails && !selectedPlaceDetails.address_components?.some(
            (comp: any) => comp.types.includes("street_number")
          ) && <span className="text-red-500"> *</span>}
          {selectedPlaceDetails && selectedPlaceDetails.address_components?.some(
            (comp: any) => comp.types.includes("street_number")
          ) && <span className="text-[12px] leading-[16px] tracking-[-0.2px] text-[#71717A] font-normal ml-1">(opcional)</span>}
        </Label>
        <Input
          id="streetNumber"
          value={streetNumber}
          onChange={(e) => setStreetNumber(e.target.value)}
          placeholder={`${t.formLabels.example} 1`}
          disabled={loadingPlaceDetails}
          className={cn(
            "h-10 px-3 py-2 w-full text-[16px] leading-[24px] tracking-[-0.7px] placeholder:text-[#A1A1AA] text-[#212121] dark:text-white rounded-lg",
            errors.streetNumber && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        {errors.streetNumber && (
          <p className="text-sm text-red-500">{errors.streetNumber}</p>
        )}
        {selectedPlaceDetails && selectedPlaceDetails.address_components?.some(
          (comp: any) => comp.types.includes("street_number")
        ) && (
          <p className="text-xs text-muted-foreground">
            El número ya está incluido en la dirección seleccionada
          </p>
        )}
      </div>

      {/* Address2 - Two columns layout: Row 1 (Planta + Bloque), Row 2 (Puerta + Escalera) */}
      <div className="flex flex-col items-start gap-4 w-full">
        {/* Row 1: Planta and Bloque side by side */}
        <div className="flex flex-row items-start gap-4 w-full">
          {/* Planta - Left column */}
          <div className="flex flex-col items-start gap-2 flex-1">
            <Label htmlFor="planta" className="text-[14px] leading-[20px] font-medium tracking-[-0.5px] text-[#212121] dark:text-white flex items-center justify-between w-full">
              <span>{t.formLabels.floor || "Planta"}</span>
              <span className="text-[12px] leading-[16px] tracking-[-0.2px] text-[#71717A] font-normal">({t.formLabels.optional})</span>
            </Label>
            <Input
              id="planta"
              value={planta}
              onChange={(e) => setPlanta(e.target.value)}
              placeholder={`${t.formLabels.example} 1`}
              className="h-10 px-3 py-2 w-full text-[16px] leading-[24px] tracking-[-0.7px] placeholder:text-[#A1A1AA] text-[#212121] dark:text-white rounded-lg"
            />
          </div>

          {/* Bloque - Right column */}
          <div className="flex flex-col items-start gap-2 flex-1">
            <Label htmlFor="bloque" className="text-[14px] leading-[20px] font-medium tracking-[-0.5px] text-[#212121] dark:text-white flex items-center justify-between w-full">
              <span>{t.formLabels.block || "Bloque"}</span>
              <span className="text-[12px] leading-[16px] tracking-[-0.2px] text-[#71717A] font-normal">({t.formLabels.optional})</span>
            </Label>
            <Input
              id="bloque"
              value={bloque}
              onChange={(e) => setBloque(e.target.value)}
              placeholder={`${t.formLabels.example} A`}
              className="h-10 px-3 py-2 w-full text-[16px] leading-[24px] tracking-[-0.7px] placeholder:text-[#A1A1AA] text-[#212121] dark:text-white rounded-lg"
            />
          </div>
        </div>

        {/* Row 2: Puerta and Escalera side by side */}
        <div className="flex flex-row items-start gap-4 w-full">
          {/* Puerta - Left column */}
          <div className="flex flex-col items-start gap-2 flex-1">
            <Label htmlFor="puerta" className="text-[14px] leading-[20px] font-medium tracking-[-0.5px] text-[#212121] dark:text-white flex items-center justify-between w-full">
              <span>{t.formLabels.door || "Puerta"}</span>
              <span className="text-[12px] leading-[16px] tracking-[-0.2px] text-[#71717A] font-normal">({t.formLabels.optional})</span>
            </Label>
            <Input
              id="puerta"
              value={puerta}
              onChange={(e) => setPuerta(e.target.value)}
              placeholder={`${t.formLabels.example} 1`}
              className="h-10 px-3 py-2 w-full text-[16px] leading-[24px] tracking-[-0.7px] placeholder:text-[#A1A1AA] text-[#212121] dark:text-white rounded-lg"
            />
          </div>

          {/* Escalera - Right column */}
          <div className="flex flex-col items-start gap-2 flex-1">
            <Label htmlFor="escalera" className="text-[14px] leading-[20px] font-medium tracking-[-0.5px] text-[#212121] dark:text-white flex items-center justify-between w-full">
              <span>{t.formLabels.staircase || "Escalera"}</span>
              <span className="text-[12px] leading-[16px] tracking-[-0.2px] text-[#71717A] font-normal">({t.formLabels.optional})</span>
            </Label>
            <Input
              id="escalera"
              value={escalera}
              onChange={(e) => setEscalera(e.target.value)}
              placeholder={`${t.formLabels.example} 1`}
              className="h-10 px-3 py-2 w-full text-[16px] leading-[24px] tracking-[-0.7px] placeholder:text-[#A1A1AA] text-[#212121] dark:text-white rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Property Type - Full width */}
      <div className="flex flex-col items-start gap-2 w-full">
        <Label htmlFor="propertyType" className="text-[14px] leading-[20px] font-medium tracking-[-0.5px] text-[#212121] dark:text-white w-full">
          {t.property.propertyType} <span className="text-red-500">*</span>
        </Label>
        <Select
          value={propertyType}
          onValueChange={(value: string) => setPropertyType(value)}
        >
          <SelectTrigger
            id="propertyType"
            className={cn(
              "h-10 px-3 py-2 w-full text-[16px] leading-[24px] tracking-[-0.7px] placeholder:text-[#A1A1AA] text-[#212121] dark:text-white rounded-lg",
              errors.propertyType && "border-red-500 focus:ring-red-500"
            )}
          >
            <SelectValue placeholder={t.formLabels.selectOption || "Selecciona una opción"} />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" sideOffset={4} className="max-h-[200px] overflow-y-auto">
            {PROPERTY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.propertyType && (
          <p className="text-sm text-red-500">{errors.propertyType}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="w-full">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className="w-full h-10 px-5 py-2 text-[16px] leading-[24px] font-medium tracking-[-0.7px] bg-[#2050F6] hover:bg-[#1a40cc] active:bg-[#1533a3] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors duration-200"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          {loading ? t.common.loading : (propertyId ? t.common.save : t.property.addNew)}
        </Button>
      </div>
    </div>
  );
}
