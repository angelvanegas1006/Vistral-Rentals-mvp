import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--vistral-blue-500)] text-white hover:bg-[var(--vistral-blue-600)] shadow-sm hover:shadow-md",
        destructive:
          "bg-[var(--vistral-danger)] text-white hover:bg-[var(--vistral-danger-hover)] shadow-sm hover:shadow-md",
        outline:
          "border border-[var(--vistral-gray-300)] bg-background hover:bg-[var(--vistral-gray-50)] hover:text-foreground dark:border-[var(--vistral-gray-700)] dark:hover:bg-[var(--vistral-gray-800)]",
        secondary:
          "bg-[var(--vistral-gray-200)] text-[var(--vistral-gray-900)] hover:bg-[var(--vistral-gray-300)] dark:bg-[var(--vistral-gray-800)] dark:text-[var(--vistral-gray-100)] dark:hover:bg-[var(--vistral-gray-700)]",
        ghost: "hover:bg-[var(--vistral-gray-100)] hover:text-foreground dark:hover:bg-[var(--vistral-gray-800)]",
        link: "text-[var(--vistral-blue-500)] underline-offset-4 hover:underline hover:text-[var(--vistral-blue-600)]",
        success: "bg-[var(--vistral-success)] text-white hover:bg-[var(--vistral-success-hover)] shadow-sm hover:shadow-md",
        warning: "bg-[var(--vistral-warning)] text-white hover:bg-[var(--vistral-warning-hover)] shadow-sm hover:shadow-md",
        info: "bg-[var(--vistral-info)] text-white hover:bg-[var(--vistral-info-hover)] shadow-sm hover:shadow-md",
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
