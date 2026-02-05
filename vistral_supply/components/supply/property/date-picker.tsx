"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  className,
  disabled = false,
}: DatePickerProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY for display
  const formatDateForDisplay = (isoDate?: string): string => {
    if (!isoDate) return "";
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return "";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "";
    }
  };

  // Convert DD/MM/YYYY to ISO date (YYYY-MM-DD)
  const parseDateFromDisplay = (displayDate: string): string | null => {
    const parts = displayDate.split("/");
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    
    try {
      const date = new Date(year, month - 1, day);
      if (
        date.getDate() !== day ||
        date.getMonth() !== month - 1 ||
        date.getFullYear() !== year
      ) {
        return null; // Invalid date
      }
      return date.toISOString().split("T")[0]; // YYYY-MM-DD
    } catch {
      return null;
    }
  };

  // Initialize display value from ISO date
  useEffect(() => {
    if (value) {
      setDisplayValue(formatDateForDisplay(value));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);
    
    // Try to parse as user types
    const isoDate = parseDateFromDisplay(input);
    if (isoDate) {
      onChange(isoDate);
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value; // Already in YYYY-MM-DD format
    if (isoDate) {
      onChange(isoDate);
      setDisplayValue(formatDateForDisplay(isoDate));
    }
  };

  const handleCalendarClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleDisplayChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        rightIcon={Calendar}
      />
      
      {/* Hidden date input for native date picker */}
      <input
        ref={dateInputRef}
        type="date"
        value={value || ""}
        onChange={handleDateInputChange}
        className="absolute inset-0 opacity-0 pointer-events-none z-10 cursor-pointer"
        disabled={disabled}
        onClick={handleCalendarClick}
      />
    </div>
  );
}
