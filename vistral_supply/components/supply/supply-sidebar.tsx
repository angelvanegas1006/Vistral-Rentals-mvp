"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, HelpCircle, LogOut, ChevronDown, PanelLeftClose, PanelLeftOpen, Menu, X, Users, Lock, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { VistralLogo } from "@/components/vistral-logo";
import { ThemeSelector } from "@/components/user/theme-selector";
import { LanguageSelector } from "@/components/user/language-selector";
import { ChangePasswordModal } from "@/components/user/change-password-modal";
import { KanbanIcon } from "@/components/icons/kanban-icon";
import { ChevronRightIcon } from "@/components/icons/chevron-right-icon";
import { useSupabaseAuthContext } from "@/lib/auth/supabase-auth-context";
import { useAppAuth } from "@/lib/auth/app-auth-context";
import { useI18n } from "@/lib/i18n";
import { hasRenoAccess, hasProyectoAccess } from "@/lib/auth/permissions";
import type { Database } from "@/lib/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

// Navigation items for Supply
const getNavigationItems = (t: any, role?: string | null) => {
  const items = [
    {
      label: t.nav.home,
      href: "/supply",
      icon: Home,
      useCustomIcon: false,
    },
    {
      label: t.nav.kanban,
      href: "/supply/kanban",
      icon: null,
      useCustomIcon: true,
      customIcon: KanbanIcon,
    },
  ];

  // Add Proyecto navigation if user has Proyecto access
  if (hasProyectoAccess((role as AppRole) || null)) {
    const hasProyecto = items.some(item => item.href === "/proyecto");
    if (!hasProyecto) {
      items.push({
        label: t.nav.proyecto ?? "Proyecto",
        href: "/proyecto",
        icon: LayoutGrid,
        useCustomIcon: false,
      });
    }
  }

  // Add Reno navigation if user has Reno access
  // BUT: Admins don't need this link because they can use the selector in the header
  // Only Reno-specific roles (renovator_analyst, reno_lead) need direct access to Reno Kanban
  if (hasRenoAccess((role as AppRole) || null) && role !== "supply_admin") {
    // Verify that Reno Kanban is not already in the items array
    const hasRenoKanban = items.some(item => item.href === "/reno/kanban");
    if (!hasRenoKanban) {
      items.push({
        label: "Reno Kanban",
        href: "/reno/kanban",
        icon: null,
        useCustomIcon: true,
        customIcon: KanbanIcon,
      });
    }
  }

  return items;
};

const getSettingsItems = (t: any, role?: string) => {
  const items = [
    {
      label: t.nav.notifications,
      href: "/supply/notifications",
      icon: Bell,
      comingSoon: true,
    },
    {
      label: t.nav.help,
      href: "#",
      icon: HelpCircle,
      comingSoon: true,
    },
  ];

  // Add users management link only for admin
  if (role === "supply_admin") {
    items.push({
      label: t.sidebar.users,
      href: "/admin/users",
      icon: Users,
      comingSoon: false,
    });
  }

  return items;
};

interface SupplySidebarProps {
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export function SupplySidebar({ isMobileOpen = false, onMobileToggle }: SupplySidebarProps) {
  const { t } = useI18n();
  const { user: supabaseUser, signOut } = useSupabaseAuthContext();
  const { user: appUser, role } = useAppAuth();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  
  // Get navigation items and ensure no duplicates
  const navigationItems = useMemo(() => {
    const items = getNavigationItems(t, role);
    // Remove duplicates by href (just in case)
    const unique = items.filter((item, index, self) =>
      index === self.findIndex((t) => t.href === item.href)
    );
    return unique;
  }, [t, role]);
  
  const settingsItems = getSettingsItems(t, role || undefined);
  const pathname = usePathname();
  
  const handleLogout = async () => {
    await signOut();
  };
  
  // Always start collapsed - user can expand by clicking
  // Use useState with a function to ensure consistent initial state
  const [collapsed, setCollapsed] = useState(() => true);
  const [isMobile, setIsMobile] = useState(() => false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // On mobile, render as overlay drawer (only after mount to avoid hydration mismatch)
  if (mounted && isMobile) {
    return (
      <>
        {/* Mobile toggle button */}
        <button
          onClick={onMobileToggle}
          className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-md bg-card border shadow-lg hover:bg-accent transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onMobileToggle}
          />
        )}

        {/* Mobile sidebar drawer */}
        <aside
          className={cn(
            "fixed left-0 top-0 h-full w-80 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out md:hidden",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <Link 
                href="/supply"
                onClick={onMobileToggle}
                className="flex-shrink-0 hover:opacity-80"
              >
                <VistralLogo variant={null} className="h-8" />
              </Link>
              <button
                onClick={onMobileToggle}
                className="p-2 rounded-md hover:bg-accent"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.sidebar.platform}
                </p>
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.useCustomIcon && item.customIcon ? item.customIcon : (item.icon ?? Home);
                    // For /supply, only match exact path or if it's the root and no other route matches
                    const isActive = item.href === "/supply" 
                      ? pathname === "/supply" || pathname === "/supply/"
                      : pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onMobileToggle}
                        className={cn(
                          "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[#CFE1FF] text-[#182C90]"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-[#182C90]" : "text-current")} />
                          <span className="whitespace-nowrap truncate">{item.label}</span>
                        </div>
                        {isActive && (
                          <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-[#182C90]" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-border my-4" />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.sidebar.configuration}
                </p>
                <nav className="space-y-1">
                  {settingsItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onMobileToggle}
                        className={cn(
                          "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors min-w-0",
                          isActive
                            ? "bg-[#CFE1FF] text-[#182C90]"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground",
                          item.comingSoon && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-[#182C90]" : "text-current")} />
                          <span className="whitespace-nowrap truncate">{item.label}</span>
                        </div>
                        {isActive && (
                          <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-[#182C90]" />
                        )}
                        {!isActive && item.comingSoon && (
                          <span className="ml-auto text-xs text-muted-foreground">{t.sidebar.soon}</span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Footer - User Menu */}
            <div className="p-4 border-t border-border flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="text-xs font-semibold">
                        {appUser?.email?.charAt(0).toUpperCase() || supabaseUser?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{appUser?.email || supabaseUser?.email || t.sidebar.user}</p>
                      <p className="text-xs text-muted-foreground truncate">{role || ""}</p>
                    </div>
                    <ChevronDown className="h-5 w-5 flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <ThemeSelector />
                  <DropdownMenuSeparator />
                  <LanguageSelector />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsChangePasswordModalOpen(true)}>
                    <Lock className="mr-2 h-4 w-4" />
                    {t.userMenu?.changePassword?.menuItem || "Cambiar Contraseña"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>

        {/* Change Password Modal */}
        <ChangePasswordModal
          open={isChangePasswordModalOpen}
          onOpenChange={setIsChangePasswordModalOpen}
        />
      </>
    );
  }

  // Desktop sidebar (always render same structure to avoid hydration mismatch)
  // Show collapsed state initially, then update after mount
  const displayCollapsed = mounted ? collapsed : true;
  
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen w-16 border-r border-border bg-card transition-all duration-300",
        !displayCollapsed && "md:w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center transition-all duration-300",
        collapsed ? "justify-center px-3 py-3 h-[64px] min-h-[64px]" : "justify-between p-4 h-[64px] min-h-[64px]"
      )}>
        {displayCollapsed ? (
          <Link 
            href="/supply"
            className="flex-shrink-0 transition-all duration-300 ease-in-out hover:opacity-80 flex items-center justify-center"
            title="Vistral Supply"
          >
            <VistralLogo variant={null} iconOnly className="h-8 w-8" />
          </Link>
        ) : (
          <>
            <Link 
              href="/supply"
              className="flex-shrink-0 transition-all duration-300 ease-in-out hover:opacity-80 flex items-center"
            >
              <VistralLogo variant={null} className="h-8" />
            </Link>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-md hover:bg-accent transition-colors flex-shrink-0"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-5 w-5 text-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        {!displayCollapsed && (
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.sidebar.platform}
            </p>
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.useCustomIcon && item.customIcon ? item.customIcon : (item.icon || Home);
                // For /supply, only match exact path
                const isActive = item.href === "/supply" 
                  ? pathname === "/supply" || pathname === "/supply/"
                  : pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#CFE1FF] text-[#182C90]"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-[#182C90]" : "text-current")} />
                      <span className="whitespace-nowrap truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-[#182C90]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
        {displayCollapsed && (
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.useCustomIcon && item.customIcon ? item.customIcon : (item.icon || Home);
              // For /supply, only match exact path
              const isActive = item.href === "/supply" 
                ? pathname === "/supply" || pathname === "/supply/"
                : pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors w-full",
                    isActive
                      ? "bg-[#CFE1FF] text-[#182C90]"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={item.label}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-[#182C90]" : "text-current")} />
                </Link>
              );
            })}
          </nav>
        )}

        <div className={cn("border-t border-border", displayCollapsed ? "my-2" : "my-4")} />

        {/* Settings */}
        {displayCollapsed ? (
          <nav className="space-y-1">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors w-full",
                    isActive
                      ? "bg-[#CFE1FF] text-[#182C90]"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    item.comingSoon && "opacity-50 cursor-not-allowed"
                  )}
                  title={item.label}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-[#182C90]" : "text-current")} />
                </Link>
              );
            })}
          </nav>
        ) : (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.sidebar.configuration}
            </p>
            <nav className="space-y-1">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#CFE1FF] text-[#182C90]"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      item.comingSoon && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-[#182C90]" : "text-current")} />
                      <span className="whitespace-nowrap truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-[#182C90]" />
                    )}
                    {!isActive && item.comingSoon && (
                      <span className="ml-auto text-xs text-muted-foreground">{t.sidebar.soon}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer - User Menu */}
      <div className="border-t border-border flex-shrink-0">
        {displayCollapsed && (
          <div className="flex justify-center py-2 border-b border-border">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-md hover:bg-accent transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5 text-foreground" />
            </button>
          </div>
        )}
        
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
                displayCollapsed && "justify-center"
              )}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                  <span className="text-xs font-semibold">
                    {appUser?.email?.charAt(0).toUpperCase() || supabaseUser?.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                {!displayCollapsed && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{appUser?.email || supabaseUser?.email || t.sidebar.user}</p>
                      <p className="text-xs text-muted-foreground truncate">{role || ""}</p>
                    </div>
                    <ChevronDown className="h-5 w-5 flex-shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <ThemeSelector />
              <DropdownMenuSeparator />
              <LanguageSelector />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsChangePasswordModalOpen(true)}>
                <Lock className="mr-2 h-4 w-4" />
                {t.userMenu?.changePassword?.menuItem || "Cambiar Contraseña"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t.nav.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
      />
    </aside>
  );
}
