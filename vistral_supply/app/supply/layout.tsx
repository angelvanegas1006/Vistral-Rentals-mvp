"use client";

import { SupplySidebar } from "@/components/supply/supply-sidebar";
import { useState, useEffect } from "react";
import { useAppAuth } from "@/lib/auth/app-auth-context";
import { useRouter, usePathname } from "next/navigation";
import { isDemoMode } from "@/lib/utils";

export default function SupplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, isLoading } = useAppAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Hide main sidebar on property edit pages (they have their own EditSidebar)
  const isPropertyEditPage = pathname?.includes("/property/") && pathname?.includes("/edit");
  // Property detail pages (non-edit) also need special handling
  const isPropertyDetailPage = pathname?.includes("/property/") && !pathname?.includes("/edit");

  // Ensure we only render after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle redirects after mount
  useEffect(() => {
    if (!mounted) return;
    
    // In demo mode, allow access
    if (isDemoMode()) {
      return;
    }

    // Timeout: if loading takes more than 3 seconds, redirect to login
    const redirectTimer = setTimeout(() => {
      if (isLoading) {
        console.warn('[SupplyLayout] ⚠️ Auth loading timeout, redirecting to login');
        router.push("/login");
      }
    }, 3000);

    // In non-demo mode, check auth
    if (isLoading) {
      return () => clearTimeout(redirectTimer);
    }

    // Clear timeout if we're not loading anymore
    clearTimeout(redirectTimer);

    if (!user || !role) {
      router.push("/login");
      return;
    }

    // Only allow supply roles (including Reno and Proyecto roles that can access Supply)
    const allowedRoles = [
      'supply_partner',
      'supply_analyst',
      'supply_admin',
      'supply_lead',
      'renovator_analyst',
      'reno_lead',
      'scouter',
      'supply_project_analyst',
      'supply_project_lead',
    ];
    if (role && !allowedRoles.includes(role)) {
      router.push("/login");
      return;
    }

    return () => clearTimeout(redirectTimer);
  }, [mounted, user, role, isLoading, router]);

  // Show loading state during initial mount
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  // If not in demo mode and still loading auth, show loading with timeout
  // After 3 seconds, show the layout anyway (will redirect if needed)
  if (!isDemoMode() && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  // Always render the same structure to avoid hydration mismatch
  // Hide main sidebar on property edit pages (they have their own EditSidebar)
  // Property detail pages also need full height without main sidebar
  if (isPropertyEditPage || isPropertyDetailPage) {
    return (
      <div className="flex h-screen overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SupplySidebar 
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
