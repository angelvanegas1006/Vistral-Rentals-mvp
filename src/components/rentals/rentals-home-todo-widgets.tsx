"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface RentalsHomeTodoWidgetsProps {
  propertiesByPhase?: Record<string, any[]>;
}

interface TodoWidget {
  id: string;
  title: string;
  count: number;
  properties: any[];
  phaseFilter?: string[];
  onClick?: () => void;
}

export function RentalsHomeTodoWidgets({
  propertiesByPhase,
}: RentalsHomeTodoWidgetsProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  // Toggle item en mobile
  const toggleItem = (id: string) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenItems(newOpen);
  };

  // Calcular widgets basados en propiedades
  const todoWidgets = useMemo(() => {
    // Propiedades del kanban como datos dummy
    const mockProperties = [
      // Revisar documentación - propiedades de diferentes fases
      {
        id: "PROP-001",
        property_unique_id: "PROP-001",
        address: "Calle Gran Vía 45, 3º B",
        city: "Madrid",
        region: "Madrid",
        propertyType: "light",
      },
      {
        id: "PROP-002",
        property_unique_id: "PROP-002",
        address: "Avenida de la Paz 12, 1º A",
        city: "Barcelona",
        region: "Barcelona",
        propertyType: "medium",
      },
      {
        id: "PROP-010",
        property_unique_id: "PROP-010",
        address: "Avenida Diagonal 200, 6º",
        city: "Barcelona",
        region: "Barcelona",
        propertyType: "major",
      },
      // Pendiente subir a idealista - propiedades listas para alquilar
      {
        id: "PROP-004",
        property_unique_id: "PROP-004",
        address: "Calle Serrano 28, 4º D",
        city: "Madrid",
        region: "Madrid",
        propertyType: "light",
      },
      {
        id: "PROP-101",
        property_unique_id: "PROP-101",
        address: "Calle Mayor 15, 2º A",
        city: "Madrid",
        region: "Madrid",
        propertyType: "light",
      },
      {
        id: "PROP-102",
        property_unique_id: "PROP-102",
        address: "Avenida de América 45, 4º B",
        city: "Madrid",
        region: "Madrid",
        propertyType: "medium",
      },
      // Pendiente subir a finaer
      {
        id: "PROP-006",
        property_unique_id: "PROP-006",
        address: "Calle Alcalá 100, 5º E",
        city: "Madrid",
        region: "Madrid",
        propertyType: "medium",
      },
      {
        id: "PROP-103",
        property_unique_id: "PROP-103",
        address: "Calle Princesa 88, 1º C",
        city: "Madrid",
        region: "Madrid",
        propertyType: "light",
      },
      {
        id: "PROP-106",
        property_unique_id: "PROP-106",
        address: "Calle Velázquez 50, 2º E",
        city: "Madrid",
        region: "Madrid",
        propertyType: "light",
      },
      // Necesita actualizacion IPC - propiedades del kanban de cartera
      {
        id: "PROP-104",
        property_unique_id: "PROP-104",
        address: "Calle Goya 30, 3º D",
        city: "Madrid",
        region: "Madrid",
        propertyType: "light",
      },
      {
        id: "PROP-105",
        property_unique_id: "PROP-105",
        address: "Avenida de la Castellana 200, 5º",
        city: "Madrid",
        region: "Madrid",
        propertyType: "medium",
      },
      {
        id: "PROP-107",
        property_unique_id: "PROP-107",
        address: "Calle Serrano 120, 4º F",
        city: "Madrid",
        region: "Madrid",
        propertyType: "medium",
      },
    ];

    // Widget 1: Revisar documentación
    const reviewDocumentation = mockProperties.slice(0, 3);

    // Widget 2: Pendiente subir a idealista
    const pendingIdealista = mockProperties.slice(3, 6);

    // Widget 3: Pendiente subir a finaer
    const pendingFinaer = mockProperties.slice(6, 9);

    // Widget 4: Necesita actualizacion IPC
    const needsIpcUpdate = mockProperties.slice(9, 12);

    const widgets: TodoWidget[] = [
      {
        id: "widget-review-documentation",
        title: "Revisar documentación",
        count: reviewDocumentation.length,
        properties: reviewDocumentation,
        onClick: () => {
          router.push("/rentals/kanban");
        },
      },
      {
        id: "widget-pending-idealista",
        title: "Pendiente subir a idealista",
        count: pendingIdealista.length,
        properties: pendingIdealista,
        onClick: () => {
          router.push("/rentals/kanban?phase=ready");
        },
      },
      {
        id: "widget-pending-finaer",
        title: "Pendiente subir a finaer",
        count: pendingFinaer.length,
        properties: pendingFinaer,
        onClick: () => {
          router.push("/rentals/kanban?phase=published");
        },
      },
      {
        id: "widget-needs-ipc-update",
        title: "Necesita actualizacion IPC",
        count: needsIpcUpdate.length,
        properties: needsIpcUpdate,
        onClick: () => {
          router.push("/rentals/kanban/portfolio?phase=rent-update");
        },
      },
    ];

    return widgets;
  }, [propertiesByPhase, router, t]);

  // Manejar click en propiedad
  const handlePropertyClick = (
    e: React.MouseEvent,
    property: any,
    widgetId: string
  ) => {
    e.stopPropagation();
    router.push(`/rentals/property/${property.property_unique_id}`);
  };

  // Componente de card de widget (desktop)
  const WidgetCard = ({ widget }: { widget: TodoWidget }) => {
    const hasItems = widget.count > 0;

    return (
      <Card
        className={cn(
          "relative overflow-hidden border-2 h-full flex flex-col min-h-[400px] max-h-[600px]",
          "bg-card shadow-sm hover:shadow-md transition-shadow duration-200",
          hasItems ? "border-border" : "border-border/50 opacity-75"
        )}
      >
        {/* Header del card */}
        <CardHeader
          className={cn(
            "relative z-10 flex flex-row items-start gap-3 py-4 cursor-pointer flex-shrink-0",
            "border-b border-border/50"
          )}
          onClick={widget.onClick}
        >
          <CardTitle className="text-sm font-semibold text-foreground leading-relaxed flex-1 min-w-0 break-words pt-0.5">
            {widget.title}
          </CardTitle>

          {/* Badge con contador */}
          <div
            className={cn(
              "relative z-10 flex items-center justify-center min-w-[32px] h-7 px-2 rounded-md flex-shrink-0",
              "font-medium text-sm whitespace-nowrap",
              hasItems
                ? "bg-muted/50 text-foreground"
                : "bg-muted/30 text-muted-foreground"
            )}
          >
            {widget.count}
          </div>
        </CardHeader>

        {/* Contenido del card */}
        <CardContent className="relative z-10 flex-1 flex flex-col pt-4 pb-4 px-4 min-h-0 overflow-hidden">
          {/* Lista de propiedades pendientes */}
          {hasItems && widget.properties.length > 0 && (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-2 scrollbar-overlay min-w-0">
              {widget.properties.map((property) => {
                const isOverdue = property.isExpired;
                const isUrgent =
                  property.daysToVisit && property.daysToVisit <= 3;

                return (
                  <div
                    key={property.id}
                    onClick={(e) => handlePropertyClick(e, property, widget.id)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all duration-150",
                      "bg-white dark:bg-[#0a0a0a]",
                      "hover:bg-muted/40 hover:shadow-sm",
                      "border border-border/60 hover:border-border",
                      "min-w-0 w-full"
                    )}
                  >
                    {/* Información de la propiedad */}
                    <div className="space-y-1 min-w-0 w-full">
                      <div className="text-sm font-medium text-foreground line-clamp-2 leading-snug break-words min-w-0">
                        {property.address || property.fullAddress || "Sin dirección"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {property.region && (
                          <span>
                            {property.region}
                            {property.propertyType && ` • ${property.propertyType}`}
                          </span>
                        )}
                        {!property.region && property.city && (
                          <span>
                            {property.city}
                            {property.propertyType && ` • ${property.propertyType}`}
                          </span>
                        )}
                        {!property.region && !property.city && property.propertyType && (
                          <span>{property.propertyType}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Estado vacío */}
          {!hasItems && (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-muted/30">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.todoWidgets.allCompleted")}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {t("dashboard.todoWidgets.noPendingTasks")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const totalCount = todoWidgets.reduce((sum, w) => sum + w.count, 0);

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("dashboard.todoWidgets.pendingTasks")}
          </h2>
        </div>
        <Badge variant="secondary" className="text-xs">
          {totalCount} {t("dashboard.todoWidgets.total")}
        </Badge>
      </div>

      {/* Grid de widgets (desktop) */}
      <div className="hidden md:grid md:grid-cols-4 gap-5 lg:gap-6 xl:gap-7 min-h-[400px]">
        {todoWidgets.map((widget) => (
          <WidgetCard key={widget.id} widget={widget} />
        ))}
      </div>

      {/* Card única con acordeón (mobile) */}
      <Card className="bg-card md:hidden border-2">
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {todoWidgets.map((widget, index) => {
              const isOpen = openItems.has(widget.id);
              const isLast = index === todoWidgets.length - 1;
              const hasItems = widget.count > 0;

              return (
                <Accordion
                  key={widget.id}
                  type="single"
                  collapsible
                  value={isOpen ? widget.id : ""}
                  onValueChange={(value) => {
                    if (value === widget.id) {
                      setOpenItems((prev) => new Set(prev).add(widget.id));
                    } else {
                      setOpenItems((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(widget.id);
                        return newSet;
                      });
                    }
                  }}
                >
                  <AccordionItem value={widget.id} className="border-none">
                    <AccordionTrigger
                      className={cn(
                        "w-full flex items-center justify-between p-4",
                        "hover:bg-muted/30 hover:no-underline",
                        isOpen && "bg-muted/30",
                        !isLast && "border-b border-border/50"
                      )}
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-semibold text-foreground leading-normal break-words">
                          {widget.title}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Badge con contador */}
                        <div
                          className={cn(
                            "flex items-center justify-center min-w-[32px] h-7 rounded-md font-medium text-sm px-2",
                            hasItems
                              ? "bg-muted/50 text-foreground"
                              : "bg-muted/30 text-muted-foreground"
                          )}
                        >
                          {widget.count}
                        </div>
                      </div>
                    </AccordionTrigger>

                    {/* Contenido colapsable */}
                    {hasItems && widget.properties.length > 0 && (
                      <AccordionContent className="px-4 pb-4">
                        <div className="pt-3 space-y-3">
                          {widget.properties.map((property) => {
                            const isOverdue = property.isExpired;
                            const isUrgent =
                              property.daysToVisit && property.daysToVisit <= 3;

                            return (
                              <div
                                key={property.id}
                                onClick={(e) =>
                                  handlePropertyClick(e, property, widget.id)
                                }
                                className={cn(
                                  "p-3 rounded-lg cursor-pointer transition-all duration-150",
                                  "bg-white dark:bg-[#0a0a0a]",
                                  "hover:bg-muted/40 hover:shadow-sm",
                                  "border border-border/60 hover:border-border",
                                  "min-w-0 w-full"
                                )}
                              >
                                <div className="space-y-1 min-w-0 w-full">
                                  <div className="text-sm font-medium text-foreground line-clamp-2 leading-snug break-words min-w-0">
                                    {property.address ||
                                      property.fullAddress ||
                                      "Sin dirección"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {property.daysToVisit !== undefined && (
                                      <span>
                                        {t("dashboard.todoWidgets.daysToVisit")}: {property.daysToVisit}
                                        {property.region && ` • ${property.region}`}
                                      </span>
                                    )}
                                    {property.daysToStart !== undefined && (
                                      <span>
                                        {t("dashboard.todoWidgets.daysToStart")}: {property.daysToStart}
                                      </span>
                                    )}
                                    {property.daysToList !== undefined && (
                                      <span>
                                        {t("dashboard.todoWidgets.daysToList")}: {property.daysToList}
                                        {property.region && ` • ${property.region}`}
                                      </span>
                                    )}
                                    {property.propertyType && !property.daysToList && (
                                      <span>
                                        {property.propertyType}
                                        {property.region && ` • ${property.region}`}
                                      </span>
                                    )}
                                    {!property.daysToList && !property.propertyType && property.region && (
                                      <span>{property.region}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    )}

                    {/* Estado vacío */}
                    {!hasItems && (
                      <AccordionContent className="px-4 pb-4">
                        <div className="pt-3 text-center py-6">
                          <div className="flex justify-center mb-2">
                            <div className="p-3 rounded-full bg-muted/30">
                              <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t("dashboard.todoWidgets.allCompleted")}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {t("dashboard.todoWidgets.noPendingTasks")}
                          </p>
                        </div>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                </Accordion>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
