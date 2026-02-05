/**
 * Button Component - Wrapper around @vistral/design-system Button
 * 
 * This wrapper maintains backward compatibility with the existing API
 * while using the Vistral Design System Button internally.
 * 
 * Migration note: Gradually migrate to use @vistral/design-system Button directly
 * with the new API (variant: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'destructive-ghost')
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Button as VistralButton, type ButtonProps as VistralButtonProps } from "@vistral/design-system"
import { cn } from "@/lib/utils"

// Map old variant names to new design system variants
type LegacyVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type LegacySize = "default" | "sm" | "lg" | "icon"

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "variant" | "size"> {
  variant?: LegacyVariant
  size?: LegacySize
  asChild?: boolean
}

const mapVariant = (variant?: LegacyVariant): VistralButtonProps["variant"] => {
  switch (variant) {
    case "default":
      return "primary"
    case "destructive":
      return "destructive"
    case "outline":
      // Outline maps to secondary with border styling via className
      return "secondary"
    case "secondary":
      return "secondary"
    case "ghost":
      return "ghost"
    case "link":
      // Link maps to ghost with underline styling via className
      return "ghost"
    default:
      return "primary"
  }
}

const mapSize = (size?: LegacySize): VistralButtonProps["size"] => {
  switch (size) {
    case "sm":
      return "sm"
    case "lg":
      return "lg"
    case "icon":
      // Icon size maps to md with iconOnly prop
      return "md"
    case "default":
    default:
      return "md"
  }
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    // Handle asChild prop (Slot pattern)
    if (asChild) {
      return (
        <Slot className={className} ref={ref} {...props}>
          {children}
        </Slot>
      )
    }

    // Map legacy props to design system props
    const vistralVariant = mapVariant(variant)
    const vistralSize = mapSize(size)
    const isIconOnly = size === "icon"
    const isLink = variant === "link"
    const isOutline = variant === "outline"

    // Additional className for outline and link variants
    const additionalClasses = cn(
      isOutline && "border border-input bg-background",
      isLink && "underline underline-offset-4",
      className
    )

    return (
      <VistralButton
        ref={ref}
        variant={vistralVariant}
        size={vistralSize}
        iconOnly={isIconOnly}
        className={additionalClasses}
        {...props}
      >
        {children}
      </VistralButton>
    )
  }
)
Button.displayName = "Button"

// Export buttonVariants for backward compatibility (deprecated)
export const buttonVariants = {
  // This is kept for backward compatibility but should not be used
  // Use Vistral Design System Button directly for new code
}

export { Button }
