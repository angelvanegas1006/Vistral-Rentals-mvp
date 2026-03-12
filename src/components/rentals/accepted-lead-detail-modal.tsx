"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LeadSummaryTab } from "./lead-summary-tab";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  currentPhase: string;
  occupant_count?: number | null;
  move_in_timeframe?: string | null;
  lease_duration_preference?: string | null;
  employment_status?: string | null;
  job_title?: string | null;
  monthly_net_income?: number | null;
  has_guarantor?: boolean | null;
}

interface AcceptedLeadDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onLeadUpdate?: () => Promise<void> | void;
}

export function AcceptedLeadDetailModal({
  open,
  onOpenChange,
  lead,
  onLeadUpdate,
}: AcceptedLeadDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogTitle className="text-lg font-semibold">
          Detalles del Interesado Aceptado
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Información completa del interesado aceptado para esta propiedad.
        </DialogDescription>
        <div className="mt-2">
          <LeadSummaryTab lead={lead} onLeadUpdate={onLeadUpdate} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
