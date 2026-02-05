"use client";

import { forwardRef, useCallback } from "react";
import { ChecklistSection, ChecklistUploadZone, ChecklistQuestion } from "@/lib/supply-checklist-storage";
import { ChecklistUploadZone as ChecklistUploadZoneComponent } from "../checklist-upload-zone";
import { ChecklistQuestion as ChecklistQuestionComponent } from "../checklist-question";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EntornoZonasComunesSectionProps {
  section: ChecklistSection;
  onUpdate: (updates: Partial<ChecklistSection>) => void;
  onContinue?: () => void;
  hasError?: boolean;
  propertyId?: string; // Property ID for organizing files in Storage
}

export const EntornoZonasComunesSection = forwardRef<HTMLDivElement, EntornoZonasComunesSectionProps>(
  ({ section, onUpdate, onContinue, hasError = false, propertyId }, ref) => {
    const { t } = useI18n();

    // Initialize upload zones if they don't exist
    // Use section.uploadZones if available, otherwise use defaults
    const uploadZones = section.uploadZones && section.uploadZones.length > 0
      ? section.uploadZones
      : [
          { id: "portal", photos: [], videos: [] },
          { id: "fachada", photos: [], videos: [] },
          { id: "entorno", photos: [], videos: [] },
        ];

    // Default questions for initialization
    const defaultQuestions = [
      { id: "acceso-principal" },
      { id: "acabados" },
      { id: "comunicaciones" },
      { id: "electricidad" },
      { id: "carpinteria" },
    ];

    // Always use section.questions if available, otherwise use defaults
    // But ensure we always have an array, even if empty
    const questions = section.questions && section.questions.length > 0 
      ? section.questions 
      : defaultQuestions;

    const handleUploadZoneUpdate = useCallback((zoneId: string, updates: ChecklistUploadZone) => {
      // Always use section.uploadZones if available, otherwise use defaults
      const currentZones = (section.uploadZones && section.uploadZones.length > 0) 
        ? section.uploadZones 
        : uploadZones;
      
      // Find if zone exists, if not add it
      const zoneIndex = currentZones.findIndex(zone => zone.id === zoneId);
      let updatedZones: ChecklistUploadZone[];
      
      if (zoneIndex >= 0) {
        // Update existing zone - create new references for arrays to ensure React detects changes
        updatedZones = currentZones.map(zone => 
          zone.id === zoneId ? {
            ...updates,
            photos: updates.photos ? [...updates.photos] : [],
            videos: updates.videos ? [...updates.videos] : [],
          } : {
            ...zone,
            photos: zone.photos ? [...zone.photos] : [],
            videos: zone.videos ? [...zone.videos] : [],
          }
        );
      } else {
        // Add new zone if it doesn't exist
        updatedZones = [
          ...currentZones.map(zone => ({
            ...zone,
            photos: zone.photos ? [...zone.photos] : [],
            videos: zone.videos ? [...zone.videos] : [],
          })),
          {
            ...updates,
            photos: updates.photos ? [...updates.photos] : [],
            videos: updates.videos ? [...updates.videos] : [],
          }
        ];
      }
      
      onUpdate({ uploadZones: updatedZones });
    }, [section.uploadZones, uploadZones, onUpdate]);

    const handleQuestionUpdate = useCallback((questionId: string, updates: Partial<ChecklistQuestion>) => {
      // Always use section.questions if it exists and has items, otherwise start with defaults
      // But merge with updates to preserve state
      const currentQuestions = section.questions && section.questions.length > 0
        ? section.questions
        : defaultQuestions;
      
      // Find if question already exists
      const existingQuestionIndex = currentQuestions.findIndex(q => q.id === questionId);
      
      let updatedQuestions: ChecklistQuestion[];
      if (existingQuestionIndex >= 0) {
        // Update existing question
        updatedQuestions = currentQuestions.map(q =>
          q.id === questionId ? { ...q, ...updates } : q
        );
      } else {
        // Add new question with updates
        updatedQuestions = [
          ...currentQuestions,
          { id: questionId, ...updates }
        ];
      }
      
      onUpdate({ questions: updatedQuestions });
    }, [section.questions, defaultQuestions, onUpdate]);

    return (
      <div 
        ref={ref} 
        className={cn(
          "checklist-section",
          "space-y-8",
          hasError && "border-4 border-red-500 rounded-lg p-4 bg-red-50 dark:bg-red-900/10"
        )}
      >
        {hasError && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              ⚠️ Esta sección tiene campos requeridos sin completar. Por favor, completa todos los campos marcados como obligatorios antes de finalizar el checklist.
            </p>
          </div>
        )}

        {/* Main Section Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{t.checklist.sections.entornoZonasComunes.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.checklist.sections.entornoZonasComunes.description}
          </p>
        </div>

        {/* Upload Zones con títulos fuera del contenedor general */}
        <div className="space-y-6">
          {/* Portal */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              {t.checklist.sections.entornoZonasComunes.portal} <span className="text-red-500">*</span>
            </h2>
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <Card className="p-6 space-y-4">
                <ChecklistUploadZoneComponent
                  key={`portal-${(section.uploadZones || uploadZones).find(z => z.id === "portal")?.photos.length || 0}-${(section.uploadZones || uploadZones).find(z => z.id === "portal")?.photos.map(p => p.id || p.data?.substring(0, 20)).join(',') || ''}`}
                  title={t.checklist.sections.entornoZonasComunes.portal}
                  description={t.checklist.addPhotos}
                  uploadZone={(section.uploadZones || uploadZones).find(z => z.id === "portal") || { id: "portal", photos: [], videos: [] }}
                  onUpdate={(updates) => handleUploadZoneUpdate("portal", updates)}
                  isRequired={true}
                  hideTitle={true}
                  propertyId={propertyId}
                  folder="checklist/entorno-zonas-comunes"
                />
              </Card>
            </div>
          </div>

          {/* Fachada */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              {t.checklist.sections.entornoZonasComunes.fachada} <span className="text-red-500">*</span>
            </h2>
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <Card className="p-6 space-y-4">
                <ChecklistUploadZoneComponent
                  key={`fachada-${(section.uploadZones || uploadZones).find(z => z.id === "fachada")?.photos.length || 0}-${(section.uploadZones || uploadZones).find(z => z.id === "fachada")?.photos.map(p => p.id || p.data?.substring(0, 20)).join(',') || ''}`}
                  title={t.checklist.sections.entornoZonasComunes.fachada}
                  description={t.checklist.addPhotos}
                  uploadZone={(section.uploadZones || uploadZones).find(z => z.id === "fachada") || { id: "fachada", photos: [], videos: [] }}
                  onUpdate={(updates) => handleUploadZoneUpdate("fachada", updates)}
                  isRequired={true}
                  hideTitle={true}
                  propertyId={propertyId}
                  folder="checklist/entorno-zonas-comunes"
                />
              </Card>
            </div>
          </div>

          {/* Entorno */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              {t.checklist.sections.entornoZonasComunes.entorno} <span className="text-red-500">*</span>
            </h2>
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <Card className="p-6 space-y-4">
                <ChecklistUploadZoneComponent
                  key={`entorno-${(section.uploadZones || uploadZones).find(z => z.id === "entorno")?.photos.length || 0}-${(section.uploadZones || uploadZones).find(z => z.id === "entorno")?.photos.map(p => p.id || p.data?.substring(0, 20)).join(',') || ''}`}
                  title={t.checklist.sections.entornoZonasComunes.entorno}
                  description={t.checklist.addPhotos}
                  uploadZone={(section.uploadZones || uploadZones).find(z => z.id === "entorno") || { id: "entorno", photos: [], videos: [] }}
                  onUpdate={(updates) => handleUploadZoneUpdate("entorno", updates)}
                  isRequired={true}
                  hideTitle={true}
                  propertyId={propertyId}
                  folder="checklist/entorno-zonas-comunes"
                />
              </Card>
            </div>
          </div>
        </div>

        {/* Questions - Contenedor general para las preguntas */}
        <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm space-y-6 mt-8">
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <ChecklistQuestionComponent
                question={section.questions?.find(q => q.id === "acceso-principal") || questions.find(q => q.id === "acceso-principal") || { id: "acceso-principal" }}
                questionId="acceso-principal"
                label={t.checklist.sections.entornoZonasComunes.accesoPrincipal.title}
                description={t.checklist.sections.entornoZonasComunes.accesoPrincipal.description}
                onUpdate={(updates) => handleQuestionUpdate("acceso-principal", updates)}
                isRequired={true}
                elements={[
                  { id: "puerta-entrada", label: t.checklist.sections.entornoZonasComunes.accesoPrincipal.elements.puertaEntrada },
                  { id: "cerradura", label: t.checklist.sections.entornoZonasComunes.accesoPrincipal.elements.cerradura },
                  { id: "bombin", label: t.checklist.sections.entornoZonasComunes.accesoPrincipal.elements.bombin },
                ]}
              />
            </Card>

            <Card className="p-6 space-y-4">
              <ChecklistQuestionComponent
                question={section.questions?.find(q => q.id === "acabados") || questions.find(q => q.id === "acabados") || { id: "acabados" }}
                questionId="acabados"
                label={t.checklist.sections.entornoZonasComunes.acabados.title}
                description={t.checklist.sections.entornoZonasComunes.acabados.description}
                onUpdate={(updates) => handleQuestionUpdate("acabados", updates)}
                isRequired={true}
                elements={[
                  { id: "paredes", label: t.checklist.sections.entornoZonasComunes.acabados.elements.paredes },
                  { id: "techos", label: t.checklist.sections.entornoZonasComunes.acabados.elements.techos },
                  { id: "suelo", label: t.checklist.sections.entornoZonasComunes.acabados.elements.suelo },
                  { id: "rodapies", label: t.checklist.sections.entornoZonasComunes.acabados.elements.rodapies },
                ]}
              />
            </Card>

            <Card className="p-6 space-y-4">
              <ChecklistQuestionComponent
                question={section.questions?.find(q => q.id === "comunicaciones") || questions.find(q => q.id === "comunicaciones") || { id: "comunicaciones" }}
                questionId="comunicaciones"
                label={t.checklist.sections.entornoZonasComunes.comunicaciones.title}
                description={t.checklist.sections.entornoZonasComunes.comunicaciones.description}
                onUpdate={(updates) => handleQuestionUpdate("comunicaciones", updates)}
                isRequired={true}
                elements={[
                  { id: "telefonillo", label: t.checklist.sections.entornoZonasComunes.comunicaciones.elements.telefonillo },
                  { id: "timbre", label: t.checklist.sections.entornoZonasComunes.comunicaciones.elements.timbre },
                  { id: "buzon", label: t.checklist.sections.entornoZonasComunes.comunicaciones.elements.buzon },
                ]}
              />
            </Card>

            <Card className="p-6 space-y-4">
              <ChecklistQuestionComponent
                question={section.questions?.find(q => q.id === "electricidad") || questions.find(q => q.id === "electricidad") || { id: "electricidad" }}
                questionId="electricidad"
                label={t.checklist.sections.entornoZonasComunes.electricidad.title}
                description={t.checklist.sections.entornoZonasComunes.electricidad.description}
                onUpdate={(updates) => handleQuestionUpdate("electricidad", updates)}
                isRequired={true}
                elements={[
                  { id: "luces", label: t.checklist.sections.entornoZonasComunes.electricidad.elements.luces },
                  { id: "interruptores", label: t.checklist.sections.entornoZonasComunes.electricidad.elements.interruptores },
                  { id: "tomas-corriente", label: t.checklist.sections.entornoZonasComunes.electricidad.elements.tomasCorriente },
                  { id: "toma-television", label: t.checklist.sections.entornoZonasComunes.electricidad.elements.tomaTelevision },
                ]}
              />
            </Card>

            <Card className="p-6 space-y-4">
              <ChecklistQuestionComponent
                question={section.questions?.find(q => q.id === "carpinteria") || questions.find(q => q.id === "carpinteria") || { id: "carpinteria" }}
                questionId="carpinteria"
                label={t.checklist.sections.entornoZonasComunes.carpinteria.title}
                description={t.checklist.sections.entornoZonasComunes.carpinteria.description}
                onUpdate={(updates) => handleQuestionUpdate("carpinteria", updates)}
                isRequired={true}
                elements={[
                  { id: "puertas-interiores", label: t.checklist.sections.entornoZonasComunes.carpinteria.elements.puertasInteriores },
                ]}
              />
            </Card>
          </div>

          {/* Navigation */}
          {onContinue && (
            <div className="flex justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-sm font-medium text-[#162EB7] dark:text-[#5B8FFF] hover:opacity-80 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.526 3.862C9.7863 3.6017 10.2084 3.6017 10.4687 3.862C10.729 4.1224 10.729 4.5444 10.4687 4.8047L6.9401 8.3334H14.664C15.0322 8.3334 15.3307 8.6319 15.3307 9C15.3307 9.3682 15.0322 9.6667 14.664 9.6667H6.9401L10.4687 13.1953C10.729 13.4557 10.729 13.8777 10.4687 14.1381C10.2084 14.3984 9.7863 14.3984 9.526 14.1381L4.8593 9.4714C4.599 9.211 4.599 8.789 4.8593 8.5287L9.526 3.862Z" fill="currentColor"/>
                </svg>
                {t.common.back}
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="px-6 py-2 h-9 bg-[#D9E7FF] dark:bg-[#1B36A3] text-[#162EB7] dark:text-[#5B8FFF] rounded-full font-medium text-sm hover:bg-[#C4D9FF] dark:hover:bg-[#2246CC] transition-colors"
              >
                {t.common.continue}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

EntornoZonasComunesSection.displayName = "EntornoZonasComunesSection";
