"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  collapsed?: boolean;
}

export function LanguageSelector({ collapsed = false }: LanguageSelectorProps) {
  const { language, changeLanguage, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full", collapsed ? "justify-center" : "justify-start")}
        >
          <Languages className="h-4 w-4" />
          {!collapsed && <span className="ml-2">{t("language")}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => changeLanguage("es")}>
          <span className={language === "es" ? "font-semibold" : ""}>Español</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("en")}>
          <span className={language === "en" ? "font-semibold" : ""}>English</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
