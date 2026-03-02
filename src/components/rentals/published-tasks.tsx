"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/use-leads";
import { mapLeadFromSupabase } from "@/lib/supabase/mappers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, X, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublishedTasksKanban } from "./published-tasks-kanban";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  called?: "Si" | "No";
  discarded?: "Si" | "No";
  scheduledDate?: string; // Para "Interesados sin gestionar"
  visitDate?: string; // Para "Interesados Agendados"
  qualified?: "Si" | "No"; // Para "Visita Hecha"
}

interface PublishedTasksProps {
  property: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
}

export function PublishedTasks({ property }: PublishedTasksProps) {
  // Estado para toggle entre vista Listas y Kanban
  const [viewMode, setViewMode] = useState<"lists" | "kanban">("lists");
  
  // Fetch leads from Supabase
  const { leads: allLeads, loading } = useLeads();
  
  // Map leads to component format
  const mappedLeads = useMemo(() => {
    return allLeads.map(mapLeadFromSupabase);
  }, [allLeads]);
  
  // Group leads by phase
  const unguidedLeads = useMemo(() => {
    return mappedLeads.filter(
      (lead) => lead.currentPhase === "Sin Contactar" && lead.discarded !== "Si"
    );
  }, [mappedLeads]);
  
  const scheduledLeads = useMemo(() => {
    return mappedLeads.filter(
      (lead) => lead.currentPhase === "Agendados" && lead.discarded !== "Si"
    );
  }, [mappedLeads]);
  
  const visitedLeads = useMemo(() => {
    return mappedLeads.filter(
      (lead) => lead.currentPhase === "Visita Hecha / Pendiente de Doc." && lead.discarded !== "Si"
    );
  }, [mappedLeads]);
  
  const discardedLeads = useMemo(() => {
    return mappedLeads.filter((lead) => lead.discarded === "Si");
  }, [mappedLeads]);
  
  // Local state setters for UI updates (will be replaced with API calls)
  const [localUnguidedLeads, setLocalUnguidedLeads] = useState<Lead[]>([]);
  const [localScheduledLeads, setLocalScheduledLeads] = useState<Lead[]>([]);
  const [localVisitedLeads, setLocalVisitedLeads] = useState<Lead[]>([]);
  const [localDiscardedLeads, setLocalDiscardedLeads] = useState<Lead[]>([]);
  
  // Sync local state with fetched leads
  useEffect(() => {
    setLocalUnguidedLeads(unguidedLeads);
    setLocalScheduledLeads(scheduledLeads);
    setLocalVisitedLeads(visitedLeads);
    setLocalDiscardedLeads(discardedLeads);
  }, [unguidedLeads, scheduledLeads, visitedLeads, discardedLeads]);
  
  // Estados para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentList, setCurrentList] = useState<"unguided" | "scheduled" | "visited" | "discarded">("unguided");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<Partial<Lead>>({});

  // Función para mover leads automáticamente entre listas
  const moveLeadsAutomatically = () => {
    const today = new Date().toISOString().split("T")[0];

    // Mover de "sin gestionar" a "agendados" si tienen fecha agendada y no están descartados
    setLocalUnguidedLeads((prev) => {
      const toMove = prev.filter(
        (lead) => lead.scheduledDate && lead.discarded !== "Si"
      );
      if (toMove.length > 0) {
        setLocalScheduledLeads((scheduled) => [
          ...scheduled,
          ...toMove.map((lead) => ({
            ...lead,
            visitDate: lead.scheduledDate,
            scheduledDate: undefined,
          })),
        ]);
      }
      return prev.filter((lead) => !toMove.includes(lead));
    });

    // Mover de "agendados" a "visitados" si la fecha de visita es hoy o anterior
    setLocalScheduledLeads((prev) => {
      const toMove = prev.filter(
        (lead) => lead.visitDate && lead.visitDate <= today && lead.discarded !== "Si"
      );
      if (toMove.length > 0) {
        setLocalVisitedLeads((visited) => [
          ...visited,
          ...toMove.map((lead) => ({
            ...lead,
            visitDate: undefined,
            qualified: lead.qualified || "No",
          })),
        ]);
      }
      return prev.filter((lead) => !toMove.includes(lead));
    });

    // Mover descartados a la lista de descartados
    setLocalUnguidedLeads((prev) => {
      const toDiscard = prev.filter((lead) => lead.discarded === "Si");
      if (toDiscard.length > 0) {
        setLocalDiscardedLeads((discarded) => {
          const existingIds = new Set(discarded.map((l) => l.id));
          return [...discarded, ...toDiscard.filter((lead) => !existingIds.has(lead.id))];
        });
      }
      return prev.filter((lead) => lead.discarded !== "Si");
    });

    setLocalScheduledLeads((prev) => {
      const toDiscard = prev.filter((lead) => lead.discarded === "Si");
      if (toDiscard.length > 0) {
        setLocalDiscardedLeads((discarded) => {
          const existingIds = new Set(discarded.map((l) => l.id));
          return [...discarded, ...toDiscard.filter((lead) => !existingIds.has(lead.id))];
        });
      }
      return prev.filter((lead) => lead.discarded !== "Si");
    });

    setLocalVisitedLeads((prev) => {
      const toDiscard = prev.filter((lead) => lead.discarded === "Si");
      if (toDiscard.length > 0) {
        setLocalDiscardedLeads((discarded) => {
          const existingIds = new Set(discarded.map((l) => l.id));
          return [...discarded, ...toDiscard.filter((lead) => !existingIds.has(lead.id))];
        });
      }
      return prev.filter((lead) => lead.discarded !== "Si");
    });
  };

  const handleAddLead = (list: typeof currentList) => {
    setCurrentList(list);
    setEditingLead(null);
    setFormData({});
    setIsAddModalOpen(true);
  };

  const handleEditLead = (lead: Lead, list: typeof currentList) => {
    setCurrentList(list);
    setEditingLead(lead);
    setFormData(lead);
    setIsEditModalOpen(true);
  };

  const handleDeleteLead = (leadId: string, list: typeof currentList) => {
    switch (list) {
      case "unguided":
        setLocalUnguidedLeads((prev) => prev.filter((l) => l.id !== leadId));
        break;
      case "scheduled":
        setLocalScheduledLeads((prev) => prev.filter((l) => l.id !== leadId));
        break;
      case "visited":
        setLocalVisitedLeads((prev) => prev.filter((l) => l.id !== leadId));
        break;
      case "discarded":
        setLocalDiscardedLeads((prev) => prev.filter((l) => l.id !== leadId));
        break;
    }
  };

  const handleSaveLead = () => {
    const newLead: Lead = {
      id: editingLead?.id || Date.now().toString(),
      name: formData.name || "",
      phone: formData.phone || "",
      email: formData.email || "",
      called: formData.called,
      discarded: formData.discarded,
      scheduledDate: formData.scheduledDate,
      visitDate: formData.visitDate,
      qualified: formData.qualified,
    };

    if (editingLead) {
      // Editar lead existente
      switch (currentList) {
        case "unguided":
          setLocalUnguidedLeads((prev) =>
            prev.map((l) => (l.id === editingLead.id ? newLead : l))
          );
          break;
        case "scheduled":
          setLocalScheduledLeads((prev) =>
            prev.map((l) => (l.id === editingLead.id ? newLead : l))
          );
          break;
        case "visited":
          setLocalVisitedLeads((prev) =>
            prev.map((l) => (l.id === editingLead.id ? newLead : l))
          );
          break;
        case "discarded":
          setLocalDiscardedLeads((prev) =>
            prev.map((l) => (l.id === editingLead.id ? newLead : l))
          );
          break;
      }
    } else {
      // Añadir nuevo lead
      switch (currentList) {
        case "unguided":
          setLocalUnguidedLeads((prev) => [...prev, newLead]);
          break;
        case "scheduled":
          setLocalScheduledLeads((prev) => [...prev, newLead]);
          break;
        case "visited":
          setLocalVisitedLeads((prev) => [...prev, newLead]);
          break;
        case "discarded":
          setLocalDiscardedLeads((prev) => [...prev, newLead]);
          break;
      }
    }

    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setFormData({});
    setEditingLead(null);

    // Ejecutar movimiento automático después de guardar
    setTimeout(() => {
      moveLeadsAutomatically();
    }, 100);
  };

  const renderTable = (
    leads: Lead[],
    listType: typeof currentList,
    columns: string[]
  ) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-muted/50 dark:bg-[var(--vistral-gray-900)]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase"
                >
                  {col}
                </th>
              ))}
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  No hay interesados en esta lista
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b hover:bg-accent dark:hover:bg-[var(--vistral-gray-800)] transition-colors"
                >
                  <td className="px-3 py-2 text-sm text-foreground">{lead.name}</td>
                  <td className="px-3 py-2 text-sm text-foreground">{lead.phone}</td>
                  <td className="px-3 py-2 text-sm text-foreground">{lead.email}</td>
                  {listType === "unguided" && (
                    <>
                      <td className="px-3 py-2 text-sm text-foreground">
                        {lead.called || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-foreground">
                        {lead.discarded || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-foreground">
                        {lead.scheduledDate
                          ? new Date(lead.scheduledDate).toLocaleDateString("es-ES")
                          : "-"}
                      </td>
                    </>
                  )}
                  {listType === "scheduled" && (
                    <>
                      <td className="px-3 py-2 text-sm text-foreground">
                        {lead.visitDate
                          ? new Date(lead.visitDate).toLocaleDateString("es-ES")
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-foreground">
                        {lead.discarded || "-"}
                      </td>
                    </>
                  )}
                  {listType === "visited" && (
                    <>
                      <td className="px-3 py-2 text-sm text-foreground">
                        {lead.discarded || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-foreground">
                        {lead.qualified || "-"}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditLead(lead, listType)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteLead(lead.id, listType)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const getModalFields = () => {
    switch (currentList) {
      case "unguided":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="called">¿Llamado?</Label>
              <Select
                value={formData.called || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, called: value as "Si" | "No" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Si">Si</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discarded">Descartado</Label>
              <Select
                value={formData.discarded || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, discarded: value as "Si" | "No" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Si">Si</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Fecha Agendada</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledDate: e.target.value })
                }
              />
            </div>
          </>
        );
      case "scheduled":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitDate">Fecha de Visita</Label>
              <Input
                id="visitDate"
                type="date"
                value={formData.visitDate || ""}
                onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discarded">Descartado</Label>
              <Select
                value={formData.discarded || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, discarded: value as "Si" | "No" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Si">Si</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "visited":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discarded">Descartado</Label>
              <Select
                value={formData.discarded || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, discarded: value as "Si" | "No" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Si">Si</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualified">Inquilino Cualificado</Label>
              <Select
                value={formData.qualified || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, qualified: value as "Si" | "No" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Si">Si</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "discarded":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="space-y-6 -ml-1 md:-ml-2">
      {/* Record Counts y Toggle de Vista */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{localUnguidedLeads.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Interesados sin gestionar</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{localScheduledLeads.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Interesados Agendados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{localVisitedLeads.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Visita Hecha</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{localDiscardedLeads.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Descartados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toggle de Vista */}
        <div className="flex items-center gap-2 bg-accent dark:bg-[var(--vistral-gray-800)] rounded-lg p-1">
          <Button
            variant={viewMode === "lists" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("lists")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
              viewMode === "lists"
                ? "bg-[var(--vistral-blue-500)] text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Listas</span>
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
              viewMode === "kanban"
                ? "bg-[var(--vistral-blue-500)] text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Kanban</span>
          </Button>
        </div>
      </div>

      {/* Vista Kanban */}
      {viewMode === "kanban" && (
        <div className="bg-[var(--vistral-gray-50)] dark:bg-[#000000] rounded-lg p-2 md:p-3 min-h-[600px] -mx-1 md:-mx-2">
          <PublishedTasksKanban
            unguidedLeads={localUnguidedLeads}
            scheduledLeads={localScheduledLeads}
            visitedLeads={localVisitedLeads}
            discardedLeads={localDiscardedLeads}
            onUnguidedLeadsChange={setLocalUnguidedLeads}
            onScheduledLeadsChange={setLocalScheduledLeads}
            onVisitedLeadsChange={setLocalVisitedLeads}
            onDiscardedLeadsChange={setLocalDiscardedLeads}
            onAddLead={handleAddLead}
          />
        </div>
      )}

      {/* Vista Listas (colapsadas por defecto) */}
      {viewMode === "lists" && (
        <Accordion type="multiple" defaultValue={[]} className="space-y-3">
          {/* Interesados sin gestionar */}
          <AccordionItem value="unguided" className="border rounded-lg overflow-hidden">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-0 px-4 pt-4">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center justify-between w-full pr-4">
                    <CardTitle className="text-base font-semibold">Interesados sin gestionar</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {localUnguidedLeads.length}
                      </Badge>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddLead("unguided");
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium h-8 px-2 hover:bg-[var(--vistral-gray-100)] hover:text-foreground dark:hover:bg-[var(--vistral-gray-800)] transition-all duration-200 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="hidden sm:inline ml-1">Añadir</span>
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="p-0 pt-2 pb-4">
                  {renderTable(localUnguidedLeads, "unguided", [
                    "Nombre",
                    "Teléfono",
                    "Email",
                    "¿Llamado?",
                    "Descartado",
                    "Fecha Agendada",
                  ])}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Interesados Agendados */}
          <AccordionItem value="scheduled" className="border rounded-lg overflow-hidden">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-0 px-4 pt-4">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center justify-between w-full pr-4">
                    <CardTitle className="text-base font-semibold">Interesados Agendados</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {localScheduledLeads.length}
                      </Badge>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddLead("scheduled");
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium h-8 px-2 hover:bg-[var(--vistral-gray-100)] hover:text-foreground dark:hover:bg-[var(--vistral-gray-800)] transition-all duration-200 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="hidden sm:inline ml-1">Añadir</span>
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="p-0 pt-2 pb-4">
                  {renderTable(localScheduledLeads, "scheduled", [
                    "Nombre",
                    "Teléfono",
                    "Email",
                    "Fecha de Visita",
                    "Descartado",
                  ])}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Visita Hecha / Pendiente documentación */}
          <AccordionItem value="visited" className="border rounded-lg overflow-hidden">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-0 px-4 pt-4">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center justify-between w-full pr-4">
                    <CardTitle className="text-base font-semibold">
                      Visita Hecha / Pendiente documentación
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {localVisitedLeads.length}
                      </Badge>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddLead("visited");
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium h-8 px-2 hover:bg-[var(--vistral-gray-100)] hover:text-foreground dark:hover:bg-[var(--vistral-gray-800)] transition-all duration-200 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="hidden sm:inline ml-1">Añadir</span>
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="p-0 pt-2 pb-4">
                  {renderTable(localVisitedLeads, "visited", [
                    "Nombre",
                    "Teléfono",
                    "Email",
                    "Descartado",
                    "Inquilino Cualificado",
                  ])}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Descartados */}
          <AccordionItem value="discarded" className="border rounded-lg overflow-hidden">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-0 px-4 pt-4">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center justify-between w-full pr-4">
                    <CardTitle className="text-base font-semibold">Descartados</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {localDiscardedLeads.length}
                      </Badge>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddLead("discarded");
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium h-8 px-2 hover:bg-[var(--vistral-gray-100)] hover:text-foreground dark:hover:bg-[var(--vistral-gray-800)] transition-all duration-200 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="hidden sm:inline ml-1">Añadir</span>
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="p-0 pt-2 pb-4">
                  {renderTable(localDiscardedLeads, "discarded", ["Nombre", "Teléfono", "Email"])}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      )}

      {/* Modal para añadir/editar */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setFormData({});
          setEditingLead(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLead ? "Editar Lead" : "Añadir Lead"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">{getModalFields()}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setFormData({});
              setEditingLead(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLead}>
              {editingLead ? "Guardar" : "Añadir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
