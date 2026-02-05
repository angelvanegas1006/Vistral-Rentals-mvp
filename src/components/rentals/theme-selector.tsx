"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeSelectorProps {
  collapsed?: boolean;
}

export function ThemeSelector({ collapsed = false }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
        <Monitor className="h-4 w-4 mr-2" />
        Cargando...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full", collapsed ? "justify-center" : "justify-start")}
        >
          {theme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : theme === "light" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
          {!collapsed && <span className="ml-2">Tema</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="h-4 w-4 mr-2" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="h-4 w-4 mr-2" />
          Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="h-4 w-4 mr-2" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
