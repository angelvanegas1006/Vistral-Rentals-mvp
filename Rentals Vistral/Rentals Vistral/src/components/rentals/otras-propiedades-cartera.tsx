"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PropertySearchCard } from "@/components/rentals/property-search-card";
import {
  usePublishedProperties,
  type PublishedPropertiesFilters,
} from "@/hooks/use-published-properties";
import { RentalsHomeLoader } from "@/components/rentals/rentals-home-loader";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  X,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";
import type { LeadPropertyItem } from "@/hooks/use-lead-properties";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface SmartDefaults {
  city?: string;
  maxPrice?: number;
  minBedrooms?: number;
  areaCluster?: string;
}

/** Compute smart default filters from the lead's existing associated properties. */
function computeSmartDefaults(
  leadPropertyItems: LeadPropertyItem[]
): SmartDefaults {
  if (leadPropertyItems.length === 0) return {};

  const properties = leadPropertyItems.map((item) => item.property);

  // City = first associated property's city
  const firstProperty = properties[0];
  const city = firstProperty?.city ?? undefined;

  // Max price = most expensive associated property's announcement_price + 10%
  const prices = properties
    .map((p) => p.announcement_price)
    .filter((p): p is number => p != null && p > 0);
  const maxOriginalPrice = prices.length > 0 ? Math.max(...prices) : undefined;
  const maxPrice = maxOriginalPrice
    ? Math.ceil(maxOriginalPrice * 1.1)
    : undefined;

  // Min bedrooms = first associated property's bedrooms
  const minBedrooms = firstProperty?.bedrooms ?? undefined;

  // Zone = first associated property's area_cluster
  const areaCluster = firstProperty?.area_cluster ?? undefined;

  return {
    city: city ?? undefined,
    maxPrice,
    minBedrooms: minBedrooms ?? undefined,
    areaCluster: areaCluster ?? undefined,
  };
}

export interface OtrasPropiedadesCarteraProps {
  leadsUniqueId: string;
  leadPropertyItems: LeadPropertyItem[];
  onPropertyAdded: () => void;
}

export function OtrasPropiedadesCartera({
  leadsUniqueId,
  leadPropertyItems,
  onPropertyAdded,
}: OtrasPropiedadesCarteraProps) {
  // Smart defaults
  const defaults = useMemo(
    () => computeSmartDefaults(leadPropertyItems),
    [leadPropertyItems]
  );

  // --- Persist filters to sessionStorage per lead ---
  const storageKey = `otras-propiedades-filters-${leadsUniqueId}`;

  function loadSaved(): Record<string, unknown> | null {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  const saved = useRef(loadSaved());

  // Filter state — restore from session or fall back to smart defaults
  const [search, setSearch] = useState<string>(
    (saved.current?.search as string) ?? ""
  );
  const [city, setCity] = useState<string>(
    (saved.current?.city as string) ?? defaults.city ?? ""
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    (saved.current?.maxPrice as string) ??
      (defaults.maxPrice != null ? String(defaults.maxPrice) : "")
  );
  const [minBedrooms, setMinBedrooms] = useState<string>(
    (saved.current?.minBedrooms as string) ??
      (defaults.minBedrooms != null ? String(defaults.minBedrooms) : "")
  );
  const [areaClusters, setAreaClusters] = useState<string[]>(
    (saved.current?.areaClusters as string[]) ??
      (defaults.areaCluster ? [defaults.areaCluster] : [])
  );
  const [rentalType, setRentalType] = useState<string>(
    (saved.current?.rentalType as string) ?? ""
  );
  const [minSqm, setMinSqm] = useState<string>(
    (saved.current?.minSqm as string) ?? ""
  );
  const [minBathrooms, setMinBathrooms] = useState<string>(
    (saved.current?.minBathrooms as string) ?? ""
  );
  const [sectionOpen, setSectionOpen] = useState(
    (saved.current?.sectionOpen as boolean) ?? false
  );
  const [zonesDropdownOpen, setZonesDropdownOpen] = useState(false);
  const zonesRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(
    (saved.current?.filtersOpen as boolean) ?? false
  );
  const [addingId, setAddingId] = useState<string | null>(null);

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          search,
          city,
          maxPrice,
          minBedrooms,
          areaClusters,
          rentalType,
          minSqm,
          minBathrooms,
          sectionOpen,
          filtersOpen,
        })
      );
    } catch {
      // sessionStorage may be unavailable
    }
  }, [
    storageKey,
    search,
    city,
    maxPrice,
    minBedrooms,
    areaClusters,
    rentalType,
    minSqm,
    minBathrooms,
    sectionOpen,
    filtersOpen,
  ]);

  // IDs to exclude (already assigned to this lead)
  const excludeIds = useMemo(
    () => leadPropertyItems.map((item) => item.property.property_unique_id),
    [leadPropertyItems]
  );

  // Build filters object (memoized)
  const filters: PublishedPropertiesFilters = useMemo(
    () => ({
      city: city || undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minBedrooms: minBedrooms ? parseInt(minBedrooms, 10) : undefined,
      areaClusters: areaClusters.length > 0 ? areaClusters : undefined,
      rentalType: rentalType || undefined,
      minSqm: minSqm ? parseInt(minSqm, 10) : undefined,
      minBathrooms: minBathrooms ? parseInt(minBathrooms, 10) : undefined,
      search: search || undefined,
      excludeIds,
    }),
    [
      city,
      maxPrice,
      minBedrooms,
      areaClusters,
      rentalType,
      minSqm,
      minBathrooms,
      search,
      excludeIds,
    ]
  );

  const { properties, filterOptions, loading, error } =
    usePublishedProperties(filters);

  // Handle adding a property to the lead
  const handleAdd = useCallback(
    async (propertyUniqueId: string) => {
      setAddingId(propertyUniqueId);
      try {
        const res = await fetch(
          `/api/leads/${encodeURIComponent(leadsUniqueId)}/properties`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              properties_unique_id: propertyUniqueId,
            }),
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        toast.success("Propiedad añadida a gestión");
        onPropertyAdded();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Error al añadir propiedad";
        toast.error(msg);
      } finally {
        setAddingId(null);
      }
    },
    [leadsUniqueId, onPropertyAdded]
  );

  // When city changes, clear zone selections that may no longer be valid
  const handleCityChange = useCallback(
    (newCity: string) => {
      setCity(newCity === "__all__" ? "" : newCity);
      setAreaClusters([]);
    },
    []
  );

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setCity(defaults.city ?? "");
    setMaxPrice(defaults.maxPrice != null ? String(defaults.maxPrice) : "");
    setMinBedrooms(
      defaults.minBedrooms != null ? String(defaults.minBedrooms) : ""
    );
    setAreaClusters(defaults.areaCluster ? [defaults.areaCluster] : []);
    setRentalType("");
    setMinSqm("");
    setMinBathrooms("");
  };

  // Count active (non-default) filters
  const activeFilterCount = [
    city && city !== (defaults.city ?? ""),
    maxPrice &&
      maxPrice !== (defaults.maxPrice != null ? String(defaults.maxPrice) : ""),
    minBedrooms &&
      minBedrooms !==
        (defaults.minBedrooms != null ? String(defaults.minBedrooms) : ""),
    areaClusters.length > 0 &&
      !(
        areaClusters.length === 1 &&
        areaClusters[0] === (defaults.areaCluster ?? "")
      ),
    rentalType,
    minSqm,
    minBathrooms,
    search,
  ].filter(Boolean).length;

  // City options from API
  const cityOptions = useMemo(() => {
    const set = new Set(filterOptions.cities);
    if (defaults.city) set.add(defaults.city);
    return [...set].sort();
  }, [filterOptions.cities, defaults.city]);

  // Area cluster options: from API (already scoped by city)
  const areaClusterOptions = useMemo(() => {
    const set = new Set(filterOptions.areaClusters);
    if (defaults.areaCluster) set.add(defaults.areaCluster);
    return [...set].sort();
  }, [filterOptions.areaClusters, defaults.areaCluster]);

  const rentalTypeOptions = useMemo(() => {
    const fixed = ["Larga estancia", "Corta estancia", "Vacacional"];
    const set = new Set([...fixed, ...filterOptions.rentalTypes]);
    return [...set];
  }, [filterOptions.rentalTypes]);

  // Close zones dropdown on click outside
  useEffect(() => {
    if (!zonesDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (zonesRef.current && !zonesRef.current.contains(e.target as Node)) {
        setZonesDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [zonesDropdownOpen]);

  const toggleZone = useCallback(
    (zone: string) => {
      setAreaClusters((prev) =>
        prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
      );
    },
    []
  );

  // Label for the zones trigger
  const allZonesSelected =
    areaClusterOptions.length > 0 &&
    areaClusters.length === areaClusterOptions.length;

  const zonesTriggerLabel = useMemo(() => {
    if (areaClusters.length === 0 || allZonesSelected)
      return "Todas las zonas";
    if (areaClusters.length === 1) return areaClusters[0];
    return `${areaClusters.length} zonas`;
  }, [areaClusters, allZonesSelected]);

  return (
    <div className="rounded-[var(--vistral-radius-xl)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card overflow-hidden">
      {/* Section header — clickable to collapse/expand */}
      <button
        type="button"
        onClick={() => setSectionOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-5 md:p-6 cursor-pointer hover:bg-[var(--vistral-gray-50)] dark:hover:bg-[var(--vistral-gray-900)]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-foreground">
            Otras Propiedades en Cartera
          </h3>
          <span className="text-xs text-muted-foreground bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-700)] px-2 py-0.5 rounded-full">
            {loading ? "..." : properties.length}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            sectionOpen ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      {/* Collapsible content */}
      {sectionOpen && (
      <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-4">
      <p className="text-xs text-muted-foreground">
        Propiedades en fase Publicado que podrían interesar a este inquilino.
      </p>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por dirección..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Filters toggle */}
      <button
        type="button"
        onClick={() => setFiltersOpen((prev) => !prev)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Filtros</span>
        {activeFilterCount > 0 && (
          <span className="text-xs bg-[var(--vistral-blue-500)] text-white px-1.5 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            filtersOpen ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="rounded-[var(--vistral-radius-lg)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)] p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* City */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Ciudad
              </Label>
              <Select
                value={city || "__all__"}
                onValueChange={handleCityChange}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas las ciudades</SelectItem>
                  {cityOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zone (multi-select) */}
            <div className="space-y-1.5 col-span-2" ref={zonesRef}>
              <Label className="text-xs font-medium text-muted-foreground">
                Zonas
              </Label>

              {/* Trigger — mirrors SelectTrigger pattern */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setZonesDropdownOpen((p) => !p)}
                  className={cn(
                    "flex h-8 w-full items-center justify-between rounded-md border bg-background px-3 text-xs md:text-xs transition-colors",
                    "border-[var(--vistral-gray-300)] dark:border-[var(--vistral-gray-700)]",
                    zonesDropdownOpen
                      ? "ring-2 ring-[var(--vistral-blue-500)] border-[var(--vistral-blue-500)]"
                      : "hover:border-[var(--vistral-gray-400)]"
                  )}
                >
                  <span
                    className={cn(
                      "truncate",
                      areaClusters.length === 0 || allZonesSelected
                        ? "text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {zonesTriggerLabel}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 flex-shrink-0 opacity-50 transition-transform duration-150",
                      zonesDropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Dropdown — mirrors SelectContent pattern */}
                {zonesDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                    {areaClusterOptions.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-muted-foreground text-center">
                        No hay zonas disponibles
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                        {/* Select / deselect all */}
                        <label
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-xs font-medium transition-colors",
                            areaClusters.length === areaClusterOptions.length
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Checkbox
                            checked={
                              areaClusters.length === areaClusterOptions.length
                                ? true
                                : areaClusters.length > 0
                                  ? "indeterminate"
                                  : false
                            }
                            onCheckedChange={(checked) => {
                              setAreaClusters(checked ? [...areaClusterOptions] : []);
                            }}
                          />
                          <span>Todas las zonas</span>
                        </label>

                        <div className="-mx-1 my-1 h-px bg-muted" />

                        {areaClusterOptions.map((zone) => {
                          const checked = areaClusters.includes(zone);
                          return (
                            <label
                              key={zone}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-xs transition-colors",
                                checked
                                  ? "bg-accent text-accent-foreground"
                                  : "hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleZone(zone)}
                              />
                              <MapPin className="h-3 w-3 flex-shrink-0 opacity-40" />
                              <span className="truncate">{zone}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected zones chips — using Badge-like design system tokens */}
              {areaClusters.length > 0 && !allZonesSelected && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {areaClusters.map((zone) => (
                    <span
                      key={zone}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-medium bg-[var(--vistral-blue-50)] dark:bg-[var(--vistral-blue-950)] text-[var(--vistral-blue-600)] dark:text-[var(--vistral-blue-300)] border border-[var(--vistral-blue-200)] dark:border-[var(--vistral-blue-800)]"
                    >
                      {zone}
                      <button
                        type="button"
                        onClick={() => toggleZone(zone)}
                        className="rounded-full p-0.5 hover:bg-[var(--vistral-blue-100)] dark:hover:bg-[var(--vistral-blue-900)] transition-colors cursor-pointer"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Max price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Precio máximo (€/mes)
              </Label>
              <Input
                type="number"
                placeholder="Sin límite"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-8 text-xs md:text-xs"
                min={0}
              />
            </div>

            {/* Min bedrooms */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Habitaciones mínimas
              </Label>
              <Input
                type="number"
                placeholder="Cualquiera"
                value={minBedrooms}
                onChange={(e) => setMinBedrooms(e.target.value)}
                className="h-8 text-xs md:text-xs"
                min={0}
              />
            </div>

            {/* Rental type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Tipo de alquiler
              </Label>
              <Select
                value={rentalType || "__all__"}
                onValueChange={(v) => setRentalType(v === "__all__" ? "" : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos los tipos</SelectItem>
                  {rentalTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min sqm */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                m² mínimos
              </Label>
              <Input
                type="number"
                placeholder="Cualquiera"
                value={minSqm}
                onChange={(e) => setMinSqm(e.target.value)}
                className="h-8 text-xs md:text-xs"
                min={0}
              />
            </div>

            {/* Min bathrooms */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Baños mínimos
              </Label>
              <Input
                type="number"
                placeholder="Cualquiera"
                value={minBathrooms}
                onChange={(e) => setMinBathrooms(e.target.value)}
                className="h-8 text-xs md:text-xs"
                min={0}
              />
            </div>
          </div>

          {/* Smart defaults info + reset */}
          <div className="flex items-center justify-between pt-1 border-t border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)]">
            <p className="text-[11px] text-muted-foreground">
              {defaults.city
                ? `Sugerido: ${defaults.city}, ≤${defaults.maxPrice ?? "?"} €/mes, ≥${defaults.minBedrooms ?? "?"} hab., zona ${defaults.areaCluster ?? "N/A"}`
                : "Sin propiedades asociadas — mostrando todas las publicadas"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleResetFilters}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Restablecer
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {error && (
        <div className="rounded-[var(--vistral-radius-lg)] border border-[var(--vistral-danger)] bg-[var(--vistral-danger)]/10 p-4 text-center">
          <p className="text-sm text-[var(--vistral-danger)]">
            {error.message}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <RentalsHomeLoader />
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-[var(--vistral-radius-lg)] border border-dashed border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)] p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No se encontraron propiedades con estos filtros.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Prueba a ampliar los filtros o limpiarlos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <PropertySearchCard
              key={property.property_unique_id}
              property={property}
              onAdd={handleAdd}
              adding={addingId === property.property_unique_id}
            />
          ))}
        </div>
      )}
      </div>
      )}
    </div>
  );
}
