"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePropertyVisits } from "@/hooks/use-property-visits";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  CalendarCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

interface CalendarVisit {
  id: string;
  property_id: string;
  visit_date: string;
  visit_type:
    | "renovation-end"
    | "contract-end"
    | "scheduled-visit"
    | "ipc-update"
    | "lead-visit";
  notes: string | null;
  created_by: string | null;
  property_address?: string;
  property?: any;
  last_comment?: string;
  lead_name?: string;
  lead_id?: string;
}

interface RentalsVisitsCalendarProps {
  propertiesByPhase?: Record<string, any[]>;
  onPropertyClick?: (property: any) => void;
  onAddVisit?: () => void;
}

export function RentalsVisitsCalendar({
  propertiesByPhase,
  onPropertyClick,
}: RentalsVisitsCalendarProps) {
  const { t, language } = useI18n();

  // Estados
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Use hook to fetch visits (all properties, filtered by date range)
  const startOfWeek = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [currentDate]);
  
  const endOfWeek = useMemo(() => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + 6);
    date.setHours(23, 59, 59, 999);
    return date;
  }, [startOfWeek]);
  
  const { visits: dbVisits, loading: propertyVisitsLoading } = usePropertyVisits({
    startDate: startOfWeek,
    endDate: endOfWeek,
  });

  const [leadVisits, setLeadVisits] = useState<CalendarVisit[]>([]);
  const [leadVisitsLoading, setLeadVisitsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeadVisits() {
      try {
        setLeadVisitsLoading(true);
        const res = await fetch(
          `/api/leads/visits-calendar?start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`
        );
        if (!res.ok) { setLeadVisitsLoading(false); return; }
        const { visits: data } = await res.json();
        setLeadVisits(
          (data || []).map((v: any) => ({
            id: `lead-${v.id}`,
            property_id: v.property_id,
            visit_date: v.visit_date,
            visit_type: "lead-visit" as const,
            notes: null,
            created_by: null,
            property_address: v.property_address,
            lead_name: v.lead_name,
            lead_id: v.lead_id,
          }))
        );
      } catch {
        setLeadVisits([]);
      } finally {
        setLeadVisitsLoading(false);
      }
    }
    fetchLeadVisits();
  }, [startOfWeek, endOfWeek]);

  const loading = propertyVisitsLoading || leadVisitsLoading;

  const visits: CalendarVisit[] = useMemo(() => {
    const propertyMapped = dbVisits.map((v) => ({
      id: v.id,
      property_id: v.property_id,
      visit_date: v.visit_date,
      visit_type: v.visit_type,
      notes: v.notes,
      created_by: v.created_by,
      property_address: `Propiedad ${v.property_id}`,
    }));
    return [...propertyMapped, ...leadVisits];
  }, [dbVisits, leadVisits]);
  const [viewMode, setViewMode] = useState<"day" | "week">("week");
  const [isMobile, setIsMobile] = useState(false);
  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setViewMode("day");
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);


  // Obtener horas del día (8:00 AM a 20:00 PM)
  const hours = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => i + 8);
  }, []);

  // Obtener días de la semana (Lunes a Viernes)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajustar a lunes
    startOfWeek.setDate(diff);

    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [currentDate]);

  const filteredVisits = visits;

  // Agrupar visitas por hora (vista diaria)
  const groupedVisitsByHour = useMemo(() => {
    const grouped: Record<number, CalendarVisit[]> = {};
    hours.forEach((hour) => {
      grouped[hour] = filteredVisits.filter((visit) => {
        const visitDate = new Date(visit.visit_date);
        return visitDate.getHours() === hour;
      });
    });
    return grouped;
  }, [filteredVisits, hours]);

  // Agrupar visitas por día (vista semanal)
  const groupedVisitsByDay = useMemo(() => {
    return weekDays.map((day) => {
      return filteredVisits.filter((visit) => {
        const visitDate = new Date(visit.visit_date);
        return (
          visitDate.getDate() === day.getDate() &&
          visitDate.getMonth() === day.getMonth() &&
          visitDate.getFullYear() === day.getFullYear()
        );
      });
    });
  }, [filteredVisits, weekDays]);

  // Navegación de fechas
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Formatear fecha para mostrar
  const formatDateLabel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);

    if (current.getTime() === today.getTime()) {
      return t("calendar.today");
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (current.getTime() === tomorrow.getTime()) {
      return t("calendar.tomorrow");
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (current.getTime() === yesterday.getTime()) {
      return t("calendar.yesterday");
    }

    return current.toLocaleDateString(
      language === "es" ? "es-ES" : "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  // Obtener icono según tipo de visita
  const getVisitIcon = (type: CalendarVisit["visit_type"]) => {
    const iconClass = "h-4 w-4 flex-shrink-0";
    switch (type) {
      case "renovation-end":
        return <RefreshCw className={cn(iconClass, "text-blue-500")} />;
      case "contract-end":
        return <CalendarCheck className={cn(iconClass, "text-red-500")} />;
      case "scheduled-visit":
        return <CheckCircle2 className={cn(iconClass, "text-green-500")} />;
      case "ipc-update":
        return <TrendingUp className={cn(iconClass, "text-amber-500")} />;
      case "lead-visit":
        return <Users className={cn(iconClass, "text-purple-500")} />;
      default:
        return <Calendar className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  const getVisitLabel = (type: CalendarVisit["visit_type"], visit?: CalendarVisit) => {
    switch (type) {
      case "renovation-end":
        return "Fin de Renovación";
      case "contract-end":
        return "Fin de contrato";
      case "scheduled-visit":
        return "Visita agendada";
      case "ipc-update":
        return "Actualización IPC";
      case "lead-visit":
        return visit?.lead_name ? `Visita: ${visit.lead_name}` : "Visita Interesado";
      default:
        return type;
    }
  };

  // Verificar si es hoy
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  }, [currentDate]);

  const now = new Date();

  return (
    <Card className="bg-card w-full border border-border shadow-sm">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Título y subtítulo */}
          <div className="min-w-0">
            <CardTitle className="text-base md:text-lg font-semibold">
              {t("calendar.title")}
            </CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {t("calendar.subtitle")}
            </p>
          </div>

          {/* Controles */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Selector de vista (solo desktop) */}
            {!isMobile && (
              <div className="flex gap-1 border rounded-md flex-shrink-0">
                <button
                  onClick={() => setViewMode("day")}
                  className={cn(
                    "px-2 md:px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    viewMode === "day"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t("calendar.viewDay")}
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={cn(
                    "px-2 md:px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    viewMode === "week"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t("calendar.viewWeek")}
                </button>
              </div>
            )}

            {/* Navegación */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={goToPrevious}
                className={cn(
                  "inline-flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  "px-2 md:px-3 py-1 text-xs font-medium h-auto"
                )}
              >
                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
              </button>
              <button
                onClick={goToToday}
                className={cn(
                  "inline-flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  "px-2 md:px-3 py-1 text-xs font-medium h-auto"
                )}
              >
                {formatDateLabel()}
              </button>
              <button
                onClick={goToNext}
                className={cn(
                  "inline-flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  "px-2 md:px-3 py-1 text-xs font-medium h-auto"
                )}
              >
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
              </button>
            </div>

          </div>
        </div>

      </CardHeader>

      <CardContent className="bg-[var(--vistral-gray-50)] dark:bg-[#000000] p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : viewMode === "day" ? (
          /* Vista Diaria */
          <div className="relative max-h-[500px] md:max-h-[750px] overflow-y-auto">
            <div className="space-y-0">
              {hours.map((hour) => {
                const hourVisits = groupedVisitsByHour[hour] || [];
                const isCurrentHour = isToday && hour === now.getHours();

                return (
                  <div
                    key={hour}
                    className={cn(
                      "flex gap-2 md:gap-4 border-b border-border/50 pb-3 md:pb-4 min-w-0 relative",
                      isCurrentHour && "bg-primary/5"
                    )}
                  >
                    {/* Columna de hora */}
                    <div
                      className={cn(
                        "w-12 md:w-16 text-xs md:text-sm font-medium flex-shrink-0 pt-1 flex items-start",
                        isCurrentHour
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      {isCurrentHour ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          <span>{hour.toString().padStart(2, "0")}:00</span>
                        </div>
                      ) : (
                        <span>{hour.toString().padStart(2, "0")}:00</span>
                      )}
                    </div>

                    {/* Lista de visitas */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {hourVisits.length === 0 ? (
                        <span className="text-xs text-muted-foreground block py-1">
                          {t("calendar.noVisits")}
                        </span>
                      ) : (
                        hourVisits.map((visit) => {
                          const visitDate = new Date(visit.visit_date);
                          const visitHour = visitDate.getHours();
                          const visitMinute = visitDate.getMinutes();
                          const visitTime = `${visitHour.toString().padStart(2, "0")}:${visitMinute.toString().padStart(2, "0")}`;

                          return (
                            <div
                              key={visit.id}
                              className={cn(
                                "w-full flex items-center gap-2 rounded-lg",
                                "border text-left min-w-0",
                                "bg-card",
                                isMobile
                                  ? "px-2 py-1.5 border-1"
                                  : "px-3 md:px-4 py-2.5 md:py-3 border-2"
                              )}
                            >
                              <div className="flex-shrink-0">
                                <div className={cn(
                                  "flex items-center justify-center",
                                  isMobile ? "w-6 h-6" : "w-8 h-8"
                                )}>
                                  {getVisitIcon(visit.visit_type)}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className={cn(
                                    "font-semibold text-foreground line-clamp-1 break-words",
                                    isMobile ? "text-xs" : "text-sm md:text-base"
                                  )}>
                                    {visit.property_address || visit.property_id}
                                  </div>
                                  <div className={cn(
                                    "text-muted-foreground",
                                    isMobile ? "text-[10px]" : "text-xs md:text-sm"
                                  )}>
                                    {getVisitLabel(visit.visit_type, visit)}
                                  </div>
                                </div>
                                <span className={cn(
                                  "text-muted-foreground flex-shrink-0 whitespace-nowrap",
                                  isMobile ? "text-[10px]" : "text-xs"
                                )}>
                                  {visitTime}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Vista Semanal */
          <div className={cn(
            "flex md:grid gap-2 overflow-x-auto pb-2",
            "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
            isMobile
              ? "flex-row snap-x snap-mandatory"
              : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
          )}>
            {weekDays.map((day, dayIndex) => {
              const dayVisits = groupedVisitsByDay[dayIndex] || [];
              const isToday = day.toDateString() === new Date().toDateString();

              // Ordenar visitas por hora
              const sortedVisits = [...dayVisits].sort((a, b) => {
                const timeA = new Date(a.visit_date).getTime();
                const timeB = new Date(b.visit_date).getTime();
                return timeA - timeB;
              });

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "border rounded-lg p-3 md:p-4 flex flex-col bg-card",
                    isMobile
                      ? "min-w-[calc(100vw-2rem)] snap-start"
                      : "min-w-0",
                    isMobile ? "min-h-[450px]" : "min-h-[200px] md:min-h-[300px]",
                    isToday && "border-primary bg-primary/5 ring-2 ring-primary/20"
                  )}
                >
                  {/* Header del día */}
                  <div className={cn(
                    "text-sm md:text-xs font-semibold mb-3 md:mb-2 flex-shrink-0",
                    isToday && "text-primary"
                  )}>
                    <div className="text-xs text-muted-foreground mb-0.5">
                      {day.toLocaleDateString(language === "es" ? "es-ES" : "en-US", { weekday: "long" })}
                    </div>
                    <div className="text-lg md:text-base">
                      {day.toLocaleDateString(language === "es" ? "es-ES" : "en-US", { day: "numeric" })}
                    </div>
                  </div>

                  {/* Lista de visitas del día */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {sortedVisits.length === 0 ? (
                      <span className="text-xs text-muted-foreground block py-2">
                        {t("calendar.noVisits")}
                      </span>
                    ) : (
                      sortedVisits.map((visit) => {
                        const visitDate = new Date(visit.visit_date);
                        const visitTime = visitDate.toLocaleTimeString(language === "es" ? "es-ES" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={visit.id}
                            className={cn(
                              "w-full flex items-start gap-2 px-3 py-2.5 rounded-lg",
                              "border-2 text-left",
                              "bg-card",
                            )}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {getVisitIcon(visit.visit_type)}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs md:text-sm font-semibold text-foreground line-clamp-2 break-words">
                                  {visit.property_address || visit.property_id}
                                </span>
                                <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                                  {visitTime}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {getVisitLabel(visit.visit_type, visit)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
