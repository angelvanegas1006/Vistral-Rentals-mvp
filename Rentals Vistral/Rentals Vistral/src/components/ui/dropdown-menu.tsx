"use client"

import * as React from "react"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

// Versión simplificada sin Radix UI - solo para uso temporal
const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // No cerrar si el click es dentro del dropdown o su trigger
      if (!target.closest('[data-dropdown-menu]')) {
        setOpen(false);
      }
    };

    if (open) {
      // Usar un pequeño delay para evitar que se cierre inmediatamente
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative" data-dropdown-menu>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, className, onClick, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const newOpenState = !open;
    setOpen(newOpenState);
    onClick?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    const childOnClick = children.props.onClick;
    return React.cloneElement(children, {
      ...children.props,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        const newOpenState = !open;
        setOpen(newOpenState);
        childOnClick?.(e);
      },
      ref,
      type: "button",
    } as any);
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(className)}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" | "center"; sideOffset?: number; side?: "top" | "bottom" }
>(({ className, align = "start", sideOffset = 4, side = "bottom", children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const menuContainerRef = React.useRef<HTMLElement | null>(null);

  // Encontrar el contenedor del menu y el trigger
  React.useEffect(() => {
    if (open && contentRef.current) {
      menuContainerRef.current = contentRef.current.closest('[data-dropdown-menu]') as HTMLElement;
    }
  }, [open]);

  // Calcular posición cuando se abre
  React.useEffect(() => {
    if (open && contentRef.current && menuContainerRef.current) {
      const trigger = menuContainerRef.current.querySelector('button, [role="button"]') as HTMLElement;
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      
      // Crear el elemento temporalmente para medir
      contentRef.current.style.visibility = "hidden";
      contentRef.current.style.display = "block";
      const contentRect = contentRef.current.getBoundingClientRect();
      
      // Determinar si abrir arriba o abajo
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      // Solo abrir arriba si realmente no hay espacio suficiente abajo (con margen de 100px)
      const shouldOpenAbove = side === "top" || (spaceBelow < contentRect.height + 100 && spaceAbove > spaceBelow);
      
      let top: number;
      let left = triggerRect.left;
      
      if (shouldOpenAbove) {
        // Abrir arriba del trigger, pero no tan arriba - dejar un pequeño margen
        top = triggerRect.top - contentRect.height - sideOffset;
        // Asegurar que no quede demasiado arriba
        if (top < 8) {
          top = 8;
        }
      } else {
        // Abrir abajo del trigger
        top = triggerRect.bottom + sideOffset;
      }
      
      if (align === "end") {
        left = triggerRect.right - contentRect.width;
      } else if (align === "center") {
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
      }

      // Ajustar si se sale de la pantalla horizontalmente
      if (left + contentRect.width > window.innerWidth) {
        left = window.innerWidth - contentRect.width - 8;
      }
      if (left < 8) {
        left = 8;
      }
      
      // Ajustar si se sale de la pantalla verticalmente
      if (top + contentRect.height > window.innerHeight) {
        top = window.innerHeight - contentRect.height - 8;
      }
      if (top < 8) {
        top = 8;
      }

      contentRef.current.style.position = "fixed";
      contentRef.current.style.top = `${top}px`;
      contentRef.current.style.left = `${left}px`;
      contentRef.current.style.visibility = "visible";
    }
  }, [open, align, sideOffset, side]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[45]"
        onClick={() => setOpen(false)}
        onMouseDown={(e) => {
          if (contentRef.current?.contains(e.target as Node)) {
            return;
          }
          setOpen(false);
        }}
      />
      <div
        ref={(node) => {
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          contentRef.current = node;
        }}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        data-state={open ? "open" : "closed"}
        {...props}
      >
        {children}
      </div>
    </>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean; onSelect?: (e: Event) => void }
>(({ className, inset, onClick, onSelect, ...props }, ref) => {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Si el item está dentro de un submenu, no cerrar el dropdown principal
    const isInSubmenu = (e.currentTarget as HTMLElement).closest('[data-submenu="content"]');
    if (!isInSubmenu) {
      onClick?.(e);
      // Solo cerrar si no es un submenu trigger
      const isSubmenuTrigger = (e.currentTarget as HTMLElement).closest('[data-submenu="trigger"]');
      if (!isSubmenuTrigger) {
        setOpen(false);
      }
    } else {
      onClick?.(e);
      // Cerrar el dropdown principal cuando se selecciona un item del submenu
      setOpen(false);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground",
        inset && "pl-8",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

// Submenu context
const SubmenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <SubmenuContext.Provider value={{ open, setOpen }}>
      <div className="relative" data-submenu-container>{children}</div>
    </SubmenuContext.Provider>
  );
};

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SubmenuContext);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    // Delay para permitir movimiento al submenu
    timeoutRef.current = setTimeout(() => {
      const submenu = document.querySelector('[data-submenu="content"]');
      const trigger = document.querySelector('[data-submenu="trigger"]');
      // Verificar si el mouse está sobre el submenu o el trigger
      if (!submenu?.matches(':hover') && !trigger?.matches(':hover')) {
        setOpen(false);
      }
    }, 200);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setOpen(!open);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      data-submenu="trigger"
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
        open && "bg-accent",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </div>
  );
});
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SubmenuContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Calcular posición del submenu
  React.useEffect(() => {
    if (open && contentRef.current) {
      // Buscar el trigger de manera más robusta
      const submenuContainer = contentRef.current.closest('[data-submenu-container]') as HTMLElement;
      const trigger = submenuContainer?.querySelector('[data-submenu="trigger"]') as HTMLElement;
      
      if (!trigger) {
        // Fallback: buscar en el DOM completo
        const allTriggers = document.querySelectorAll('[data-submenu="trigger"]');
        const parentContainer = contentRef.current.parentElement;
        // Encontrar el trigger que está en el mismo contenedor
        for (const t of allTriggers) {
          if (parentContainer?.contains(t)) {
            const triggerRect = (t as HTMLElement).getBoundingClientRect();
            contentRef.current.style.visibility = "hidden";
            contentRef.current.style.display = "block";
            const contentRect = contentRef.current.getBoundingClientRect();
            
            // SIEMPRE abrir a la derecha del trigger
            let left = triggerRect.right + 4;
            let top = triggerRect.top;
            
            // Ajustar si se sale de la pantalla horizontalmente
            if (left + contentRect.width > window.innerWidth) {
              // Si no cabe a la derecha, abrir a la izquierda
              left = triggerRect.left - contentRect.width - 4;
            }
            if (left < 8) {
              left = 8;
            }
            
            // Ajustar si se sale de la pantalla verticalmente
            if (top + contentRect.height > window.innerHeight) {
              top = window.innerHeight - contentRect.height - 8;
            }
            if (top < 8) {
              top = 8;
            }
            
            contentRef.current.style.position = "fixed";
            contentRef.current.style.left = `${left}px`;
            contentRef.current.style.top = `${top}px`;
            contentRef.current.style.visibility = "visible";
            return;
          }
        }
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      contentRef.current.style.visibility = "hidden";
      contentRef.current.style.display = "block";
      const contentRect = contentRef.current.getBoundingClientRect();
      
      // SIEMPRE abrir a la derecha del trigger
      let left = triggerRect.right + 4;
      let top = triggerRect.top;
      
      // Ajustar si se sale de la pantalla horizontalmente
      if (left + contentRect.width > window.innerWidth) {
        // Si no cabe a la derecha, abrir a la izquierda
        left = triggerRect.left - contentRect.width - 4;
      }
      if (left < 8) {
        left = 8;
      }
      
      // Ajustar si se sale de la pantalla verticalmente
      if (top + contentRect.height > window.innerHeight) {
        top = window.innerHeight - contentRect.height - 8;
      }
      if (top < 8) {
        top = 8;
      }
      
      contentRef.current.style.position = "fixed";
      contentRef.current.style.left = `${left}px`;
      contentRef.current.style.top = `${top}px`;
      contentRef.current.style.visibility = "visible";
    }
  }, [open]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      const trigger = document.querySelector('[data-submenu="trigger"]');
      // Verificar si el mouse está sobre el trigger
      if (!trigger?.matches(':hover')) {
        setOpen(false);
      }
    }, 200);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!open) return null;

  return (
    <div
      ref={(node) => {
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        contentRef.current = node;
      }}
      data-submenu="content"
      className={cn(
        "z-[60] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

// Placeholders para compatibilidad
const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DropdownMenuCheckboxItem = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DropdownMenuRadioItem = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DropdownMenuShortcut = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
