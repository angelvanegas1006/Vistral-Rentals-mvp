"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  zone?: string;
  currentPhase: string;
  interestedProperties?: Array<{
    id: string;
    address: string;
    city?: string;
  }>;
}

interface LeadTasksTabProps {
  lead: Lead;
}

export function LeadTasksTab({ lead }: LeadTasksTabProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No hay tareas específicas para esta fase. Las tareas se definirán más adelante.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
