import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--prophero-blue-500)] text-white hover:bg-[var(--prophero-blue-600)] shadow-sm hover:shadow-md",
        destructive:
          "bg-[var(--prophero-danger)] text-white hover:bg-[var(--prophero-danger-hover)] shadow-sm hover:shadow-md",
        outline:
          "border border-[var(--prophero-gray-300)] bg-background hover:bg-[var(--prophero-gray-50)] hover:text-foreground dark:border-[var(--prophero-gray-700)] dark:hover:bg-[var(--prophero-gray-800)]",
        secondary:
          "bg-[var(--prophero-gray-200)] text-[var(--prophero-gray-900)] hover:bg-[var(--prophero-gray-300)] dark:bg-[var(--prophero-gray-800)] dark:text-[var(--prophero-gray-100)] dark:hover:bg-[var(--prophero-gray-700)]",
        ghost: "hover:bg-[var(--prophero-gray-100)] hover:text-foreground dark:hover:bg-[var(--prophero-gray-800)]",
        link: "text-[var(--prophero-blue-500)] underline-offset-4 hover:underline hover:text-[var(--prophero-blue-600)]",
        success: "bg-[var(--prophero-success)] text-white hover:bg-[var(--prophero-success-hover)] shadow-sm hover:shadow-md",
        warning: "bg-[var(--prophero-warning)] text-white hover:bg-[var(--prophero-warning-hover)] shadow-sm hover:shadow-md",
        info: "bg-[var(--prophero-info)] text-white hover:bg-[var(--prophero-info-hover)] shadow-sm hover:shadow-md",
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
