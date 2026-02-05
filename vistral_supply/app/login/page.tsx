"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuthContext } from "@/lib/auth/supabase-auth-context";
import { useAppAuth } from "@/lib/auth/app-auth-context";
import { ArchitecturalWireframeBackground } from "@/components/auth/architectural-wireframe-background";
import { LoginForm } from "@/components/auth/login-form";
import { LoginLanguageSelector } from "@/components/auth/login-language-selector";
import { useI18n } from "@/lib/i18n";
import { isDemoMode } from "@/lib/utils";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, loading: supabaseLoading } = useSupabaseAuthContext();
  const { role, isLoading: appLoading } = useAppAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isDemoMode()) {
      // In demo mode, show a button to go to supply
      return;
    }

    if (!supabaseLoading && !appLoading && user && role) {
      const allowedRoles = [
        'supply_partner',
        'supply_analyst',
        'supply_admin',
        'supply_lead',
        'renovator_analyst',
        'reno_lead',
      ];
      if (allowedRoles.includes(role)) {
        // Redirect to Supply by default (Reno roles can also access Supply)
        router.push("/supply");
      }
    }
  }, [user, role, supabaseLoading, appLoading, router]);

  // Show loading state - but with aggressive timeout to prevent infinite loading
  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    // Timeout after 2 seconds - show login form anyway
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);
    
    // If auth finishes loading, hide loading immediately
    if (!isDemoMode() && !supabaseLoading && !appLoading) {
      setShowLoading(false);
    }
    
    return () => clearTimeout(timer);
  }, [supabaseLoading, appLoading]);

  // Only show loading if we're actually loading AND haven't timed out
  // Always show login form after 2 seconds max
  if (showLoading && !isDemoMode() && (supabaseLoading || appLoading)) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div className="relative">
          <ArchitecturalWireframeBackground />
        </div>
        <div className="relative flex min-h-screen flex-col items-center justify-center p-8 bg-card dark:bg-[var(--prophero-gray-900)]">
          <div className="text-center text-muted-foreground">
            {t.common.loading}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left column: architectural illustration */}
      <div className="relative">
        <ArchitecturalWireframeBackground />
      </div>

      {/* Right column: login form */}
      <div className="relative flex min-h-screen flex-col items-center justify-center p-8 bg-card dark:bg-[var(--prophero-gray-900)]">
        {/* Language Selector - Top Right */}
        <div className="absolute top-6 right-6">
          <LoginLanguageSelector />
        </div>

        <LoginForm />

        {/* Footer links */}
        <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3 text-xs">
          <div className="flex items-center justify-center gap-6">
            <a className="pointer-events-auto text-muted-foreground hover:text-foreground hover:underline transition-colors" href="#">{t.login.support}</a>
            <a className="pointer-events-auto text-muted-foreground hover:text-foreground hover:underline transition-colors" href="#">{t.login.privacy}</a>
            <a className="pointer-events-auto text-muted-foreground hover:text-foreground hover:underline transition-colors" href="#">{t.login.terms}</a>
          </div>
          <div className="text-xs text-muted-foreground">
            {t.login.copyright}
          </div>
        </div>
      </div>
    </div>
  );
}
