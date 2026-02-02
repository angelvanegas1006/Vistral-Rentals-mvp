"use client";

import { RentalsSidebar } from "@/components/rentals/rentals-sidebar";
import { RentalsHomeHeader } from "@/components/rentals/rentals-home-header";
import { RentalsVisitsCalendar } from "@/components/rentals/rentals-visits-calendar";
import { RentalsHomeTodoWidgets } from "@/components/rentals/rentals-home-todo-widgets";
import { IndicatorCard } from "@/components/rentals/indicator-card";
import { Home, Calendar, Shield } from "lucide-react";

export default function RentalsHomePage() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <RentalsSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <RentalsHomeHeader />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[var(--prophero-gray-50)] dark:bg-[#000000]">
          <div className="max-w-[1600px] mx-auto px-margin-xs sm:px-margin-sm md:px-margin-md lg:px-margin-lg xl:px-margin-xl 2xl:px-margin-xxl py-4 md:py-6 space-y-4 md:space-y-6">
            {/* Mensaje de Bienvenida */}
            <div className="space-y-2 pb-2">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                Bienvenido a Vistral
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Sistema de gestión de propiedades en alquiler
              </p>
              <p className="text-sm text-muted-foreground/80">
                Esta es la página principal. Aquí podrás ver un resumen de tus propiedades
                y acceder rápidamente a las diferentes funcionalidades del sistema.
              </p>
            </div>

            {/* Cards de Indicadores (KPIs) */}
            <div className="grid gap-gutter-xs sm:gap-gutter-sm md:gap-gutter-md lg:gap-gutter-lg xl:gap-gutter-xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <IndicatorCard
                title="Viviendas en Alquiler"
                value={45}
                description="Propiedades actualmente alquiladas y en activo"
                icon={Home}
              />
              <IndicatorCard
                title="Viviendas Listas Para Alquilar Esta Semana"
                value={8}
                description="Propiedades que estarán listas para alquilar durante esta semana"
                icon={Calendar}
              />
              <IndicatorCard
                title="Viviendas Pendientes de Seguro Antiimpago"
                value={12}
                description="Propiedades que requieren contratar o renovar el seguro antiimpago"
                icon={Shield}
              />
            </div>

            {/* Widgets de Tareas Pendientes */}
            <RentalsHomeTodoWidgets />

            {/* Calendario de Visitas */}
            <RentalsVisitsCalendar />
          </div>
        </div>
      </div>
    </div>
  );
}
