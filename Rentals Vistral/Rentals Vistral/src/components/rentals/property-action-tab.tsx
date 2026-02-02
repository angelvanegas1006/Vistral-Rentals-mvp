"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bell, Send, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyActionTabProps {
  propertyId: string;
}

interface Comment {
  id: string;
  author: string;
  date: string;
  content: string;
}

interface Reminder {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

export function PropertyActionTab({ propertyId }: PropertyActionTabProps) {
  const [newComment, setNewComment] = useState("");
  const [newReminder, setNewReminder] = useState({ title: "", date: "" });

  // Mock data - reemplazar con datos reales de Supabase
  const comments: Comment[] = [
    {
      id: "1",
      author: "Usuario",
      date: "2024-01-25",
      content: "Cliente interesado, programar visita para la próxima semana.",
    },
    {
      id: "2",
      author: "Admin",
      date: "2024-01-26",
      content: "Visita programada para el 2 de febrero a las 10:00 AM.",
    },
  ];

  const reminders: Reminder[] = [
    {
      id: "1",
      title: "Seguimiento con cliente",
      date: "2024-02-01",
      completed: false,
    },
    {
      id: "2",
      title: "Renovar publicación",
      date: "2024-02-15",
      completed: false,
    },
  ];

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    // TODO: Agregar comentario a Supabase
    console.log("Adding comment:", newComment);
    setNewComment("");
  };

  const handleAddReminder = () => {
    if (!newReminder.title.trim() || !newReminder.date) return;
    // TODO: Agregar recordatorio a Supabase
    console.log("Adding reminder:", newReminder);
    setNewReminder({ title: "", date: "" });
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentarios
          </CardTitle>
          <CardDescription>
            Notas y comentarios sobre esta propiedad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Comments */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 border rounded-lg bg-card space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.date).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="comment">Nuevo comentario</Label>
            <Textarea
              id="comment"
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button onClick={handleAddComment} size="sm">
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reminders Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recordatorios
          </CardTitle>
          <CardDescription>
            Tareas y recordatorios pendientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Reminders */}
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={cn(
                  "flex items-center justify-between p-4 border rounded-lg",
                  reminder.completed && "opacity-60"
                )}
              >
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    reminder.completed && "line-through text-muted-foreground"
                  )}>
                    {reminder.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(reminder.date).toLocaleDateString("es-ES")}
                  </p>
                </div>
                {reminder.completed ? (
                  <Badge variant="default" className="bg-green-500">
                    Completado
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pendiente</Badge>
                )}
              </div>
            ))}
          </div>

          {/* Add Reminder */}
          <div className="space-y-3 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="reminder-title">Título</Label>
              <Input
                id="reminder-title"
                placeholder="Título del recordatorio"
                value={newReminder.title}
                onChange={(e) =>
                  setNewReminder({ ...newReminder, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-date">Fecha</Label>
              <Input
                id="reminder-date"
                type="date"
                value={newReminder.date}
                onChange={(e) =>
                  setNewReminder({ ...newReminder, date: e.target.value })
                }
              />
            </div>
            <Button onClick={handleAddReminder} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Recordatorio
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start">
              Programar Visita
            </Button>
            <Button variant="outline" className="justify-start">
              Enviar Email
            </Button>
            <Button variant="outline" className="justify-start">
              Generar Contrato
            </Button>
            <Button variant="outline" className="justify-start">
              Cambiar Fase
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
