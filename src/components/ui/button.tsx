import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--vistral-primary-default-bg)] text-[var(--vistral-primary-default-text)] hover:bg-[var(--vistral-primary-hover-bg)] shadow-sm hover:shadow-md",
        destructive:
          "bg-[var(--vistral-semantic-status-error)] text-white hover:bg-[var(--vistral-semantic-interactive-danger-hover)] shadow-sm hover:shadow-md",
        outline:
          "border border-[var(--vistral-semantic-border-default)] bg-background hover:bg-[var(--vistral-semantic-bg-muted)] hover:text-foreground dark:border-[var(--vistral-border-default)] dark:hover:bg-[var(--vistral-bg-elevated)]",
        secondary:
          "bg-[var(--vistral-secondary-default-bg)] text-[var(--vistral-secondary-default-text)] hover:bg-[var(--vistral-secondary-hover-bg)]",
        ghost: "hover:bg-[var(--vistral-semantic-bg-muted)] hover:text-foreground dark:hover:bg-[var(--vistral-bg-elevated)]",
        link: "text-[var(--vistral-primary-default-bg)] underline-offset-4 hover:underline hover:text-[var(--vistral-primary-hover-bg)]",
        success: "bg-[var(--vistral-semantic-status-success)] text-white hover:bg-[var(--vistral-semantic-interactive-success-hover)] shadow-sm hover:shadow-md",
        warning: "bg-[var(--vistral-semantic-status-warning)] text-white hover:bg-[var(--vistral-semantic-interactive-warning-hover)] shadow-sm hover:shadow-md",
        info: "bg-[var(--vistral-semantic-status-info)] text-white hover:bg-[var(--vistral-semantic-interactive-brand-hover)] shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
