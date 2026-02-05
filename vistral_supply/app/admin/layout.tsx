"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/lib/auth/app-auth-context";
import { isDemoMode } from "@/lib/utils";
import { SupplySidebar } from "@/components/supply/supply-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, isLoading } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isDemoMode() && !isLoading) {
      if (!user || role !== "supply_admin") {
        router.push("/supply");
      }
    }
  }, [user, role, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!isDemoMode() && role !== "supply_admin") {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SupplySidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
