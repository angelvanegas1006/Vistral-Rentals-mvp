import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--prophero-blue-500)] text-white hover:bg-[var(--prophero-blue-600)]",
        secondary:
          "border-transparent bg-[var(--prophero-gray-200)] text-[var(--prophero-gray-900)] hover:bg-[var(--prophero-gray-300)] dark:bg-[var(--prophero-gray-800)] dark:text-[var(--prophero-gray-100)] dark:hover:bg-[var(--prophero-gray-700)]",
        destructive:
          "border-transparent bg-[var(--prophero-danger)] text-white hover:bg-[var(--prophero-danger-hover)]",
        outline: "text-foreground border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-700)]",
        success:
          "border-transparent bg-[var(--prophero-success)] text-white hover:bg-[var(--prophero-success-hover)]",
        warning:
          "border-transparent bg-[var(--prophero-warning)] text-white hover:bg-[var(--prophero-warning-hover)]",
        info:
          "border-transparent bg-[var(--prophero-info)] text-white hover:bg-[var(--prophero-info-hover)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
