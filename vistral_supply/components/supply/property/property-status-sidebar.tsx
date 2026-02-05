"use client";

import { PropertyWithUsers } from "@/lib/supply-property-supabase";
import { useI18n } from "@/lib/i18n";
import { SupplyKanbanPhase } from "@/lib/supply-kanban-config";
import { useRouter } from "next/navigation";

interface PropertyStatusSidebarProps {
  property: PropertyWithUsers;
}

export function PropertyStatusSidebar({ property }: PropertyStatusSidebarProps) {
  const { t } = useI18n();
  const router = useRouter();

  // Get status title based on current stage or analyst status
  const getStatusTitle = (stage: string, analystStatus?: string | null): string => {
    // If analyst status is financial-analysis, show Financial Analysis
    if (analystStatus === "financial-analysis") {
      return t.propertyDetail.status.financialAnalysis;
    }
    
    const statusMap: Record<string, string> = {
      draft: t.propertyDetail.status.draft,
      "in-review": t.propertyDetail.status.underReview,
      "needs-correction": t.propertyDetail.status.needsCorrection,
      "financial-analysis": t.propertyDetail.status.financialAnalysis,
      "in-negotiation": t.propertyDetail.status.inNegotiation,
      arras: t.propertyDetail.status.arras,
      settlement: t.propertyDetail.status.settlement,
      sold: t.propertyDetail.status.sold,
      rejected: t.propertyDetail.status.rejected,
    };
    return statusMap[stage] || stage;
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString?: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays} ${diffDays === 1 ? t.propertyDetail.status.day : t.propertyDetail.status.days}`;
      } else if (diffHours > 0) {
        return `${diffHours} ${diffHours === 1 ? t.propertyDetail.status.hour : t.propertyDetail.status.hours}`;
      } else {
        return t.propertyDetail.status.lessThanAnHour;
      }
    } catch {
      return "";
    }
  };

  // Get partner initials
  const getPartnerInitials = (): string => {
    if (!property.partnerName) return "";
    const parts = property.partnerName.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return property.partnerName.substring(0, 2).toUpperCase();
  };

  // Get analyst initials
  const getAnalystInitials = (): string => {
    if (!property.analystName) return "";
    const parts = property.analystName.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return property.analystName.substring(0, 2).toUpperCase();
  };

  const statusTitle = getStatusTitle(property.currentStage, property.analystStatus);
  const lastChange = property.lastSaved || property.createdAt;
  const createdAt = property.createdAt;
  const isFinancialAnalysis = property.analystStatus === "financial-analysis";

  const handleMakeFinancialEstimate = () => {
    router.push(`/supply/property/${property.id}/financial-estimate`);
  };

  return (
    <div className="w-full lg:w-[384px]">
      {/* Card container with white background, rounded corners, and shadow */}
      <div className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-5 flex flex-col gap-4 box-border w-full">
        {/* Status Title Section */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center justify-between w-full gap-4">
            <h3 className="text-[32px] font-medium text-[#212121] leading-[38px] tracking-[-2px]">
              {statusTitle}
            </h3>
            {isFinancialAnalysis && (
              <button
                onClick={handleMakeFinancialEstimate}
                className="flex items-center justify-center text-sm font-medium h-8 px-4 bg-[#2050F6] hover:bg-[#1a40d0] text-white rounded-full transition-colors flex-shrink-0"
                style={{ borderRadius: '20px' }}
              >
                {t.propertyDetail.makeFinancialEstimate}
              </button>
            )}
          </div>
          {lastChange && (
            <div className="text-sm font-medium text-[#71717A] leading-5 tracking-[-0.5px]">
              {t.propertyDetail.status.lastChange} {formatTimeAgo(lastChange)}
            </div>
          )}
        </div>

        {/* Data Block List */}
        <div className="flex flex-col items-start w-full">
          {/* Partner Section */}
          <div className="flex flex-col items-start pt-4 gap-4 w-full">
            <div className="flex flex-row justify-between items-center w-full gap-4 min-w-0">
              <span className="text-base font-medium text-[#71717A] leading-6 tracking-[-0.7px] flex-shrink-0">
                {t.propertyDetail.status.partner}
              </span>
              {property.partnerName ? (
                <div className="flex flex-row items-center gap-2 flex-1 min-w-0 justify-end">
                  <div className="w-6 h-6 rounded-full bg-[#E4E4E7] text-[#71717A] flex items-center justify-center text-sm font-medium relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-white opacity-48"></div>
                    <span className="relative z-10">{getPartnerInitials()}</span>
                  </div>
                  <span className="text-base font-normal text-[#212121] leading-6 tracking-[-0.7px] text-right truncate">
                    {property.partnerName}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-0 border border-[#E4E4E7] mt-4" />

          {/* Supply Analyst Section */}
          <div className="flex flex-col items-start pt-4 gap-4 w-full">
            <div className="flex flex-row justify-between items-center w-full gap-4 min-w-0">
              <span className="text-base font-medium text-[#71717A] leading-6 tracking-[-0.7px] flex-shrink-0">
                {t.propertyDetail.status.supplyAnalyst}
              </span>
              {property.analystName ? (
                <div className="flex flex-row items-center gap-2 flex-1 min-w-0 justify-end">
                  <div className="w-6 h-6 rounded-full bg-[#E4E4E7] text-[#71717A] flex items-center justify-center text-sm font-medium relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-white opacity-48"></div>
                    <span className="relative z-10">{getAnalystInitials()}</span>
                  </div>
                  <span className="text-base font-normal text-[#212121] leading-6 tracking-[-0.7px] text-right truncate">
                    {property.analystName}
                  </span>
                </div>
              ) : (
                <span className="text-base font-normal text-[#212121] leading-6 tracking-[-0.7px] text-right truncate">
                  {t.propertyDetail.status.awaitingAssignment}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Property Created Date */}
        {createdAt && (
          <div className="flex flex-row flex-wrap items-center w-full">
            <div className="text-sm font-normal text-[#71717A] leading-5 tracking-[-0.5px]">
              {t.propertyDetail.status.propertyCreatedOn} {formatDate(createdAt)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
