"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
}

interface NotesManagerProps {
  property: Property;
}

export function NotesManager({ property }: NotesManagerProps) {
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      text: "Verificar documentos de la propiedad",
      author: "María González",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      phase: property.currentPhase,
    },
    {
      id: "2",
      text: "Contactar con el propietario para confirmar datos bancarios",
      author: "Juan Pérez",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      phase: property.currentPhase,
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

  const currentPhaseNotes = notes.filter(
    (note) => note.phase === property.currentPhase
  );

  const historicalNotes = notes.filter(
    (note) => note.phase !== property.currentPhase
  );

  const groupedByPhase = historicalNotes.reduce((acc, note) => {
    if (!acc[note.phase]) {
      acc[note.phase] = [];
    }
    acc[note.phase].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  return (
    <Card className="flex flex-col border-gray-200 shadow-sm">
      <div className="border-b border-gray-100 bg-gray-100/50 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900">Notas</h3>
      </div>

      <div className="flex flex-col">
        {/* Input Area */}
        <div className="shrink-0 border-b border-gray-100 bg-white p-4">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add Note"
            rows={3}
            className="mb-2 resize-none"
          />
          <Button onClick={handleSaveNote} className="w-full" size="sm">
            Guardar Nota
          </Button>
        </div>

        {/* Current Phase Activity */}
        <div className="p-4">
          <div className="space-y-2">
            {currentPhaseNotes.length > 0 ? (
              currentPhaseNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-md border border-gray-200 bg-white p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900">
                      {note.author}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(note.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{note.text}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-gray-500">
                No hay notas en esta fase
              </p>
            )}
          </div>
        </div>

        {/* Historical Archive - Collapsible Bottom */}
        {Object.keys(groupedByPhase).length > 0 && (
          <div className="border-t border-gray-200">
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedByPhase).map(([phase, phaseNotes]) => (
                <AccordionItem key={phase} value={phase} className="border-none">
                  <AccordionTrigger className="px-4 py-2 text-xs font-medium text-gray-600 hover:no-underline">
                    📂 Ver notas anteriores
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-2">
                    <div className="space-y-2">
                      {phaseNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-md border border-gray-200 bg-gray-50 p-2"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">
                              {note.author}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(note.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </Card>
  );
}
