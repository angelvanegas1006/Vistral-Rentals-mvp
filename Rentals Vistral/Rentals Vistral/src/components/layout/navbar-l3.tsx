"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarL3Props {
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  className?: string;
}

export function NavbarL3({
  primaryAction,
  secondaryAction,
  className,
}: NavbarL3Props) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 border-t bg-card dark:bg-[var(--vistral-gray-900)]",
        "px-4 md:px-6 lg:px-8 py-3 md:py-4",
        "md:static md:border-t-0",
        className
      )}
    >
      <div className="flex items-center justify-end gap-3 max-w-[1600px] mx-auto">
        {secondaryAction && (
          <Button
            variant={secondaryAction.variant || "outline"}
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
          >
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || "default"}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
