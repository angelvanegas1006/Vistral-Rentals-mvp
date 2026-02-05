"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { VistralLogo } from "@/components/vistral-logo";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  Briefcase,
  HelpCircle,
  LogOut,
  Bell,
  Users,
  Menu,
  X,
  ChevronDown,
  Lock,
} from "lucide-react";
import { KanbanIcon } from "@/components/icons/kanban-icon";
import { ChevronRightIcon } from "@/components/icons/chevron-right-icon";
import { useAppAuth } from "@/hooks/use-app-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSelector } from "@/components/user/theme-selector";
import { LanguageSelector } from "@/components/user/language-selector";
import { ChangePasswordModal } from "@/components/user/change-password-modal";

export function RentalsSidebar() {
  const [collapsed, setCollapsed] = useState(() => true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => false);
  const [mounted, setMounted] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAppAuth();
  const { t } = useI18n();

  // Detectar mobile y ajustar estado colapsado
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const handleMobileToggle = () => {
    setIsMobileOpen((prev) => !prev);
  };

  // Items de navegación - Plataforma
  const platformItems = [
    {
      label: t("nav.home"),
      href: "/rentals",
      icon: Home,
      useCustomIcon: false,
    },
    {
      label: t("nav.acquisitionAndClosing"),
      href: "/rentals/kanban",
      icon: null,
      useCustomIcon: true,
      customIcon: KanbanIcon,
    },
    {
      label: t("nav.portfolio"),
      href: "/rentals/kanban/portfolio",
      icon: Briefcase,
      useCustomIcon: false,
    },
    {
      label: t("nav.leads"),
      href: "/rentals/leads",
      icon: Users,
      useCustomIcon: false,
    },
  ];

  // Items de configuración
  const configItems = [
    {
      label: t("sidebar.notifications"),
      href: "/rentals/notifications",
      icon: Bell,
      badge: 0, // TODO: Obtener de estado real
      comingSoon: false,
    },
    {
      label: t("sidebar.help"),
      href: "/rentals/help",
      icon: HelpCircle,
      badge: 0,
      comingSoon: true,
    },
    // Usuarios solo si es admin (por ahora no implementado)
    // {
    //   label: t("sidebar.users"),
    //   href: "/admin/users",
    //   icon: Users,
    //   badge: 0,
    //   comingSoon: false,
    //   requiresRole: ["admin", "construction_manager"],
    // },
  ];

  const isActive = (href: string) => {
    if (href === "/rentals") {
      return pathname === "/rentals";
    }
    // Para los Kanbans, hacer match exacto para evitar que ambos se marquen
    if (href === "/rentals/kanban") {
      return pathname === "/rentals/kanban";
    }
    if (href === "/rentals/kanban/portfolio") {
      return pathname === "/rentals/kanban/portfolio";
    }
    if (href === "/rentals/leads") {
      return pathname?.startsWith("/rentals/leads");
    }
    return pathname?.startsWith(href + "/") || pathname === href;
  };

  const email = user?.email || "user@example.com";
  const userInitial = email.charAt(0).toUpperCase();
  const userRole = "usuario"; // TODO: Obtener del usuario real

  // Renderizar item de navegación
  const renderNavItem = (
    item: {
      label: string;
      href: string;
      icon: any;
      useCustomIcon?: boolean;
      customIcon?: any;
      badge?: number;
      comingSoon?: boolean;
    },
    isConfig = false
  ) => {
    const Icon = item.useCustomIcon && item.customIcon ? item.customIcon : (item.icon || Home);
    const active = isActive(item.href);

    if (collapsed && !isMobile) {
      // Versión colapsada
      return (
        <Link
          key={item.href}
          href={item.comingSoon ? "#" : item.href}
          className={cn(
            "flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors w-full relative",
            active
              ? "bg-[#CFE1FF] text-[#182C90]"
              : "text-foreground hover:bg-accent hover:text-accent-foreground",
            item.comingSoon && "opacity-50 cursor-not-allowed"
          )}
          title={item.label}
          onClick={(e) => {
            if (item.comingSoon) {
              e.preventDefault();
            }
          }}
        >
          <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-[#182C90]" : "text-current")} />
          {item.badge && item.badge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--prophero-blue-600)] text-[10px] font-semibold text-white">
              {item.badge}
            </span>
          )}
        </Link>
      );
    }

    // Versión expandida
    return (
      <Link
        key={item.href}
        href={item.comingSoon ? "#" : item.href}
        className={cn(
          "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-[#CFE1FF] text-[#182C90]"
            : "text-foreground hover:bg-accent hover:text-accent-foreground",
          item.comingSoon && "opacity-50 cursor-not-allowed"
        )}
        onClick={(e) => {
          if (item.comingSoon) {
            e.preventDefault();
          }
          if (isMobile) {
            setIsMobileOpen(false);
          }
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-[#182C90]" : "text-current")} />
          <span className="whitespace-nowrap truncate">{item.label}</span>
        </div>
        {active && (
          <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-[#182C90]" />
        )}
        {!active && isConfig && item.badge && item.badge > 0 && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[var(--prophero-blue-600)] text-xs font-semibold text-white">
            {item.badge}
          </span>
        )}
        {!active && isConfig && item.comingSoon && !item.badge && (
          <span className="ml-auto text-xs text-muted-foreground">{t("sidebar.soon") || "Pronto"}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-md bg-card border shadow-lg hover:bg-accent transition-colors"
        onClick={handleMobileToggle}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleMobileToggle}
        />
      )}

      {/* Desktop Sidebar */}
      {mounted && isMobile ? null : (
        <aside
          ref={sidebarRef}
          className={cn(
            "hidden md:flex flex-col h-screen w-16 border-r border-border bg-card transition-all duration-300",
            !collapsed && "md:w-64"
          )}
        >
        {/* Header */}
        <div
          className={cn(
            "flex items-center transition-all duration-300 h-[64px] min-h-[64px]",
            collapsed ? "justify-center px-3 py-3" : "justify-between p-4"
          )}
        >
          {collapsed ? (
            <Link
              href="/rentals"
              className="flex-shrink-0 hover:opacity-80 transition-all duration-300 ease-in-out"
            >
              <VistralLogo variant={null} iconOnly={true} className="h-8 w-8" />
            </Link>
          ) : (
            <>
              <Link
                href="/rentals"
                className="flex-shrink-0 hover:opacity-80 transition-all duration-300 ease-in-out"
              >
                <VistralLogo variant={null} className="h-8" />
              </Link>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-md hover:bg-[var(--prophero-gray-100)] dark:hover:bg-[#1a1a1a] transition-colors flex-shrink-0"
              >
                <PanelLeftClose className="h-5 w-5 text-foreground" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          {!collapsed && (
            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sidebar.platform")}
              </p>
              <nav className="space-y-1">
                {platformItems.map((item) => {
                  const Icon = item.useCustomIcon && item.customIcon ? item.customIcon : (item.icon || Home);
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-[#CFE1FF] text-[#182C90]"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={(e) => {
                        // Prevenir que el click cause el colapso de la sidebar
                        e.stopPropagation();
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-[#182C90]" : "text-current")} />
                        <span className="whitespace-nowrap truncate">{item.label}</span>
                      </div>
                      {active && (
                        <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-[#182C90]" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
          {collapsed && (
            <nav className="space-y-1">
              {platformItems.map((item) => {
                const Icon = item.useCustomIcon && item.customIcon ? item.customIcon : (item.icon || Home);
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors w-full",
                      active
                        ? "bg-white"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    title={item.label}
                  >
                    {active ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                        <Icon className="h-5 w-5 flex-shrink-0 text-[#2050F6]" />
                      </div>
                    ) : (
                      <Icon className="h-5 w-5 flex-shrink-0 text-current" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Settings */}
          {collapsed ? (
            <nav className="space-y-1">
              {configItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors w-full",
                      active
                        ? "bg-white"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      item.comingSoon && "opacity-50 cursor-not-allowed"
                    )}
                    title={item.label}
                  >
                    {active ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                        <Icon className="h-5 w-5 flex-shrink-0 text-[#2050F6]" />
                      </div>
                    ) : (
                      <Icon className="h-5 w-5 flex-shrink-0 text-current" />
                    )}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sidebar.configuration")}
              </p>
              <nav className="space-y-1">
                {configItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-[#CFE1FF] text-[#182C90]"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                        item.comingSoon && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        // Prevenir que el click cause el colapso de la sidebar
                        e.stopPropagation();
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-[#182C90]" : "text-current")} />
                        <span className="whitespace-nowrap truncate">{item.label}</span>
                      </div>
                      {active && (
                        <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-[#182C90]" />
                      )}
                      {!active && item.comingSoon && (
                        <span className="ml-auto text-xs text-muted-foreground">{t("sidebar.soon") || "Pronto"}</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border flex-shrink-0">
          {collapsed && (
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

          {/* Menú de Usuario */}
          <div className="p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
                  collapsed && "justify-center"
                )}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                    <span className="text-xs font-semibold">{userInitial}</span>
                  </div>
                  {!collapsed && (
                    <>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">{email}</p>
                        <p className="text-xs text-muted-foreground truncate">{userRole}</p>
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
                  {t("userMenu.changePassword.menuItem") || "Cambiar Contraseña"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-80 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header Mobile */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link
            href="/rentals"
            onClick={handleMobileToggle}
            className="flex-shrink-0 hover:opacity-80"
          >
            <VistralLogo variant={null} className="h-8" />
          </Link>
          <button
            onClick={handleMobileToggle}
            className="p-2 rounded-md hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Mobile */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sidebar.platform")}
            </p>
            <nav className="space-y-1">
              {platformItems.map((item) => {
                const Icon = item.useCustomIcon && item.customIcon ? item.customIcon : (item.icon || Home);
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleMobileToggle}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-[#CFE1FF] text-[#182C90]"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-[#182C90]" : "text-current")} />
                      <span className="whitespace-nowrap truncate">{item.label}</span>
                    </div>
                    {active && (
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
              {t("sidebar.configuration")}
            </p>
            <nav className="space-y-1">
              {configItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleMobileToggle}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors min-w-0",
                      active
                        ? "bg-[#CFE1FF] text-[#182C90]"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      item.comingSoon && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-[#182C90]" : "text-current")} />
                      <span className="whitespace-nowrap truncate">{item.label}</span>
                    </div>
                    {active && (
                      <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-[#182C90]" />
                    )}
                    {!active && item.comingSoon && (
                      <span className="ml-auto text-xs text-muted-foreground">{t("sidebar.soon") || "Pronto"}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Mobile */}
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                  <span className="text-xs font-semibold">{userInitial}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{email}</p>
                  <p className="text-xs text-muted-foreground truncate">{userRole}</p>
                </div>
                <ChevronDown className="h-5 w-5 flex-shrink-0 text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" sideOffset={4}>
              {/* Theme Selector (Submenu) */}
              <ThemeSelector asSubmenu={true} />
              <DropdownMenuSeparator />

              {/* Language Selector (Submenu) */}
              <LanguageSelector asSubmenu={true} />
              <DropdownMenuSeparator />

              {/* Cambiar Contraseña */}
              <DropdownMenuItem
                onClick={() => setIsChangePasswordModalOpen(true)}
                className="flex items-center cursor-pointer"
              >
                <Lock className="mr-2 h-4 w-4" />
                {t("userMenu.changePassword.menuItem") || "Cambiar Contraseña"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Cerrar Sesión */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("nav.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
