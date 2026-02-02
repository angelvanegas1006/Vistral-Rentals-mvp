"use client";

import { Globe, Check, ChevronRight } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/hooks/use-i18n";

interface LanguageSelectorProps {
  asSubmenu?: boolean;
}

export function LanguageSelector({ asSubmenu = true }: LanguageSelectorProps) {
  const { language, changeLanguage, t } = useI18n();

  const languages = [
    { value: "es", label: "Español" },
    { value: "en", label: "English" },
  ];

  if (asSubmenu) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center cursor-pointer">
          <Globe className="mr-2 h-4 w-4" />
          <span>{t("userMenu.language") || t("language")}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {languages.map((lang) => {
            const isSelected = language === lang.value;

            return (
              <DropdownMenuItem
                key={lang.value}
                onClick={(e) => {
                  e.stopPropagation();
                  changeLanguage(lang.value as "es" | "en");
                }}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className={isSelected ? "font-semibold" : ""}>
                  {lang.label}
                </span>
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
      {languages.map((lang) => {
        const isSelected = language === lang.value;

        return (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => changeLanguage(lang.value as "es" | "en")}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className={isSelected ? "font-semibold" : ""}>
                {lang.label}
              </span>
            </div>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
