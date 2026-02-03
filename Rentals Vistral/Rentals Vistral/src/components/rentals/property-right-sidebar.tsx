"use client";

import { generateInitials } from "@/lib/utils";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface PropertyRightSidebarProps {
  property: Property;
  // Optional: SLA target days (defaults to 30 if not provided)
  slaTargetDays?: number;
  // Optional: Supabase property data with rental management fields
  supabaseProperty?: {
    rental_type?: "Larga estancia" | "Corta estancia" | "Vacacional" | null;
    property_management_plan?: "Premium" | "Basic" | null;
    property_manager?: string | null;
    rentals_analyst?: string | null;
    client_full_name?: string | null;
    keys_location?: string | null;
    admin_name?: string | null;
    updated_at?: string | null;
    created_at?: string | null;
  } | null;
}

export function PropertyRightSidebar({
  property,
  slaTargetDays = 30,
  supabaseProperty,
}: PropertyRightSidebarProps) {
  // Helper function to format date
  const formatLastChange = (updatedAt: string | null | undefined) => {
    if (!updatedAt) return null;
    const date = new Date(updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "menos de 1 hora";
    if (diffHours === 1) return "1 hora";
    return `${diffHours} horas`;
  };

  const lastChange = supabaseProperty?.updated_at
    ? formatLastChange(supabaseProperty.updated_at)
    : null;

  // Helper function to format creation date
  const formatCreationDate = (createdAt: string | null | undefined) => {
    if (!createdAt) return null;
    try {
      const date = new Date(createdAt);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return null;
    }
  };

  const creationDate = supabaseProperty?.created_at
    ? formatCreationDate(supabaseProperty.created_at)
    : null;

  // Helper function to get display value or fallback
  const getDisplayValue = (value: string | null | undefined, fallback: string = "-") => {
    return value || fallback;
  };

  // Helper function to extract name and first last name from full name
  // Assumes Spanish format: "Nombre Apellido1 Apellido2" -> returns "Nombre Apellido1"
  const getNameAndFirstLastName = (fullName: string | null | undefined): string | null => {
    if (!fullName || typeof fullName !== "string") return null;
    
    const trimmed = fullName.trim();
    if (!trimmed) return null;
    
    const words = trimmed.split(/\s+/).filter(word => word.length > 0);
    
    // If only one word, return it
    if (words.length === 1) return words[0];
    
    // If multiple words, return first two words (name + first last name)
    if (words.length >= 2) return `${words[0]} ${words[1]}`;
    
    return null;
  };

  // Helper function to generate initials from name and first last name (two letters, no space)
  const getNameAndFirstLastNameInitials = (fullName: string | null | undefined): string | undefined => {
    if (!fullName || typeof fullName !== "string") return undefined;
    
    const trimmed = fullName.trim();
    if (!trimmed) return undefined;
    
    const words = trimmed.split(/\s+/).filter(word => word.length > 0);
    
    // If only one word, take first two letters
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    // If multiple words, take first letter of first word and first letter of second word
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    
    return undefined;
  };

  // Component for rendering name with initials badge
  const NameWithBadge = ({ name }: { name: string | null | undefined }) => {
    if (!name) return <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">-</span>;
    
    const initials = generateInitials(name);
    
    return (
      <div className="flex items-center gap-2.5">
        {/* Initials Badge */}
        {initials && (
          <div className="w-7 h-7 rounded-full bg-[#F3F4F6] dark:bg-[#374151] flex items-center justify-center flex-shrink-0 border border-[#E5E7EB] dark:border-[#4B5563]">
            <span className="text-[11px] font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
              {initials}
            </span>
          </div>
        )}
        {/* Full Name */}
        <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">
          {name}
        </span>
      </div>
    );
  };

  // Component for rendering investor with name and first last name
  const InvestorWithBadge = ({ fullName }: { fullName: string | null | undefined }) => {
    const nameAndFirstLastName = getNameAndFirstLastName(fullName);
    const initials = getNameAndFirstLastNameInitials(fullName);
    
    if (!nameAndFirstLastName) return <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">-</span>;
    
    return (
      <div className="flex items-center gap-2.5">
        {/* Initials Badge */}
        {initials && (
          <div className="w-7 h-7 rounded-full bg-[#F3F4F6] dark:bg-[#374151] flex items-center justify-center flex-shrink-0 border border-[#E5E7EB] dark:border-[#4B5563]">
            <span className="text-[11px] font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
              {initials}
            </span>
          </div>
        )}
        {/* Name and First Last Name */}
        <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">
          {nameAndFirstLastName}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full lg:w-80 border-l-0 lg:border-l bg-white dark:bg-[var(--prophero-gray-900)] rounded-lg border border-[var(--prophero-gray-200)] dark:border-[var(--prophero-gray-800)] shadow-sm">
      <div className="p-6">
        {/* Title */}
        <h2 className="text-xl font-bold text-[#111827] dark:text-[#F9FAFB] mb-2">
          Gestión de Alquiler
        </h2>

        {/* Last change timestamp */}
        {lastChange && (
          <p className="text-xs text-[#9CA3AF] dark:text-[#6B7280] mb-6">
            Última modificación hace {lastChange}
          </p>
        )}

        {/* Key-Value Pairs */}
        <div className="space-y-0">
          {/* Tipo de alquiler */}
          <div className="flex justify-between items-center gap-4 py-3 border-b border-[#F3F4F6] dark:border-[#374151]">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0">
              Tipo de alquiler
            </span>
            <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] text-right">
              {getDisplayValue(supabaseProperty?.rental_type)}
            </span>
          </div>

          {/* Plan PM */}
          <div className="flex justify-between items-center gap-4 py-3 border-b border-[#F3F4F6] dark:border-[#374151]">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0">
              Plan PM
            </span>
            <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] text-right">
              {getDisplayValue(supabaseProperty?.property_management_plan)}
            </span>
          </div>

          {/* Property Manager */}
          <div className="flex justify-between items-center gap-4 py-3 border-b border-[#F3F4F6] dark:border-[#374151]">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0">
              Property Manager
            </span>
            <div className="text-right flex items-center justify-end">
              <NameWithBadge name={supabaseProperty?.property_manager} />
            </div>
          </div>

          {/* Analista de Rentals */}
          <div className="flex justify-between items-center gap-4 py-3 border-b border-[#F3F4F6] dark:border-[#374151]">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0">
              Analista de Rentals
            </span>
            <div className="text-right flex items-center justify-end">
              <NameWithBadge name={supabaseProperty?.rentals_analyst} />
            </div>
          </div>

          {/* Inversor */}
          <div className="flex justify-between items-center gap-4 py-3 border-b border-[#F3F4F6] dark:border-[#374151]">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0">
              Inversor
            </span>
            <div className="text-right flex items-center justify-end">
              <InvestorWithBadge fullName={supabaseProperty?.client_full_name} />
            </div>
          </div>

          {/* Localización de Llaves */}
          <div className="flex justify-between items-center gap-4 py-3 border-b border-[#F3F4F6] dark:border-[#374151]">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0">
              Localización de Llaves
            </span>
            <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] text-right">
              {getDisplayValue(supabaseProperty?.keys_location)}
            </span>
          </div>

          {/* Administrador */}
          <div className="flex justify-between items-center gap-4 py-3 border-b border-[#F3F4F6] dark:border-[#374151]">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0">
              Administrador
            </span>
            <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] text-right">
              {getDisplayValue(supabaseProperty?.admin_name)}
            </span>
          </div>
        </div>

        {/* Footer - Property creation date */}
        {creationDate && (
          <div className="mt-6 pt-4">
            <p className="text-xs text-[#9CA3AF] dark:text-[#6B7280]">
              Propiedad creada el {creationDate}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
