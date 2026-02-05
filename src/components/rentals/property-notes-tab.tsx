"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface Note {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
  phase: string;
  phaseIndex: number; // Index in the global phase sequence
}

interface PropertyNotesTabProps {
  propertyId: string;
  currentPhase?: string;
}

type FilterOption = "current" | string; // "current" | phase name (no "all" option)

// Global Phase Sequence (Order is critical - continuous lifecycle)
const GLOBAL_PHASE_SEQUENCE = [
  "Viviendas Prophero", // Index 0
  "Listo para Alquilar", // Index 1
  "Publicado", // Index 2
  "Inquilino aceptado", // Index 3
  "Pendiente de trámites", // Index 4 --- Transition to Kanban 2 ---
  "Alquilado", // Index 5
  "Actualización de Renta (IPC)", // Index 6
  "Gestión de Renovación", // Index 7
  "Finalización y Salida", // Index 8
] as const;

export function PropertyNotesTab({ propertyId, currentPhase }: PropertyNotesTabProps) {
  const [newNote, setNewNote] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("current");
  
  // Mock property data
  const property: Property = {
    property_unique_id: propertyId,
    address: "",
    city: "",
    daysInPhase: 0,
    currentPhase: currentPhase || "Viviendas Prophero",
  };

  // Get current phase index
  const currentPhaseIndex = useMemo(() => {
    return GLOBAL_PHASE_SEQUENCE.indexOf(property.currentPhase as typeof GLOBAL_PHASE_SEQUENCE[number]);
  }, [property.currentPhase]);

  // Helper function to get phase index from phase name
  const getPhaseIndex = (phaseName: string): number => {
    return GLOBAL_PHASE_SEQUENCE.indexOf(phaseName as typeof GLOBAL_PHASE_SEQUENCE[number]);
  };

  // Mock notes data - in production, this would come from Supabase
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      text: "Verificar documentos de la propiedad @maria",
      author: "María González",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      phase: property.currentPhase,
      phaseIndex: currentPhaseIndex >= 0 ? currentPhaseIndex : 0,
    },
    {
      id: "2",
      text: "Contactar con el propietario para confirmar datos bancarios",
      author: "Juan Pérez",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      phase: property.currentPhase,
      phaseIndex: currentPhaseIndex >= 0 ? currentPhaseIndex : 0,
    },
    {
      id: "3",
      text: "Nota de fase anterior @juan",
      author: "Ana López",
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      phase: "Publicado",
      phaseIndex: getPhaseIndex("Publicado"),
    },
    {
      id: "4",
      text: "Nota de fase de reforma",
      author: "Carlos Ruiz",
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      phase: "Viviendas Prophero",
      phaseIndex: getPhaseIndex("Viviendas Prophero"),
    },
  ]);

  const handleSaveNote = () => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      text: newNote,
      author: "Usuario Actual", // In real app, get from auth context
      timestamp: new Date(),
      phase: property.currentPhase,
      phaseIndex: currentPhaseIndex >= 0 ? currentPhaseIndex : 0,
    };

    setNotes([note, ...notes]);
    setNewNote("");
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "ahora";
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    return `hace ${diffDays}d`;
  };

  // Format creation time (e.g., "14:30")
  const formatCreationTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    });
  };

  // Render text with @mention highlighting
  const renderNoteText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span key={index} className="text-blue-600 dark:text-blue-400 font-medium">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Get previous phases (phases with index < currentPhaseIndex)
  // Shows ALL previous phases in reverse chronological order (most recent first)
  const previousPhases = useMemo(() => {
    if (currentPhaseIndex < 0) return [];
    
    const previous: Array<{ phase: string; index: number }> = [];
    // Loop from currentPhaseIndex - 1 down to 0 (reverse chronological order)
    for (let i = currentPhaseIndex - 1; i >= 0; i--) {
      previous.push({
        phase: GLOBAL_PHASE_SEQUENCE[i],
        index: i,
      });
    }
    return previous;
  }, [currentPhaseIndex]);

  // Filter notes based on selected filter
  const filteredNotes = useMemo(() => {
    let filtered: Note[];
    
    if (selectedFilter === "current") {
      filtered = notes.filter((note) => note.phase === property.currentPhase);
    } else {
      // Filter by specific phase name
      filtered = notes.filter((note) => note.phase === selectedFilter);
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notes, selectedFilter, property.currentPhase]);

  // Build filter chip options: Current Phase + Previous Phases (reverse chronological)
  const filterOptions = useMemo(() => {
    const options: Array<{ value: FilterOption; label: string }> = [
      { value: "current", label: "Fase Actual" },
    ];

    // Add previous phases in reverse chronological order (most recent first)
    previousPhases.forEach(({ phase }) => {
      options.push({ value: phase, label: `Fase: ${phase}` });
    });

    return options;
  }, [previousPhases]);

  return (
    <div className="space-y-6">
      {/* Zone A: Input Area */}
      <Card className="border-gray-200 dark:border-zinc-700 shadow-sm">
        <div className="p-4 md:p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-2 block">
              Nueva Nota
            </label>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escribe una nota..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Usa @ para mencionar a alguien (ej: @maria)
            </p>
          </div>
          <Button onClick={handleSaveNote} className="w-full md:w-auto">
            Guardar Nota
          </Button>
        </div>
      </Card>

      {/* Zone B: Filter Chips Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-overlay">
        {filterOptions.map((option) => {
          const isActive = selectedFilter === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setSelectedFilter(option.value)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Zone C: Notes Feed */}
      <div className="space-y-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="border-gray-200 dark:border-zinc-700 shadow-sm"
            >
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                      {note.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                      {formatRelativeTime(note.timestamp)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap">
                      {formatCreationTime(note.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-zinc-300">
                  {renderNoteText(note.text)}
                </p>
              </div>
            </Card>
          ))
        ) : (
          <Card className="border-gray-200 dark:border-zinc-700 shadow-sm">
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {selectedFilter === "current"
                  ? "No hay notas en esta fase"
                  : `No hay notas en la fase "${selectedFilter}"`}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
