"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { PropertyData } from "@/lib/supply-property-storage";

interface UseFormStateProps<T> {
  initialData: T;
  onUpdate: (data: Partial<T>) => void;
}

interface UseFormStateReturn<T> {
  formData: T;
  hasChanges: boolean;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  updateFields: (fields: Partial<T>) => void;
  resetForm: () => void;
  markAsChanged: () => void;
  markAsSaved: () => void;
}

export function useFormState<T extends Record<string, any>>({
  initialData,
  onUpdate,
}: UseFormStateProps<T>): UseFormStateReturn<T> {
  const [formData, setFormData] = useState<T>(initialData);
  const [hasChanges, setHasChanges] = useState(false);
  const isMountedRef = useRef(false);
  const previousDataRef = useRef<T>(initialData);
  const onUpdateRef = useRef(onUpdate);

  // Keep onUpdateRef in sync
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Sync formData when initialData changes from parent (but not from user changes)
  useEffect(() => {
    if (JSON.stringify(previousDataRef.current) !== JSON.stringify(initialData)) {
      setFormData(initialData);
      previousDataRef.current = initialData;
      setHasChanges(false);
    }
  }, [initialData]);

  // Update local form state
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const updateFields = useCallback((fields: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...fields }));
    setHasChanges(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    previousDataRef.current = initialData;
    setHasChanges(false);
  }, [initialData]);

  const markAsChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  const markAsSaved = useCallback(() => {
    setHasChanges(false);
  }, []);

  // Sync with parent when form data changes
  useEffect(() => {
    // Skip update on initial mount
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      previousDataRef.current = formData;
      return;
    }
    
    // Calculate if there are changes by comparing with previous reference
    const hasActualChanges = JSON.stringify(formData) !== JSON.stringify(previousDataRef.current);
    
    // Only update parent if data actually changed
    if (hasActualChanges) {
      previousDataRef.current = formData;
      onUpdateRef.current(formData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // Calculate if form has changes compared to initial data
  const hasFormChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  return {
    formData,
    hasChanges: hasChanges || hasFormChanges,
    updateField,
    updateFields,
    resetForm,
    markAsChanged,
    markAsSaved,
  };
}
