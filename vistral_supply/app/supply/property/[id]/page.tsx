"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef, use } from "react";
import { PropertyDetailPage } from "@/components/supply/property/property-detail-page";
import { getPropertyWithUsers } from "@/lib/supply-property-supabase";
import { getCurrentPropertyChecklist, checklistRowToChecklistData } from "@/lib/supply-checklist-supabase";
import { ChecklistData } from "@/lib/supply-checklist-storage";
import { useI18n } from "@/lib/i18n";
import { PropertyWithUsers } from "@/lib/supply-property-supabase";

export default function PropertyDetailPageRoute() {
  const paramsPromise = useParams();
  const params = paramsPromise instanceof Promise ? use(paramsPromise) : paramsPromise;
  const { t } = useI18n();
  const [property, setProperty] = useState<PropertyWithUsers | null>(null);
  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const tRef = useRef(t);
  
  // Extract propertyId as string to avoid unnecessary useCallback recreation
  const propertyId = typeof params.id === 'string' ? params.id : params.id?.[0] || null;
  const propertyIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  
  // Keep t reference up to date
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const loadProperty = useCallback(async () => {
    const currentPropertyId = propertyId;
    if (!currentPropertyId) {
      setError("Property ID is required");
      setIsLoading(false);
      setIsInitialLoad(false);
      return;
    }

    // Prevent duplicate loads for the same property ID
    if (propertyIdRef.current === currentPropertyId && isLoadingRef.current) {
      return;
    }
    
    // Prevent loading if already loading the same property
    if (isLoadingRef.current) {
      return;
    }

    propertyIdRef.current = currentPropertyId;
    isLoadingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      // Load property and checklist in parallel for better performance
      const [propertyData, checklistData] = await Promise.all([
        getPropertyWithUsers(currentPropertyId).catch((err) => {
          console.error("Error loading property:", err);
          throw err;
        }),
        getCurrentPropertyChecklist(currentPropertyId).catch((checklistError) => {
          console.error("Error loading checklist:", checklistError);
          // Checklist is optional, return null if it fails
          return null;
        }),
      ]);

      if (!propertyData) {
        setError(tRef.current.messages.notFound);
        setIsLoading(false);
        setIsInitialLoad(false);
        isLoadingRef.current = false;
        return;
      }

      setProperty(propertyData);
      setChecklist(checklistData ? checklistRowToChecklistData(checklistData) : null);
    } catch (err) {
      console.error("Error loading property:", err);
      setError(err instanceof Error ? err.message : tRef.current.messages.error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
      isLoadingRef.current = false;
    }
  }, [propertyId, isInitialLoad]);

  // Initial load - only when propertyId changes
  useEffect(() => {
    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]); // Only depend on propertyId, not loadProperty

  // Reload data when page becomes visible (user returns from edit page)
  // Only reload if initial load is complete to avoid infinite loops
  useEffect(() => {
    if (isInitialLoad || !propertyId) return; // Don't set up listeners until initial load is done

    let timeoutId: NodeJS.Timeout | null = null;
    let lastReloadTime = 0;
    const RELOAD_COOLDOWN = 5000; // Increased to 5 seconds to reduce unnecessary reloads
    let wasHidden = false;
    const currentPropertyId = propertyId;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true;
        return;
      }
      
      if (document.visibilityState === 'visible' && wasHidden) {
        const now = Date.now();
        // Only reload if enough time has passed since last reload
        if (now - lastReloadTime > RELOAD_COOLDOWN) {
          // Clear any pending timeout
          if (timeoutId) clearTimeout(timeoutId);
          
          // Small delay to ensure any pending updates are saved
          timeoutId = setTimeout(() => {
            lastReloadTime = Date.now();
            wasHidden = false;
            // Only reload if propertyId hasn't changed
            if (propertyId === currentPropertyId && !isLoadingRef.current) {
              loadProperty();
            }
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // Only depend on isInitialLoad and propertyId, not loadProperty to avoid re-creating listener
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialLoad, propertyId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-[#2050F6] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-lg font-medium text-[#212121] dark:text-white">{t.messages.loading}</div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium mb-2 text-destructive">{error || t.messages.notFound}</div>
        </div>
      </div>
    );
  }

  return <PropertyDetailPage property={property} checklist={checklist} />;
}
