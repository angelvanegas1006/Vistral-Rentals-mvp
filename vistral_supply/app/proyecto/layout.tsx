"use client";

import { SupplySidebar } from "@/components/supply/supply-sidebar";
import { useState, useEffect } from "react";
import { useAppAuth } from "@/lib/auth/app-auth-context";
import { useRouter } from "next/navigation";
import { isDemoMode } from "@/lib/utils";
import { hasProyectoAccess } from "@/lib/auth/permissions";

export default function ProyectoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, isLoading } = useAppAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isDemoMode()) {
      return;
    }

    const redirectTimer = setTimeout(() => {
      if (isLoading) {
        router.push("/login");
      }
    }, 3000);

    if (isLoading) {
      return () => clearTimeout(redirectTimer);
    }

    clearTimeout(redirectTimer);

    if (!user || !role) {
      router.push("/login");
      return;
    }

    if (!hasProyectoAccess(role)) {
      router.push("/supply");
      return;
    }

    return () => clearTimeout(redirectTimer);
  }, [mounted, user, role, isLoading, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isDemoMode() && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading...</div>
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
