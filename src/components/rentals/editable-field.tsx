"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableFieldSelectProps {
  label: string;
  value: string | null;
  options: readonly string[];
  onSave: (value: string | null) => void | Promise<void>;
  placeholder?: string;
  className?: string;
}

interface EditableFieldInputProps {
  label: string;
  value: string | null;
  onSave: (value: string | null) => void | Promise<void>;
  placeholder?: string;
  className?: string;
}

type EditableFieldProps = EditableFieldSelectProps | EditableFieldInputProps;

function isSelectProps(props: EditableFieldProps): props is EditableFieldSelectProps {
  return "options" in props;
}

export function EditableField(props: EditableFieldProps) {
  const { label, value, onSave, placeholder = "--", className } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? "");

  const handleStartEdit = () => {
    setEditValue(value ?? "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    const finalValue = isSelectProps(props)
      ? (editValue || null)
      : (editValue.trim() || null);
    await onSave(finalValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value ?? "");
    setIsEditing(false);
  };

  const displayValue = value ?? placeholder;

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      {isEditing ? (
        <div className="flex items-center gap-2">
          {!isSelectProps(props) ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className="flex-1"
              autoFocus
            />
          ) : (
            <Select
              value={editValue || ""}
              onValueChange={(v) => setEditValue(v || "")}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {props.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleSave}
            className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
            title="Guardar"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-[#E5E7EB] dark:border-[#374151] bg-muted/30 px-3 py-2 min-h-[40px]">
          <span
            className={cn(
              "flex-1 text-sm",
              displayValue !== placeholder
                ? "text-[#111827] dark:text-[#F9FAFB]"
                : "text-muted-foreground"
            )}
          >
            {displayValue}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleStartEdit}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
