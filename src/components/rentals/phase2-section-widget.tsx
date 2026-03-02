"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Lock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Phase2SectionWidgetProps {
  id: string;
  title: string;
  instructions?: string; // Descripción breve de la sección
  required?: boolean;
  isComplete: boolean;
  isBlocked?: boolean; // Si está bloqueada (Sección 4)
  children: React.ReactNode;
}

export function Phase2SectionWidget({
  id,
  title,
  instructions,
  required = false,
  isComplete,
  isBlocked = false,
  children,
}: Phase2SectionWidgetProps) {
  // Track if we've initialized to prevent auto-collapse when completion changes later
  const hasInitializedCollapse = useRef(false);
  const prevIsCompleteRef = useRef<boolean | undefined>(undefined);
  
  // Initialize collapse state: closed if completed, open if not
  // Use lazy initialization to capture the initial isComplete value
  const [isOpen, setIsOpen] = useState(() => {
    // Store the initial value
    prevIsCompleteRef.current = isComplete;
    // Return the inverse: collapsed if complete, expanded if not
    return !isComplete;
  });
  
  // Initialize collapse state; do NOT auto-collapse when section becomes complete
  // (user wants color change + collapse enabled, but section stays expanded)
  useEffect(() => {
    if (!hasInitializedCollapse.current) {
      hasInitializedCollapse.current = true;
      prevIsCompleteRef.current = isComplete;
      return;
    }
    prevIsCompleteRef.current = isComplete;
  }, [isComplete]);
  
  const getSectionColorClasses = () => {
    if (isBlocked) {
      return "border-gray-300 bg-gray-50 dark:bg-gray-900/50";
    }
    if (isComplete) {
      return "border-green-200 bg-green-50/30 dark:bg-green-900/10";
    }
    return "border-gray-200 bg-white dark:bg-gray-800";
  };

  // Si está completa, usar accordion para poder colapsar/expandir
  if (isComplete && !isBlocked) {
    return (
      <div id={`section-${id}`}>
        <Card
          className={cn(
            "border transition-all shadow-sm",
            getSectionColorClasses()
          )}
        >
          {/* Título y descripción - dentro del Card */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
                {instructions && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {instructions}
                  </p>
                )}
              </div>
              {isComplete && (
                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 border border-gray-300 flex-shrink-0 mt-0.5 ml-3">
                  <Check className="h-3 w-3 text-green-600 stroke-[2.5]" />
                </div>
              )}
            </div>
          </div>

          {/* Línea de separación */}
          <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />

          {/* Accordion para los campos */}
          <Accordion
            type="single"
            collapsible
            value={isOpen ? id : ""}
            onValueChange={(value) => setIsOpen(value === id)}
          >
            <AccordionItem value={id} className="border-none">
              <AccordionTrigger className={cn(
                "px-4 py-3 hover:no-underline relative",
                isOpen ? "justify-end" : "justify-between"
              )}>
                {!isOpen && (
                  <span className="text-sm text-muted-foreground absolute inset-0 flex items-center justify-center pointer-events-none">Ver campos</span>
                )}
                {!isOpen && <span className="invisible">placeholder</span>}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {children}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    );
  }

  // Si no está completa o está bloqueada, mostrar siempre expandido
  return (
    <div id={`section-${id}`}>
      <Card
        className={cn(
          "border transition-all shadow-sm",
          getSectionColorClasses(),
          isBlocked && "opacity-60"
        )}
      >
        {/* Título y descripción - dentro del Card */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            {isBlocked && (
              <Lock className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={cn(
                "text-base font-semibold",
                isBlocked ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
              )}>
                {title}
              </h3>
              {instructions && (
                <p className={cn(
                  "text-sm mt-1",
                  isBlocked ? "text-gray-400 dark:text-gray-500" : "text-muted-foreground"
                )}>
                  {instructions}
                </p>
              )}
              {isBlocked && (
                <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                  Completa las secciones anteriores para continuar
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Línea de separación */}
        <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />

        {/* Campos */}
        <div className="px-4 py-4">
          {isBlocked ? (
            <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Esta sección está bloqueada hasta que completes las secciones anteriores.
            </div>
          ) : (
            <div className="space-y-4">
              {children}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
