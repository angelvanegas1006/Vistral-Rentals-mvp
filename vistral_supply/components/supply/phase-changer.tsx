"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { canChangePhase } from "@/lib/auth/permissions";
import { getKanbanConfig, getStatusField } from "@/lib/supply-kanban-config";
import { useI18n } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];
type Property = Database['public']['Tables']['properties']['Row'];

interface PhaseChangerProps {
  property: Property;
  userRole: AppRole | null;
  onPhaseChanged?: () => void;
}

// Partner phase options
const PARTNER_PHASE_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "in-review", label: "En Revisión" },
  { value: "needs-correction", label: "Necesita Corrección" },
  { value: "in-negotiation", label: "En Negociación" },
  { value: "arras", label: "Arrás" },
  { value: "pending-to-settlement", label: "Pendiente de Escrituración" },
  { value: "settlement", label: "Escriturado" },
  { value: "rejected", label: "Rechazado" },
] as const;

// Supply Analyst phase options
const ANALYST_PHASE_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "under-review", label: "Under Review" },
  { value: "needs-correction", label: "Needs Correction" },
  { value: "renovation-estimation", label: "Renovation Estimation" },
  { value: "financial-analysis", label: "Financial Analysis" },
  { value: "in-negotiation", label: "In Negotiation" },
  { value: "arras", label: "Arras" },
  { value: "done", label: "Done" },
  { value: "rejected", label: "Rejected" },
] as const;

export function PhaseChanger({ property, userRole, onPhaseChanged }: PhaseChangerProps) {
  const { t } = useI18n();
  const [isChanging, setIsChanging] = useState(false);

  if (!canChangePhase(userRole, property)) {
    return null;
  }

  // Get phase options based on role
  const phaseOptions = useMemo(() => {
    if (!userRole) return PARTNER_PHASE_OPTIONS;
    
    switch (userRole) {
      case 'supply_analyst':
      case 'supply_lead':
      case 'supply_admin':
        return ANALYST_PHASE_OPTIONS.map(opt => {
          // Map phase values to translation keys
          const translationMap: Record<string, keyof typeof t.kanban> = {
            'backlog': 'backlog',
            'under-review': 'underReview',
            'needs-correction': 'needsCorrection',
            'renovation-estimation': 'renovationEstimation',
            'financial-analysis': 'financialAnalysis',
            'in-negotiation': 'inNegotiation',
            'arras': 'arras',
            'done': 'done',
            'rejected': 'rejected',
          };
          const translationKey = translationMap[opt.value];
          return {
            value: opt.value,
            label: translationKey ? t.kanban[translationKey] : opt.label
          };
        });
      default:
        return PARTNER_PHASE_OPTIONS;
    }
  }, [userRole, t]);

  // Get status field based on role
  const statusField = getStatusField(userRole);
  const currentPhase = (statusField === 'analyst_status' && property.analyst_status) 
    ? property.analyst_status 
    : property.status || "draft";
  
  const currentPhaseLabel = phaseOptions.find((p) => p.value === currentPhase)?.label || currentPhase;

  const handlePhaseChange = async (newPhase: string) => {
    if (newPhase === currentPhase) return;

    setIsChanging(true);

    try {
      const supabase = createClient();
      
      // Map phase to supply_phase enum (for partner phases)
      const phaseMap: Record<string, string> = {
        draft: "pending",
        "in-review": "review",
        "under-review": "review",
        "needs-correction": "in-progress",
        "renovation-estimation": "in-progress",
        "financial-analysis": "in-progress",
        "in-negotiation": "in-progress",
        arras: "in-progress",
        "pending-to-settlement": "in-progress",
        settlement: "completed",
        done: "completed",
        rejected: "orphaned",
      };

      const supplyPhase = phaseMap[newPhase] || "pending";

      // Update the appropriate status field
      const updateData: any = {
        supply_phase: supplyPhase,
        updated_at: new Date().toISOString(),
      };

      if (statusField === 'analyst_status') {
        updateData.analyst_status = newPhase;
      } else {
        updateData.status = newPhase;
      }

      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", property.id);

      if (error) {
        console.error("Error changing phase:", error);
        toast.error("Error al cambiar la fase");
        return;
      }

      toast.success(`Fase cambiada a: ${phaseOptions.find((p) => p.value === newPhase)?.label || newPhase}`);
      onPhaseChanged?.();
    } catch (error) {
      console.error("Error changing phase:", error);
      toast.error("Error al cambiar la fase");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isChanging}>
          {currentPhaseLabel}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {phaseOptions.map((phase) => (
          <DropdownMenuItem
            key={phase.value}
            onClick={() => handlePhaseChange(phase.value)}
            disabled={phase.value === currentPhase}
          >
            {phase.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
