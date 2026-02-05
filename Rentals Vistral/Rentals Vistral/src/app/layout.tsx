import type { Metadata } from "next";
import "./globals.css";
import "./vistral.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { SupabaseAuthProvider } from "@/lib/auth/supabase-auth-provider";
import { AppAuthProvider } from "@/lib/auth/app-auth-provider";

export const metadata: Metadata = {
  title: "Rentals Vistral",
  description: "Rentals Vistral - Next.js Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <I18nProvider>
            <SupabaseAuthProvider>
              <AppAuthProvider>
                {children}
                <Toaster />
              </AppAuthProvider>
            </SupabaseAuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

