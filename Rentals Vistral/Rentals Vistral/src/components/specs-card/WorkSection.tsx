"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DocumentUploader } from "./DocumentUploader";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  type: string;
  label: string;
  required: boolean;
}

interface Section {
  id: string;
  title: string;
  instructions: string;
  required: boolean;
  fields: Field[];
}

interface WorkSectionProps {
  section: Section;
  formData: Record<string, any>;
  onFieldChange: (sectionId: string, fieldId: string, value: any) => void;
  onFieldErrorChange?: (sectionId: string, fieldId: string, error: string | null) => void;
  isAlternate: boolean;
}

export function WorkSection({
  section,
  formData,
  onFieldChange,
  onFieldErrorChange,
  isAlternate,
}: WorkSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isSectionComplete = section.fields.every((field) => {
    const value = formData[`${section.id}.${field.id}`];
    return value !== undefined && value !== null && value !== "";
  });

  const canCollapse = isSectionComplete;

  const validateField = (field: Field, value: any): string | null => {
    if (!field.required) return null;
    
    // Handle composite phone field
    if (field.type === "phone") {
      const phoneData = typeof value === 'object' && value !== null ? value : { prefix: '', number: '' };
      if (!phoneData.prefix || !phoneData.number) {
        return `${field.label} es obligatorio`;
      }
    } else {
      if (value === undefined || value === null || value === "" || 
          (Array.isArray(value) && value.length === 0)) {
        return `${field.label} es obligatorio`;
      }
    }

    switch (field.type) {
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Formato de email inválido";
        }
        break;
      case "phone":
        // Composite field validation: check both prefix and number
        const phoneData = typeof value === 'object' && value !== null ? value : { prefix: '', number: '' };
        const prefix = phoneData.prefix || '';
        const number = phoneData.number || '';
        
        // Must have country prefix
        if (!prefix || !prefix.startsWith('+')) {
          return "Debe seleccionar un prefijo de país";
        }
        
        // Country-specific validation based on prefix
        const prefixDigits = prefix.replace('+', '');
        let minDigits = 9; // Default for Spain
        if (prefixDigits === '34') {
          minDigits = 9; // Spain
        } else if (prefixDigits === '1') {
          minDigits = 10; // US/Canada
        } else if (prefixDigits === '44') {
          minDigits = 10; // UK
        }
        
        // Validate number length
        const numberDigits = number.replace(/\s/g, '');
        if (numberDigits.length < minDigits) {
          return `El número debe tener al menos ${minDigits} dígitos para ${prefix}`;
        }
        
        // Overall format validation
        if (!/^\d+$/.test(numberDigits)) {
          return "El número solo debe contener dígitos";
        }
        break;
      case "nif":
        if (!/^[0-9]{8}[A-Z]$/i.test(value)) {
          return "Formato de DNI/NIE inválido (8 dígitos + letra)";
        }
        break;
    }

    return null;
  };

  const handleBlur = (field: Field, fieldKey: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldKey));
    const value = formData[fieldKey];
    const error = validateField(field, value);
    setFieldErrors((prev) => ({
      ...prev,
      [fieldKey]: error || "",
    }));
    // Defer parent update to avoid updating during render
    if (onFieldErrorChange) {
      setTimeout(() => {
        onFieldErrorChange(section.id, field.id, error);
      }, 0);
    }
  };

  const handleFieldChange = (field: Field, fieldKey: string, newValue: any) => {
    onFieldChange(section.id, field.id, newValue);
    
    // Clear error if field becomes valid
    if (touchedFields.has(fieldKey)) {
      const error = validateField(field, newValue);
      setFieldErrors((prev) => ({
        ...prev,
        [fieldKey]: error || "",
      }));
      // Defer parent update to avoid updating during render
      if (onFieldErrorChange) {
        setTimeout(() => {
          onFieldErrorChange(section.id, field.id, error);
        }, 0);
      }
    }
  };

  const renderField = (field: Field) => {
    const fieldKey = `${section.id}.${field.id}`;
    let value = formData[fieldKey];
    
    // Handle phone field default value
    if (field.type === "phone" && (!value || typeof value === 'string')) {
      value = { prefix: '', number: '' };
    }
    
    const isTouched = touchedFields.has(fieldKey);
    const error = fieldErrors[fieldKey] || "";
    const hasError = isTouched && error;
    const isValid = isTouched && !error && value && 
      (field.type !== "phone" || (typeof value === 'object' && value.prefix && value.number));

    switch (field.type) {
      case "text":
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={fieldKey}>{field.label}</Label>
              {field.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <Input
              id={fieldKey}
              type="text"
              value={value ?? ""}
              onChange={(e) => handleFieldChange(field, fieldKey, e.target.value)}
              onBlur={() => handleBlur(field, fieldKey)}
              className={cn(
                hasError && "border-red-500",
                isValid && "border-green-500"
              )}
            />
            {hasError && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={fieldKey}>{field.label}</Label>
              {field.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <Textarea
              id={fieldKey}
              value={value ?? ""}
              onChange={(e) => handleFieldChange(field, fieldKey, e.target.value)}
              onBlur={() => handleBlur(field, fieldKey)}
              rows={3}
              className={cn(
                hasError && "border-red-500",
                isValid && "border-green-500"
              )}
            />
            {hasError && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        );

      case "number":
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={fieldKey}>{field.label}</Label>
              {field.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <Input
              id={fieldKey}
              type="number"
              value={value ?? ""}
              onChange={(e) => handleFieldChange(field, fieldKey, Number(e.target.value) || "")}
              onBlur={() => handleBlur(field, fieldKey)}
              min={0}
              className={cn(
                hasError && "border-red-500",
                isValid && "border-green-500"
              )}
            />
            {hasError && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        );

      case "email":
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={fieldKey}>{field.label}</Label>
              {field.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <Input
              id={fieldKey}
              type="email"
              value={value ?? ""}
              onChange={(e) => handleFieldChange(field, fieldKey, e.target.value)}
              onBlur={() => handleBlur(field, fieldKey)}
              className={cn(
                hasError && "border-red-500",
                isValid && "border-green-500"
              )}
            />
            {hasError && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        );

      case "phone":
        // Composite Field: Part A (Country Prefix) + Part B (Number)
        const phoneValue = typeof value === 'object' && value !== null ? value : { prefix: '', number: '' };
        const currentPrefix = phoneValue.prefix || '';
        const currentNumber = phoneValue.number || '';
        
        const countryOptions = [
          { value: '+34', label: '🇪🇸 +34 (España)', minDigits: 9 },
          { value: '+1', label: '🇺🇸 +1 (US/Canadá)', minDigits: 10 },
          { value: '+44', label: '🇬🇧 +44 (Reino Unido)', minDigits: 10 },
          { value: '+33', label: '🇫🇷 +33 (Francia)', minDigits: 9 },
          { value: '+49', label: '🇩🇪 +49 (Alemania)', minDigits: 10 },
        ];
        
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{field.label}</Label>
              {field.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {/* Part A: Country Flag/Prefix Select */}
              <Select
                value={currentPrefix || ""}
                onValueChange={(prefix) => {
                  handleFieldChange(field, fieldKey, { prefix, number: currentNumber });
                }}
              >
                <SelectTrigger className={cn(
                  "w-[180px]",
                  hasError && "border-red-500",
                  isValid && "border-green-500"
                )}>
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Part B: Number Input */}
              <Input
                id={fieldKey}
                type="tel"
                value={currentNumber}
                onChange={(e) => {
                  const numberValue = e.target.value.replace(/\D/g, ''); // Only digits
                  handleFieldChange(field, fieldKey, { prefix: currentPrefix, number: numberValue });
                }}
                onBlur={() => handleBlur(field, fieldKey)}
                placeholder={currentPrefix ? `Número (${countryOptions.find(o => o.value === currentPrefix)?.minDigits || 9} dígitos)` : "Selecciona país primero"}
                disabled={!currentPrefix}
                className={cn(
                  "flex-1",
                  hasError && "border-red-500",
                  isValid && "border-green-500"
                )}
              />
            </div>
            {hasError && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        );

      case "nif":
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={fieldKey}>{field.label}</Label>
              {field.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <Input
              id={fieldKey}
              type="text"
              value={value ?? ""}
              onChange={(e) => handleFieldChange(field, fieldKey, e.target.value)}
              onBlur={() => handleBlur(field, fieldKey)}
              placeholder="12345678A"
              maxLength={9}
              className={cn(
                hasError && "border-red-500",
                isValid && "border-green-500"
              )}
            />
            {hasError && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        );

      case "date":
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={fieldKey}>{field.label}</Label>
              {field.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <Input
              id={fieldKey}
              type="date"
              value={value ?? ""}
              onChange={(e) => handleFieldChange(field, fieldKey, e.target.value)}
              onBlur={() => handleBlur(field, fieldKey)}
              className={cn(
                hasError && "border-red-500",
                isValid && "border-green-500"
              )}
            />
            {hasError && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{field.label}</Label>
              {field.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <Select
              value={value && value !== '' ? String(value) : ""}
              onValueChange={(val) => handleFieldChange(field, fieldKey, val)}
            >
              <SelectTrigger
                className={cn(
                  hasError && "border-red-500",
                  isValid && "border-green-500"
                )}
              >
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Opción 1</SelectItem>
                <SelectItem value="option2">Opción 2</SelectItem>
                <SelectItem value="option3">Opción 3</SelectItem>
              </SelectContent>
            </Select>
            {hasError && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        );

      case "currency":
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={fieldKey}>{field.label}</Label>
              {field.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                €
              </span>
              <Input
                id={fieldKey}
                type="number"
                value={value ?? ""}
                onChange={(e) => handleFieldChange(field, fieldKey, e.target.value)}
                onBlur={() => handleBlur(field, fieldKey)}
                className={cn(
                  "pl-8",
                  hasError && "border-red-500",
                  isValid && "border-green-500"
                )}
                step="0.01"
                min="0"
              />
            </div>
            {hasError && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        );

      case "checklist":
        const checklistItems = [
          "Verificación de documentos",
          "Validación de datos",
          "Revisión de contactos",
        ];
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{field.label}</Label>
              {field.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <div className="space-y-2">
              {checklistItems.map((item, idx) => {
                const itemKey = `${fieldKey}_${idx}`;
                const checked = formData[itemKey] || false;
                return (
                  <div 
                    key={idx} 
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={itemKey}
                      checked={checked}
                      onCheckedChange={(checkedValue) => {
                        // Directly update formData with the correct itemKey
                        onFieldChange(section.id, `${field.id}_${idx}`, checkedValue);
                      }}
                      className="cursor-pointer"
                    />
                    <Label
                      htmlFor={itemKey}
                      className="cursor-pointer text-sm font-normal flex-1 select-none"
                    >
                      {item}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "document":
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{field.label}</Label>
              {field.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <DocumentUploader
              value={value}
              onChange={(files) => handleFieldChange(field, fieldKey, files)}
            />
            {hasError && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      id={`section-${section.id}`}
      className={cn(
        "border-gray-200 shadow-sm",
        isAlternate && "bg-blue-50/30"
      )}
    >
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-100/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">
                {section.title}
              </h3>
              {section.required && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  (Obligatorio)
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-600">{section.instructions}</p>
          </div>
          {canCollapse && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          <div className="space-y-4">{section.fields.map(renderField)}</div>
        </div>
      )}
    </Card>
  );
}
