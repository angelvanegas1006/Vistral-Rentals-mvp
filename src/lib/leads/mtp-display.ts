import type { MtpStatusId } from "./mtp-status";

export interface MtpStatusDisplay {
  id: MtpStatusId;
  label: string;
  accentBorder: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

export const MTP_ACTIVE_STATUSES: MtpStatusDisplay[] = [
  {
    id: "interesado_cualificado",
    label: "Interesado Cualificado",
    accentBorder: "border-l-blue-300 dark:border-l-blue-400",
    badgeBg: "bg-blue-100 dark:bg-blue-900/50",
    badgeText: "text-blue-700 dark:text-blue-300",
    dotColor: "bg-blue-500",
  },
  {
    id: "visita_agendada",
    label: "Visita Agendada",
    accentBorder: "border-l-indigo-400 dark:border-l-indigo-500",
    badgeBg: "bg-indigo-100 dark:bg-indigo-900/50",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    dotColor: "bg-indigo-500",
  },
  {
    id: "pendiente_de_evaluacion",
    label: "Pendiente de Evaluación",
    accentBorder: "border-l-violet-400 dark:border-l-violet-400",
    badgeBg: "bg-violet-100 dark:bg-violet-900/50",
    badgeText: "text-violet-700 dark:text-violet-300",
    dotColor: "bg-violet-500",
  },
  {
    id: "esperando_decision",
    label: "Esperando Decisión",
    accentBorder: "border-l-purple-400 dark:border-l-purple-500",
    badgeBg: "bg-purple-100 dark:bg-purple-900/50",
    badgeText: "text-purple-700 dark:text-purple-300",
    dotColor: "bg-purple-500",
  },
  {
    id: "recogiendo_informacion",
    label: "Recogiendo Información",
    accentBorder: "border-l-amber-400 dark:border-l-amber-400",
    badgeBg: "bg-amber-100 dark:bg-amber-900/50",
    badgeText: "text-amber-700 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
  {
    id: "calificacion_en_curso",
    label: "Calificación en Curso",
    accentBorder: "border-l-orange-400 dark:border-l-orange-500",
    badgeBg: "bg-orange-100 dark:bg-orange-900/50",
    badgeText: "text-orange-700 dark:text-orange-300",
    dotColor: "bg-orange-500",
  },
  {
    id: "interesado_presentado",
    label: "Interesado Presentado",
    accentBorder: "border-l-teal-400 dark:border-l-teal-400",
    badgeBg: "bg-teal-100 dark:bg-teal-900/50",
    badgeText: "text-teal-700 dark:text-teal-300",
    dotColor: "bg-teal-500",
  },
];

export const MTP_INACTIVE_STATUSES: MtpStatusDisplay[] = [
  {
    id: "rechazado_por_finaer",
    label: "Rechazado por Finaer",
    accentBorder: "border-l-red-400 dark:border-l-red-500",
    badgeBg: "bg-red-100 dark:bg-red-900/50",
    badgeText: "text-red-700 dark:text-red-300",
    dotColor: "bg-red-500",
  },
  {
    id: "rechazado_por_propietario",
    label: "Rechazado por el Propietario",
    accentBorder: "border-l-rose-400 dark:border-l-rose-500",
    badgeBg: "bg-rose-100 dark:bg-rose-900/50",
    badgeText: "text-rose-700 dark:text-rose-300",
    dotColor: "bg-rose-500",
  },
  {
    id: "interesado_rechazado",
    label: "Interesado Rechazado",
    accentBorder: "border-l-pink-400 dark:border-l-pink-500",
    badgeBg: "bg-pink-100 dark:bg-pink-900/50",
    badgeText: "text-pink-700 dark:text-pink-300",
    dotColor: "bg-pink-500",
  },
  {
    id: "interesado_perdido",
    label: "Interesado Perdido",
    accentBorder: "border-l-stone-400 dark:border-l-stone-500",
    badgeBg: "bg-stone-100 dark:bg-stone-800/50",
    badgeText: "text-stone-700 dark:text-stone-300",
    dotColor: "bg-stone-500",
  },
  {
    id: "descartada",
    label: "Descartada",
    accentBorder: "border-l-gray-400 dark:border-l-gray-500",
    badgeBg: "bg-gray-100 dark:bg-gray-800/50",
    badgeText: "text-gray-700 dark:text-gray-300",
    dotColor: "bg-gray-500",
  },
  {
    id: "en_espera",
    label: "En Espera",
    accentBorder: "border-l-yellow-400 dark:border-l-yellow-500",
    badgeBg: "bg-yellow-100 dark:bg-yellow-900/50",
    badgeText: "text-yellow-700 dark:text-yellow-300",
    dotColor: "bg-yellow-500",
  },
];

export const ALL_MTP_DISPLAY_STATUSES: MtpStatusDisplay[] = [
  ...MTP_ACTIVE_STATUSES,
  ...MTP_INACTIVE_STATUSES,
];

export const MTP_DISPLAY_MAP = new Map<string, MtpStatusDisplay>(
  ALL_MTP_DISPLAY_STATUSES.map((s) => [s.id, s])
);

export interface InterestedLeadItem {
  leadId: string;
  leadUuid: string;
  leadName: string;
  mtpStatus: string;
}
