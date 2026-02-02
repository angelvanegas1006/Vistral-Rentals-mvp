// Datos compartidos de leads entre Kanban de Leads y PublishedTasks

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  zone?: string;
  currentPhase: string;
  interestedProperty?: {
    id: string;
    address: string;
    city?: string;
  };
  interestedProperties?: Array<{
    id: string;
    address: string;
    city?: string;
  }>;
  isHighlighted?: boolean;
  needsUpdate?: boolean;
  // Campos adicionales para PublishedTasks
  called?: "Si" | "No";
  discarded?: "Si" | "No";
  scheduledDate?: string;
  visitDate?: string;
  qualified?: "Si" | "No";
  // Campos adicionales para Resumen Lead
  averageIncome?: number;
  finaerStatus?: "pending-upload" | "pending-accepted" | "accepted";
  numberOfOccupants?: number;
}

// Datos mock compartidos
export const mockLeadsData: Lead[] = [
  {
    id: "LEAD-001",
    name: "Juan Pérez",
    phone: "+34 600 123 456",
    email: "juan.perez@email.com",
    interestedProperty: {
      id: "PROP-006",
      address: "Calle Alcalá 100, 5º E",
      city: "Madrid",
    },
    zone: "Centro",
    currentPhase: "Sin Contactar",
    called: "No",
    discarded: "No",
  },
  {
    id: "LEAD-002",
    name: "María García",
    phone: "+34 611 234 567",
    email: "maria.garcia@email.com",
    zone: "Chamberí",
    currentPhase: "Sin Contactar",
    called: "Si",
    discarded: "No",
    scheduledDate: "2025-01-15",
  },
  {
    id: "LEAD-003",
    name: "Carlos López",
    phone: "+34 622 345 678",
    email: "carlos.lopez@email.com",
    interestedProperty: {
      id: "PROP-006",
      address: "Calle Alcalá 100, 5º E",
      city: "Madrid",
    },
    zone: "Centro",
    currentPhase: "Agendados",
    visitDate: "2025-01-20",
    discarded: "No",
  },
  {
    id: "LEAD-004",
    name: "Ana Martínez",
    phone: "+34 633 456 789",
    email: "ana.martinez@email.com",
    interestedProperty: {
      id: "PROP-006",
      address: "Calle Alcalá 100, 5º E",
      city: "Madrid",
    },
    zone: "Centro",
    currentPhase: "Visita Hecha / Pendiente de Doc.",
    discarded: "No",
    qualified: "Si",
  },
  {
    id: "LEAD-005",
    name: "Pedro Sánchez",
    phone: "+34 644 567 890",
    email: "pedro.sanchez@email.com",
    interestedProperty: {
      id: "PROP-006",
      address: "Calle Alcalá 100, 5º E",
      city: "Madrid",
    },
    zone: "Centro",
    currentPhase: "Inquilino Aceptado",
  },
  {
    id: "LEAD-006",
    name: "Laura Fernández",
    phone: "+34 655 678 901",
    email: "laura.fernandez@email.com",
    zone: "Salamanca",
    currentPhase: "Descartados",
  },
];

// Función helper para obtener leads por fase
export function getLeadsByPhase(phase: string): Lead[] {
  return mockLeadsData.filter((lead) => lead.currentPhase === phase);
}

// Función helper para obtener leads por propiedad
export function getLeadsByProperty(propertyId: string): Lead[] {
  return mockLeadsData.filter(
    (lead) =>
      lead.interestedProperty?.id === propertyId ||
      lead.interestedProperties?.some((p) => p.id === propertyId)
  );
}
