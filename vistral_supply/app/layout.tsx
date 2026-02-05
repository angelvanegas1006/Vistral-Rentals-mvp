import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SupabaseAuthProvider } from "@/lib/auth/supabase-auth-context";
import { AppAuthProvider } from "@/lib/auth/app-auth-context";
import { I18nProvider } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vistral Supply",
  description: "Vistral Supply - Supply Management Platform",
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
