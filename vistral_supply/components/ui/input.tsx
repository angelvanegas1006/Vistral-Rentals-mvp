/**
 * Input Component - Wrapper around @vistral/design-system Input
 * 
 * This wrapper maintains backward compatibility with the existing API
 * while using the Vistral Design System Input internally.
 */

import * as React from "react"
import { Input as VistralInput, type InputProps as VistralInputProps } from "@vistral/design-system"
import { cn } from "@/lib/utils"

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  // Optional design system props
  size?: VistralInputProps["size"]
  error?: boolean
  errorMessage?: string
  label?: string
  helperText?: string
  leftIcon?: VistralInputProps["leftIcon"]
  rightIcon?: VistralInputProps["rightIcon"]
  fullWidth?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, error, errorMessage, label, helperText, leftIcon, rightIcon, fullWidth, ...props }, ref) => {
    // If design system props are provided, use the full component
    if (label || helperText || errorMessage || leftIcon || rightIcon) {
      return (
        <VistralInput
          ref={ref}
          size={size || "md"}
          error={error}
          errorMessage={errorMessage}
          label={label}
          helperText={helperText}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          fullWidth={fullWidth}
          className={className}
          {...props}
        />
      )
    }

    // Otherwise, use a simplified wrapper that maintains the original styling
    // but uses the design system component internally
    return (
      <VistralInput
        ref={ref}
        size={size || "md"}
        error={error}
        fullWidth={fullWidth}
        className={cn(
          // Preserve original dark mode styles
          "dark:bg-[#1a1a1a] dark:text-white",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
