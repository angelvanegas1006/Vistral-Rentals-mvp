import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--vistral-primary-default-bg)] text-white hover:bg-[var(--vistral-primary-hover-bg)]",
        secondary:
          "border-transparent bg-[var(--vistral-secondary-default-bg)] text-[var(--vistral-secondary-default-text)] hover:bg-[var(--vistral-secondary-hover-bg)] dark:bg-[var(--vistral-bg-elevated)] dark:text-[var(--vistral-text-primary)] dark:hover:bg-[var(--vistral-bg-card)]",
        destructive:
          "border-transparent bg-[var(--vistral-semantic-status-error)] text-white hover:bg-[var(--vistral-semantic-interactive-danger-hover)]",
        outline: "text-foreground border-[var(--vistral-semantic-border-default)] dark:border-[var(--vistral-border-default)]",
        success:
          "border-transparent bg-[var(--vistral-semantic-status-success)] text-white hover:bg-[var(--vistral-semantic-interactive-success-hover)]",
        warning:
          "border-transparent bg-[var(--vistral-semantic-status-warning)] text-white hover:bg-[var(--vistral-semantic-interactive-warning-hover)]",
        info:
          "border-transparent bg-[var(--vistral-semantic-status-info)] text-white hover:bg-[var(--vistral-semantic-interactive-brand-hover)]",
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
