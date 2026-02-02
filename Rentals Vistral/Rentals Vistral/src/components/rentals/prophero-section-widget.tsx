"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { PropheroSectionReview } from "@/lib/supabase/types";

interface PropheroSectionWidgetProps {
  id: string;
  title: string;
  required?: boolean;
  isComplete: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
  hasData: boolean; // Si la sección tiene datos para revisar
  reviewState?: PropheroSectionReview | null;
  onReviewChange?: (isCorrect: boolean | null) => void;
  onCommentsChange?: (comments: string) => void;
  onMarkComplete?: () => void;
}

export function PropheroSectionWidget({
  id,
  title,
  required = false,
  isComplete,
  children,
  defaultOpen = false,
  hasData = false,
  reviewState,
  onReviewChange,
  onCommentsChange,
  onMarkComplete,
}: PropheroSectionWidgetProps) {
  // Por defecto, cuando no hay reviewState, todas las secciones deben estar desplegadas
  // Si respondió "Sí", se recoge automáticamente
  // Si respondió "No", permanece desplegada para permitir edición
  const hasReviewState = reviewState !== null && reviewState !== undefined;
  const isCorrect = reviewState?.isCorrect ?? null;
  
  // Lógica de apertura/cierre:
  // - Si no hay reviewState: desplegada (por defecto)
  // - Si respondió "Sí": recogida (información correcta, no necesita edición)
  // - Si respondió "No" o no está revisada: desplegada (permite edición)
  const shouldBeOpen = !hasReviewState || isCorrect !== true;
  const [isOpen, setIsOpen] = useState(shouldBeOpen);
  
  // Actualizar estado cuando cambia shouldBeOpen
  useEffect(() => {
    setIsOpen(shouldBeOpen);
  }, [shouldBeOpen]);
  
  const isReviewed = reviewState?.reviewed ?? false;
  const comments = reviewState?.comments ?? "";
  
  // Determinar si los campos deben estar deshabilitados:
  // - Si no hay reviewState: deshabilitados (no se puede editar hasta responder)
  // - Si respondió "Sí": deshabilitados (la información es correcta)
  // - Si respondió "No": habilitados (se puede editar para corregir)
  // - Si está completada pero respondió "No": sigue habilitada para permitir correcciones
  const fieldsDisabled = !hasReviewState || (isCorrect === true);
  
  // Mostrar pregunta de revisión siempre para secciones de Prophero
  // La pregunta debe aparecer siempre que la sección tenga campos para revisar,
  // independientemente de si tienen valores o no
  const showReviewQuestion = true;
  
  // Mostrar comentarios si isCorrect = false o si hay comentarios guardados
  // También mostrar cuando está completada y respondió Sí (para mostrar los comentarios históricos)
  const showComments = isCorrect === false || (comments && comments.trim().length > 0);
  
  // Determinar si los comentarios deben estar deshabilitados:
  // - Si respondió "Sí": deshabilitados (solo lectura)
  // - En cualquier otro caso: habilitados (se pueden editar)
  const commentsDisabled = isCorrect === true;
  
  // Mostrar botón de "Guardar Correcciones y Validar" solo cuando la respuesta es No
  // Cuando la respuesta es Sí, la sección ya está completa y no necesita el botón
  const showCompleteButton = isCorrect === false;

  return (
    <Card
      id={`section-${id}`}
      className={cn(
        "border transition-all shadow-sm",
        isComplete
          ? "border-gray-200 bg-white"
          : required
          ? "border-orange-200 bg-orange-50/20"
          : "border-gray-200 bg-white"
      )}
    >
      <Accordion
        type="single"
        collapsible
        value={isOpen ? id : ""}
        onValueChange={(value) => setIsOpen(value === id)}
      >
        <AccordionItem value={id} className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3 flex-1 text-left">
              {isComplete ? (
                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 border border-gray-300 flex-shrink-0">
                  <Check className="h-3 w-3 text-green-600 stroke-[2.5]" />
                </div>
              ) : required ? (
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              ) : null}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                {required && !isComplete && (
                  <p className="text-xs text-orange-600 mt-0.5">Información requerida pendiente</p>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2 space-y-4">
              {/* Renderizar children - los campos individuales manejan su propio disabled */}
              {children}
              
              {/* Pregunta de revisión - siempre visible cuando hay datos */}
              {showReviewQuestion && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Label className="text-sm font-medium">
                    ¿Es correcta esta información?
                  </Label>
                  <RadioGroup
                    value={isCorrect === null ? "" : isCorrect ? "yes" : "no"}
                    onValueChange={(value) => {
                      // Prevenir cualquier comportamiento por defecto que pueda causar reload
                      // Solo permitir cambiar la respuesta si isCorrect === true (Sí) o es null (sin respuesta)
                      // Si isCorrect === false (No), no se puede modificar hasta guardar correcciones
                      if (isCorrect === false) return;
                      
                      if (value === "yes") {
                        onReviewChange?.(true);
                      } else if (value === "no") {
                        onReviewChange?.(false);
                      }
                    }}
                    className="flex gap-6"
                    disabled={isCorrect === false}
                    onPointerDown={(e) => {
                      // Prevenir que el evento se propague y cause un reload
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id={`${id}-yes`} />
                      <Label htmlFor={`${id}-yes`} className="font-normal cursor-pointer">
                        Sí
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id={`${id}-no`} />
                      <Label htmlFor={`${id}-no`} className="font-normal cursor-pointer">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              
              {/* Sección de comentarios cuando isCorrect = false o cuando está completada con Sí */}
              {showComments && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Label htmlFor={`${id}-comments`} className="text-sm font-medium">
                    Comentarios sobre los problemas encontrados
                  </Label>
                  <Textarea
                    id={`${id}-comments`}
                    placeholder="Describe qué problemas hay con esta información..."
                    value={comments}
                    onChange={(e) => onCommentsChange?.(e.target.value)}
                    disabled={commentsDisabled}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}
              
              {/* Botón para guardar correcciones y validar - visible cuando hay una respuesta (Sí o No) y no está completada */}
              {showCompleteButton && (
                <div className="pt-2">
                  <Button
                    onClick={onMarkComplete}
                    className="w-full"
                    variant="default"
                  >
                    Guardar Correcciones y Validar
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
