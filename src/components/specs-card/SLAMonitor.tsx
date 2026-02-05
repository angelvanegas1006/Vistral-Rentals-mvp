"use client";

import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SLAMonitorProps {
  daysInPhase: number;
  slaTargetDays: number;
}

export function SLAMonitor({ daysInPhase, slaTargetDays }: SLAMonitorProps) {
  const isOverdue = daysInPhase > slaTargetDays;
  const progressPercentage = Math.min((daysInPhase / slaTargetDays) * 100, 100);
  const riskThreshold = slaTargetDays * 0.8;
  
  // Determine health state
  let barColor = "bg-green-500";
  let barBgColor = "bg-green-100 dark:bg-green-900/20";
  let statusText = "";
  let statusColor = "";
  
  if (isOverdue) {
    barColor = "bg-red-500";
    barBgColor = "bg-red-100 dark:bg-red-900/20";
    const overdueDays = daysInPhase - slaTargetDays;
    statusText = `${overdueDays} ${overdueDays === 1 ? "día" : "días"} fuera de plazo`;
    statusColor = "text-red-700 dark:text-red-400";
  } else if (daysInPhase > riskThreshold) {
    barColor = "bg-yellow-500";
    barBgColor = "bg-yellow-100 dark:bg-yellow-900/20";
    statusText = "Riesgo";
    statusColor = "text-yellow-700 dark:text-yellow-400";
  } else {
    barColor = "bg-green-500";
    barBgColor = "bg-green-100 dark:bg-green-900/20";
    statusText = "En plazo";
    statusColor = "text-green-700 dark:text-green-400";
  }

  return (
    <Card className="border-gray-200 dark:border-zinc-700 shadow-sm dark:bg-zinc-800">
      <div className="border-b border-gray-100 dark:border-zinc-700 bg-gray-100/50 dark:bg-zinc-800 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
          Tiempo en fase
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {/* Header: Label + Value */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-zinc-400">
            Tiempo en fase
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
            Día {daysInPhase} de {slaTargetDays}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className={cn(
            "h-2 w-full rounded-full overflow-hidden",
            barBgColor
          )}>
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                barColor
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Status Text */}
          {statusText && (
            <div className="flex items-center gap-1.5">
              {isOverdue && (
                <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              )}
              <span className={cn("text-xs font-medium", statusColor)}>
                {statusText}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
