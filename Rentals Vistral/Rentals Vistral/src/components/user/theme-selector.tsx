"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Check, ChevronRight } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/hooks/use-i18n";

interface ThemeSelectorProps {
  asSubmenu?: boolean;
}

export function ThemeSelector({ asSubmenu = true }: ThemeSelectorProps) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Determinar el tema efectivo (si es system, usar systemTheme)
  const effectiveTheme = theme === "system" ? systemTheme : theme;
  const currentIcon =
    effectiveTheme === "dark" ? (
      <Moon className="mr-2 h-4 w-4" />
    ) : effectiveTheme === "light" ? (
      <Sun className="mr-2 h-4 w-4" />
    ) : (
      <Monitor className="mr-2 h-4 w-4" />
    );

  const themeOptions = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ];

  if (asSubmenu) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center cursor-pointer">
          {currentIcon}
          <span>{t("userMenu.theme") || t("theme")}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  setTheme(option.value);
                }}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // Si no es submenu, renderizar como items directos
  return (
    <>
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = theme === option.value;

        return (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
            </div>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
