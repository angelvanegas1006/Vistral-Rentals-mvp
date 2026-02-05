import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        success:
          "bg-[var(--vistral-success)]/10 border-[var(--vistral-success)]/20 text-[var(--vistral-success)] dark:bg-[var(--vistral-success)]/5 dark:border-[var(--vistral-success)]/30 dark:text-[var(--vistral-success)]",
        warning:
          "bg-[var(--vistral-warning)]/10 border-[var(--vistral-warning)]/20 text-[var(--vistral-warning)] dark:bg-[var(--vistral-warning)]/5 dark:border-[var(--vistral-warning)]/30 dark:text-[var(--vistral-warning)]",
        danger:
          "bg-[var(--vistral-danger)]/10 border-[var(--vistral-danger)]/20 text-[var(--vistral-danger)] dark:bg-[var(--vistral-danger)]/5 dark:border-[var(--vistral-danger)]/30 dark:text-[var(--vistral-danger)]",
        info:
          "bg-[var(--vistral-info)]/10 border-[var(--vistral-info)]/20 text-[var(--vistral-info)] dark:bg-[var(--vistral-info)]/5 dark:border-[var(--vistral-info)]/30 dark:text-[var(--vistral-info)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

// Icon components for each variant
const AlertIcon = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
  default: AlertCircle,
}

// Convenience component that includes icon
interface AlertWithIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string
  description?: string
  showIcon?: boolean
  onClose?: () => void
}

const AlertWithIcon = React.forwardRef<HTMLDivElement, AlertWithIconProps>(
  ({ className, variant = "default", title, description, showIcon = true, onClose, ...props }, ref) => {
    const Icon = variant ? AlertIcon[variant] : AlertIcon.default

    return (
      <Alert ref={ref} variant={variant} className={className} {...props}>
        {showIcon && <Icon className="h-4 w-4" />}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
        {title && <AlertTitle>{title}</AlertTitle>}
        {description && <AlertDescription>{description}</AlertDescription>}
      </Alert>
    )
  }
)
AlertWithIcon.displayName = "AlertWithIcon"

export { Alert, AlertTitle, AlertDescription, AlertWithIcon, alertVariants }
