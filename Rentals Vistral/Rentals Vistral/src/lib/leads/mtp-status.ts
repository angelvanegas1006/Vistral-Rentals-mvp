/**
 * Estados de la Mini Tarjeta Propiedad (MTP) y mapeo a fases del Lead.
 * Documentación: docs/Maquina_estados_leads_properties
 */

/** Nombres de fase del Lead (para coincidir con LEAD_PHASE_TITLES del Kanban) */
export const LEAD_PHASE_NAMES = {
  "interesado-cualificado": "Interesado Cualificado",
  "visita-agendada": "Visita Agendada",
  "recogiendo-informacion": "Recogiendo Información",
  "calificacion-en-curso": "Calificación en Curso",
  "calificacion-aprobada": "Interesado Presentado",
  "inquilino-aceptado": "Interesado Aceptado",
  "interesado-perdido": "Interesado Perdido",
  "interesado-rechazado": "Interesado Rechazado",
} as const;

export const MTP_STATUS_IDS = [
  "interesado_cualificado",
  "visita_agendada",
  "pendiente_de_evaluacion",
  "esperando_decision",
  "recogiendo_informacion",
  "calificacion_en_curso",
  "interesado_presentado",
  "interesado_aceptado",
  "en_espera",
  "descartada",
  "no_disponible",
] as const;

export type MtpStatusId = (typeof MTP_STATUS_IDS)[number];

export const MTP_STATUS_TITLES: Record<MtpStatusId, string> = {
  interesado_cualificado: "Interesado Cualificado",
  visita_agendada: "Visita Agendada",
  pendiente_de_evaluacion: "Pendiente de Evaluación",
  esperando_decision: "Esperando Decisión",
  recogiendo_informacion: "Recogiendo Información",
  calificacion_en_curso: "Calificación en Curso",
  interesado_presentado: "Interesado Presentado",
  interesado_aceptado: "Interesado Aceptado",
  en_espera: "En Espera",
  descartada: "Descartada",
  no_disponible: "No Disponible",
};

/** Rango numérico para calcular el estado más avanzado (mayor = más avanzado) */
export const MTP_STATUS_RANK: Record<MtpStatusId, number> = {
  interesado_cualificado: 1,
  visita_agendada: 2,
  pendiente_de_evaluacion: 3,
  esperando_decision: 4,
  recogiendo_informacion: 5,
  calificacion_en_curso: 6,
  interesado_presentado: 7,
  interesado_aceptado: 8,
  en_espera: 0,
  descartada: 0,
  no_disponible: 0,
};

/** MTP activas: contribuyen al cálculo de fase del Lead. Excluye estados de salida. */
export const MTP_EXIT_STATUS_IDS: MtpStatusId[] = [
  "en_espera",
  "descartada",
  "no_disponible",
];

export function isMtpActive(status: string): boolean {
  return !MTP_EXIT_STATUS_IDS.includes(status as MtpStatusId);
}

/**
 * Mapeo MTP status -> Lead phase ID (para calcular fase del Interesado).
 * Los phase IDs coinciden con LEAD_PHASE_IDS del Kanban.
 */
export type LeadPhaseId = keyof typeof LEAD_PHASE_NAMES;

export const MTP_STATUS_TO_LEAD_PHASE: Record<MtpStatusId, LeadPhaseId | null> = {
  interesado_cualificado: "interesado-cualificado",
  visita_agendada: "visita-agendada",
  pendiente_de_evaluacion: "visita-agendada",
  esperando_decision: "visita-agendada",
  recogiendo_informacion: "recogiendo-informacion",
  calificacion_en_curso: "calificacion-en-curso",
  interesado_presentado: "calificacion-aprobada",
  interesado_aceptado: "inquilino-aceptado",
  en_espera: null,
  descartada: null,
  no_disponible: null,
};

export function mtpStatusToLeadPhase(mtpStatus: string): string | null {
  const phaseId = MTP_STATUS_TO_LEAD_PHASE[mtpStatus as MtpStatusId];
  return phaseId ? LEAD_PHASE_NAMES[phaseId] : null;
}

/** Dado un array de MTP statuses activos, devuelve la fase del Lead (nombre para mostrar) */
export function getLeadPhaseFromMtpStatuses(statuses: string[]): string {
  const active = statuses.filter(isMtpActive);
  if (active.length === 0) return LEAD_PHASE_NAMES["interesado-cualificado"];

  let maxRank = 0;
  let bestPhaseId: LeadPhaseId = "interesado-cualificado";


  for (const s of active) {
    const rank = MTP_STATUS_RANK[s as MtpStatusId] ?? 0;
    const phaseId = MTP_STATUS_TO_LEAD_PHASE[s as MtpStatusId];
    if (rank > maxRank && phaseId) {
      maxRank = rank;
      bestPhaseId = phaseId;
    }
  }

  return LEAD_PHASE_NAMES[bestPhaseId];
}
