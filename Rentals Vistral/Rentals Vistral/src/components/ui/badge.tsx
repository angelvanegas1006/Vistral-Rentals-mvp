import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--vistral-blue-500)] text-white hover:bg-[var(--vistral-blue-600)]",
        secondary:
          "border-transparent bg-[var(--vistral-gray-200)] text-[var(--vistral-gray-900)] hover:bg-[var(--vistral-gray-300)] dark:bg-[var(--vistral-gray-800)] dark:text-[var(--vistral-gray-100)] dark:hover:bg-[var(--vistral-gray-700)]",
        destructive:
          "border-transparent bg-[var(--vistral-danger)] text-white hover:bg-[var(--vistral-danger-hover)]",
        outline: "text-foreground border-[var(--vistral-gray-300)] dark:border-[var(--vistral-gray-700)]",
        success:
          "border-transparent bg-[var(--vistral-success)] text-white hover:bg-[var(--vistral-success-hover)]",
        warning:
          "border-transparent bg-[var(--vistral-warning)] text-white hover:bg-[var(--vistral-warning-hover)]",
        info:
          "border-transparent bg-[var(--vistral-info)] text-white hover:bg-[var(--vistral-info-hover)]",
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
