/**
 * Textarea Component - Wrapper around @vistral/design-system Textarea
 * 
 * This wrapper maintains backward compatibility with the existing API
 * while using the Vistral Design System Textarea internally.
 */

import * as React from "react"
import { Textarea as VistralTextarea, type TextareaProps as VistralTextareaProps } from "@vistral/design-system"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  // Optional design system props
  error?: boolean
  errorMessage?: string
  label?: string
  helperText?: string
  fullWidth?: boolean
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, errorMessage, label, helperText, fullWidth, autoResize, ...props }, ref) => {
    // If design system props are provided, use the full component
    if (label || helperText || errorMessage) {
      return (
        <VistralTextarea
          ref={ref}
          error={error}
          errorMessage={errorMessage}
          label={label}
          helperText={helperText}
          fullWidth={fullWidth}
          autoResize={autoResize}
          className={className}
          {...props}
        />
      )
    }

    // Otherwise, use a simplified wrapper
    return (
      <VistralTextarea
        ref={ref}
        error={error}
        fullWidth={fullWidth}
        autoResize={autoResize}
        className={cn(
          // Preserve original styles
          "min-h-[80px]",
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }


