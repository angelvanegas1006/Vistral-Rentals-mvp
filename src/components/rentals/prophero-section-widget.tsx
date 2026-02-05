"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Check, Eye } from "lucide-react";
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
}: PropheroSectionWidgetProps) {
  // Por defecto, cuando no hay reviewState, todas las secciones deben estar desplegadas
  // Si respondió "Sí", se recoge automáticamente
  // Si respondió "No", permanece desplegada para permitir edición
  const hasReviewState = reviewState !== null && reviewState !== undefined;
  const isCorrect = reviewState?.isCorrect ?? null;
  
  // Estabilizar el valor del RadioGroup para evitar re-renderizados innecesarios
  const radioValue = useMemo(() => {
    if (isCorrect === null) return "";
    return isCorrect ? "yes" : "no";
  }, [isCorrect]);
  
  // Usar un estado local para el RadioGroup que se sincroniza con el prop
  // Inicializar con el valor actual para evitar desincronización
  const [localRadioValue, setLocalRadioValue] = useState(() => radioValue);
  const previousRadioValueRef = useRef(radioValue);
  const lastUserActionRef = useRef<number>(0); // Timestamp del último cambio del usuario
  const isUserInteractingRef = useRef(false); // Flag para indicar si el usuario está interactuando
  const pendingUserValueRef = useRef<string | null>(null); // Valor que el usuario quiere establecer
  
  // Sincronizar el estado local solo cuando el prop cambia realmente
  // Esto evita que el RadioGroup se "buggee" cuando hay actualizaciones rápidas
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUserAction = now - lastUserActionRef.current;
    
    // Si el usuario está interactuando (cambio reciente, menos de 500ms), NO sincronizar con el prop
    // Esto previene que el useEffect sobrescriba el estado local durante cambios rápidos
    if (isUserInteractingRef.current && timeSinceLastUserAction < 500) {
      // Si el prop ya refleja el valor que el usuario seleccionó, confirmar y resetear
      if (radioValue === pendingUserValueRef.current || radioValue === localRadioValue) {
        isUserInteractingRef.current = false;
        pendingUserValueRef.current = null;
        previousRadioValueRef.current = radioValue;
        return;
      }
      // El prop aún no refleja el valor del usuario, mantener el estado local
      return;
    }
    
    // Si pasó suficiente tiempo desde el último cambio del usuario, resetear el flag
    if (isUserInteractingRef.current && timeSinceLastUserAction >= 500) {
      isUserInteractingRef.current = false;
      pendingUserValueRef.current = null;
    }
    
    // Sincronizar con el prop solo si cambió y el usuario no está interactuando
    if (previousRadioValueRef.current !== radioValue && !isUserInteractingRef.current) {
      previousRadioValueRef.current = radioValue;
      // Solo actualizar si el valor realmente cambió para evitar parpadeos
      setLocalRadioValue((prev) => {
        if (prev !== radioValue) {
          return radioValue;
        }
        return prev;
      });
    }
  }, [radioValue, localRadioValue]);
  
  // Lógica de apertura/cierre según la especificación:
  // - Secciones con "Sí" (isCorrect === true): COLAPSADAS
  // - Secciones con "No" (isCorrect === false): DESPLEGADAS
  // - Secciones reseteadas (isCorrect === null con submittedComments): DESPLEGADAS
  // - Secciones sin revisar (isCorrect === null sin submittedComments): DESPLEGADAS
  const shouldBeOpen = isCorrect !== true; // Solo colapsar si es "Sí"
  const [isOpen, setIsOpen] = useState(shouldBeOpen);
  const previousShouldBeOpenRef = useRef(shouldBeOpen);
  const isAccordionControlledRef = useRef(false); // Flag para saber si el usuario controló el accordion
  
  // Actualizar estado cuando cambia shouldBeOpen
  // Forzar colapsar si es "Sí" y desplegar en cualquier otro caso
  // Pero respetar si el usuario está interactuando con el radio
  useEffect(() => {
    // Si el usuario está interactuando con el radio, esperar un poco antes de cambiar el accordion
    if (isUserInteractingRef.current) {
      const timeoutId = setTimeout(() => {
        if (previousShouldBeOpenRef.current !== shouldBeOpen) {
          previousShouldBeOpenRef.current = shouldBeOpen;
          setIsOpen(shouldBeOpen);
          isAccordionControlledRef.current = false;
        }
      }, 100); // Pequeño delay para permitir que el estado se estabilice
      
      return () => clearTimeout(timeoutId);
    }
    
    // Si no está interactuando, actualizar inmediatamente
    if (previousShouldBeOpenRef.current !== shouldBeOpen) {
      previousShouldBeOpenRef.current = shouldBeOpen;
      setIsOpen(shouldBeOpen);
      isAccordionControlledRef.current = false;
    }
  }, [shouldBeOpen]);
  
  const isReviewed = reviewState?.reviewed ?? false;
  const submittedComments = reviewState?.submittedComments;
  const hasSubmittedComments = !!submittedComments;
  
  // Detectar si la sección fue reseteada:
  // 1. Si isCorrect === null y reviewed === false: está reseteada actualmente
  // 2. Si tiene submittedComments pero isCorrect === null: fue reseteada (tiene historial pero está pendiente de revisión)
  const isCurrentlyReset = isCorrect === null && isReviewed === false;
  // Sección reseteada: tiene submittedComments pero isCorrect === null (fue actualizada y necesita revisión)
  const isResetSection = hasSubmittedComments && isCorrect === null;
  const wasReset = isCurrentlyReset || isResetSection;
  
  // Si la sección fue reseteada (actualmente o fue reseteada y luego marcada como "No"),
  // usar comments editables, no submittedComments
  // Si hay submittedComments y la sección NO fue reseteada y NO está marcada como "No", usar esos (snapshot)
  const useSubmittedComments = hasSubmittedComments && !wasReset && isCorrect !== false;
  const comments = useSubmittedComments ? submittedComments : (reviewState?.comments ?? "");
  
  // Mostrar pregunta de revisión siempre para secciones de Prophero
  // La pregunta debe aparecer siempre que la sección tenga campos para revisar,
  // independientemente de si tienen valores o no
  const showReviewQuestion = true;
  
  // Mostrar comentarios solo si isCorrect = false
  // Si se marca "Sí", no se muestran los comentarios aunque existan
  const showComments = isCorrect === false;
  
  // Los comentarios siempre están habilitados para edición
  const commentsDisabled = false;

  // Determinar color según el estado de la sección:
  // - Sección con "No" (isCorrect === false) y no reseteada: Color naranja
  // - Sección reseteada (isCorrect === null con submittedComments): Color azul claro
  // - Sección con isCorrect === null (pendiente de revisión): Color azul muy suave
  // - Sección con "Sí": Color normal
  const getSectionColorClasses = () => {
    if (isCorrect === false && !isResetSection) {
      // Sección con "No" y no reseteada: Color naranja
      return "border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800/30";
    } else if (isResetSection) {
      // Sección reseteada: Color azul claro
      return "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800/30";
    } else if (isCorrect === null) {
      // Sección pendiente de revisión (isCorrect === null): Color azul muy suave
      return "border-blue-100 bg-blue-50/30 dark:bg-blue-950/10 dark:border-blue-800/20";
    } else {
      // Color normal (blanco/gris) - cuando isCorrect === true
      return "border-gray-200 bg-white dark:bg-[var(--prophero-gray-900)]";
    }
  };

  return (
    <Card
      id={`section-${id}`}
      className={cn(
        "border transition-all shadow-sm",
        getSectionColorClasses()
      )}
    >
      <Accordion
        type="single"
        collapsible
        value={isOpen ? id : ""}
        onValueChange={(value) => {
          // Solo permitir control manual si no estamos en medio de un cambio de radio
          if (!isUserInteractingRef.current) {
            setIsOpen(value === id);
            isAccordionControlledRef.current = true;
          }
        }}
      >
        <AccordionItem value={id} className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3 flex-1 text-left">
              {isComplete ? (
                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 border border-gray-300 flex-shrink-0">
                  <Check className="h-3 w-3 text-green-600 stroke-[2.5]" />
                </div>
              ) : required ? (
                isCorrect === null ? (
                  <Eye className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                )
              ) : null}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                {required && !isComplete && (
                  <p className={cn(
                    "text-xs mt-0.5",
                    isCorrect === null 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-orange-600 dark:text-orange-400"
                  )}>
                    {isCorrect === null ? "Pendiente de revisión" : "Pendiente de corrección"}
                  </p>
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
                    value={localRadioValue}
                    onValueChange={(value) => {
                      // Prevenir actualizaciones si el valor es el mismo (evita loops)
                      if (localRadioValue === value) return;
                      
                      // Marcar que el usuario está interactuando ANTES de cualquier actualización
                      isUserInteractingRef.current = true;
                      lastUserActionRef.current = Date.now();
                      pendingUserValueRef.current = value;
                      
                      // Actualizar estado local inmediatamente para feedback visual instantáneo
                      setLocalRadioValue(value);
                      
                      // Llamar al callback de forma asíncrona para evitar bloqueos
                      // Usar requestAnimationFrame para asegurar que el renderizado se complete primero
                      requestAnimationFrame(() => {
                        if (value === "yes") {
                          onReviewChange?.(true);
                        } else if (value === "no") {
                          onReviewChange?.(false);
                        }
                      });
                    }}
                    className="flex gap-6"
                    onPointerDown={(e) => {
                      // Prevenir que el evento se propague y cause un reload
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      // Prevenir propagación adicional
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
              
              {/* Sección de comentarios cuando isCorrect = false */}
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
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
