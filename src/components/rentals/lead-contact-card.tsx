import { Phone, Mail } from "lucide-react";

interface LeadContactCardProps {
  name: string;
  phone: string;
  email?: string;
}

export function LeadContactCard({ name, phone, email }: LeadContactCardProps) {
  return (
    <div className="w-full lg:w-80 border-l-0 lg:border-l bg-white dark:bg-[var(--vistral-gray-900)] rounded-lg border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-800)] shadow-sm">
      <div className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Información de Contacto
        </h2>

        <div className="space-y-0">
          {/* Nombre */}
          <div className="flex justify-between items-center gap-4 py-3 border-b border-[#F3F4F6] dark:border-[#374151]">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0">
              Nombre
            </span>
            <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] text-right truncate">
              {name || "-"}
            </span>
          </div>

          {/* Teléfono */}
          <div className="flex justify-between items-center gap-4 py-3 border-b border-[#F3F4F6] dark:border-[#374151]">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0">
              Teléfono
            </span>
            <div className="text-right flex items-center justify-end gap-1.5">
              {phone ? (
                <>
                  <Phone className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-[#6B7280] flex-shrink-0" />
                  <a
                    href={`tel:${phone}`}
                    className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                  >
                    {phone}
                  </a>
                </>
              ) : (
                <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">-</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex justify-between items-center gap-4 py-3 border-b border-[#F3F4F6] dark:border-[#374151]">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0">
              Email
            </span>
            <div className="text-right flex items-center justify-end gap-1.5 min-w-0">
              {email ? (
                <>
                  <Mail className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-[#6B7280] flex-shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                  >
                    {email}
                  </a>
                </>
              ) : (
                <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">-</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
