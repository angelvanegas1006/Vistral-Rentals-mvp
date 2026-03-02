"use client";

import { cn } from "@/lib/utils";

interface RentalsHomeLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RentalsHomeLoader({ size = "md", className }: RentalsHomeLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer Ring */}
      <div
        className={cn(
          "absolute rounded-full border-4 border-transparent",
          sizeClasses[size],
          "animate-spin"
        )}
        style={{
          borderTopColor: "var(--vistral-blue-500)",
          borderRightColor: "var(--vistral-blue-400)",
          borderBottomColor: "transparent",
          borderLeftColor: "transparent",
        }}
      />

      {/* Inner Ring */}
      <div
        className={cn(
          "absolute rounded-full border-4 border-transparent",
          size === "sm" ? "w-5 h-5" : size === "md" ? "w-10 h-10" : "w-16 h-16",
          "animate-spin-reverse"
        )}
        style={{
          borderTopColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "var(--vistral-blue-600)",
          borderLeftColor: "var(--vistral-blue-300)",
        }}
      />

      {/* Center Dot */}
      <div
        className={cn(
          "absolute rounded-full",
          size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4",
          "animate-pulse"
        )}
        style={{
          backgroundColor: "var(--vistral-blue-500)",
          animationDuration: "1.5s",
        }}
      />
    </div>
  );
}
