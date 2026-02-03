"use client";

import { useState } from "react";
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
  const [isOpen, setIsOpen] = useState(!isComplete); // Abierto por defecto si no está completa
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
      <div id={`section-${id}`} className="space-y-4">
        {/* Título y descripción - fuera del Card */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 border border-gray-300 flex-shrink-0">
              <Check className="h-3 w-3 text-green-600 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
          {instructions && (
            <p className="text-sm text-muted-foreground ml-8">
              {instructions}
            </p>
          )}
        </div>

        {/* Línea de separación */}
        <div className="border-b border-gray-200 dark:border-gray-700" />

        {/* Card con accordion para los campos */}
        <Card
          className={cn(
            "border transition-all shadow-sm",
            getSectionColorClasses()
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
                <span className="text-sm text-muted-foreground">Ver campos</span>
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
    <div id={`section-${id}`} className="space-y-4">
      {/* Título y descripción - fuera del Card */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          {isBlocked && (
            <Lock className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
          )}
          <h3 className={cn(
            "text-base font-semibold",
            isBlocked ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
          )}>
            {title}
          </h3>
        </div>
        {instructions && (
          <p className={cn(
            "text-sm",
            isBlocked ? "text-gray-400 dark:text-gray-500 ml-8" : "text-muted-foreground ml-8"
          )}>
            {instructions}
          </p>
        )}
        {isBlocked && (
          <p className="text-xs mt-2 text-gray-500 dark:text-gray-400 ml-8">
            Completa las secciones anteriores para continuar
          </p>
        )}
      </div>

      {/* Línea de separación */}
      <div className="border-b border-gray-200 dark:border-gray-700" />

      {/* Card con los campos */}
      <Card
        className={cn(
          "border transition-all shadow-sm",
          getSectionColorClasses(),
          isBlocked && "opacity-60"
        )}
      >
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
