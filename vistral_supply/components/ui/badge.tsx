/**
 * Badge Component - Wrapper around @vistral/design-system Badge
 * 
 * This wrapper maintains backward compatibility with the existing API
 * while using the Vistral Design System Badge internally.
 */

import * as React from "react"
import { Badge as VistralBadge, type BadgeProps as VistralBadgeProps } from "@vistral/design-system"
import { cn } from "@/lib/utils"

type LegacyVariant = "default" | "secondary" | "destructive" | "outline"

export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "variant"> {
  variant?: LegacyVariant
}

const mapVariant = (variant?: LegacyVariant): VistralBadgeProps["variant"] => {
  switch (variant) {
    case "default":
      return "primary"
    case "secondary":
      return "default"
    case "destructive":
      return "error"
    case "outline":
      return "default"
    default:
      return "default"
  }
}

function Badge({ className, variant, ...props }: BadgeProps) {
  const vistralVariant = mapVariant(variant)
  
  return (
    <VistralBadge
      variant={vistralVariant}
      className={cn(
        // Preserve outline variant styling
        variant === "outline" && "border border-input bg-transparent",
        className
      )}
      {...props}
    />
  )
}

// Export badgeVariants for backward compatibility (deprecated)
export const badgeVariants = {
  // This is kept for backward compatibility but should not be used
  // Use Vistral Design System Badge directly for new code
}

export { Badge }
