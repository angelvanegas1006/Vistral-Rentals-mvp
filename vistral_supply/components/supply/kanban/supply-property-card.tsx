"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { SupplyKanbanPhase } from "@/lib/supply-kanban-config";

interface SupplyPropertyCardProps {
  id: string;
  address: string;
  stage: SupplyKanbanPhase;
  price?: number;
  analyst?: string;
  completion?: number;
  correctionsCount?: number;
  timeInStage: string;
  timeCreated?: string;
  onClick?: () => void;
  disabled?: boolean;
  isHighlighted?: boolean;
  // Supply Analyst specific fields
  tags?: string[];
  totalInvestment?: number;
  rejectionReasons?: string[];
  assignedTo?: string;
}

export function SupplyPropertyCard({
  id,
  address,
  stage,
  price,
  analyst,
  completion,
  correctionsCount,
  timeInStage,
  timeCreated,
  onClick,
  disabled = false,
  isHighlighted = false,
  tags,
  totalInvestment,
  rejectionReasons,
  assignedTo,
}: SupplyPropertyCardProps) {
  // Helper to get analyst initials
  const getAnalystInitials = (analystName?: string) => {
    if (!analystName) return "";
    const parts = analystName.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return analystName.substring(0, 2).toUpperCase();
  };

  return (
    <div 
      data-property-id={id}
      className={cn(
        "rounded-lg border border-border bg-card dark:bg-[var(--prophero-gray-900)] p-4 shadow-sm w-full overflow-hidden",
        "transition-all duration-500 ease-out",
        disabled 
          ? "cursor-not-allowed opacity-60" 
          : "cursor-pointer hover:border-2 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.15)]",
        isHighlighted 
          ? "ring-2 ring-[var(--prophero-blue-500)] shadow-lg border-[var(--prophero-blue-500)] bg-[var(--prophero-blue-50)] dark:bg-[var(--prophero-blue-950)]/30" 
          : "",
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* ID */}
      <div className="text-xs font-semibold text-muted-foreground mb-2">ID {id}</div>
      
      {/* Address */}
      <div className="text-sm font-medium text-foreground mb-3">{address}</div>

      {/* Partner Kanban stages */}
      {stage === "draft" && timeCreated && (
        <div className="text-xs text-muted-foreground">Borrador creado hace {timeCreated}</div>
      )}

      {stage === "in-review" && analyst && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--prophero-gray-200)] dark:bg-[var(--prophero-gray-700)]">
              <span className="text-xs font-semibold text-foreground">{getAnalystInitials(analyst)}</span>
            </div>
            <span className="text-xs text-muted-foreground">Supply Analyst</span>
          </div>
          <div className="text-xs text-muted-foreground">En revisión hace {timeInStage}</div>
        </div>
      )}

      {/* Supply Analyst Kanban stages */}
      {stage === "backlog" && (
        <div className="space-y-2">
          {completion !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{completion}% data completition</span>
              </div>
              <Progress value={completion} className="h-2" />
            </div>
          )}
          {!assignedTo && (
            <div className="text-xs text-muted-foreground">No supply analyst assigned</div>
          )}
          {timeInStage && (
            <div className="text-xs text-muted-foreground">Updated {timeInStage}</div>
          )}
        </div>
      )}

      {stage === "under-review" && (
        <div className="space-y-2">
          {completion !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{completion}% data completition</span>
              </div>
              <Progress value={completion} className="h-2" />
            </div>
          )}
          {analyst && (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--prophero-gray-200)] dark:bg-[var(--prophero-gray-700)]">
                <span className="text-xs font-semibold text-foreground">{getAnalystInitials(analyst)}</span>
              </div>
              <span className="text-xs text-muted-foreground">Supply Analyst</span>
            </div>
          )}
          {timeInStage && (
            <div className="text-xs text-muted-foreground">Updated {timeInStage}</div>
          )}
        </div>
      )}

      {(stage as string) === "needs-correction" && analyst && (
        <div className="space-y-2">
          {correctionsCount !== undefined && correctionsCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400">
                {correctionsCount} corrections to resolve
              </span>
            </div>
          )}
          {analyst && (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--prophero-gray-200)] dark:bg-[var(--prophero-gray-700)]">
                <span className="text-xs font-semibold text-foreground">{getAnalystInitials(analyst)}</span>
              </div>
              <span className="text-xs text-muted-foreground">Supply Analyst</span>
            </div>
          )}
          {timeInStage && (
            <div className="text-xs text-muted-foreground">Updated {timeInStage}</div>
          )}
        </div>
      )}

      {(stage === "renovation-estimation" || stage === "financial-analysis" || stage === "in-negotiation" || stage === "arras") && (
        <div className="space-y-2">
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-[var(--prophero-gray-200)] dark:bg-[var(--prophero-gray-700)] px-2 py-1 text-xs font-medium text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {analyst && (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--prophero-gray-200)] dark:bg-[var(--prophero-gray-700)]">
                <span className="text-xs font-semibold text-foreground">{getAnalystInitials(analyst)}</span>
              </div>
              <span className="text-xs text-muted-foreground">Supply Analyst</span>
            </div>
          )}
          {timeInStage && (
            <div className="text-xs text-muted-foreground">Updated {timeInStage}</div>
          )}
        </div>
      )}

      {stage === "done" && (
        <div className="space-y-2">
          {totalInvestment !== undefined && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Total investment</div>
              <div className="text-sm font-semibold text-foreground">
                {new Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 2,
                }).format(totalInvestment)}
              </div>
            </div>
          )}
          {analyst && (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--prophero-gray-200)] dark:bg-[var(--prophero-gray-700)]">
                <span className="text-xs font-semibold text-foreground">{getAnalystInitials(analyst)}</span>
              </div>
              <span className="text-xs text-muted-foreground">Supply Analyst</span>
            </div>
          )}
          {timeInStage && (
            <div className="text-xs text-muted-foreground">Updated {timeInStage}</div>
          )}
        </div>
      )}

      {stage === "rejected" && (
        <div className="space-y-2">
          {rejectionReasons && rejectionReasons.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {rejectionReasons.map((reason, index) => (
                <span
                  key={index}
                  className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
          {analyst && (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--prophero-gray-200)] dark:bg-[var(--prophero-gray-700)]">
                <span className="text-xs font-semibold text-foreground">{getAnalystInitials(analyst)}</span>
              </div>
              <span className="text-xs text-muted-foreground">Supply Analyst</span>
            </div>
          )}
          {timeInStage && (
            <div className="text-xs text-muted-foreground">Updated {timeInStage}</div>
          )}
        </div>
      )}

      {/* Partner stages (settlement, arras, sold) */}
      {["settlement", "arras", "sold", "pending-to-settlement"].includes(stage as string) && (
        <div className="space-y-2">
          {price && (
            <div className="text-sm font-semibold text-foreground">
              {new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 2,
              }).format(price)}
            </div>
          )}
          {analyst && (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--prophero-gray-200)] dark:bg-[var(--prophero-gray-700)]">
                <span className="text-xs font-semibold text-foreground">{getAnalystInitials(analyst)}</span>
              </div>
              <span className="text-xs text-muted-foreground">Supply Analyst</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">{timeInStage}</div>
        </div>
      )}
    </div>
  );
}
