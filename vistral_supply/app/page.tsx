"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Simple redirect to login - no auth checks
    // Use replace to avoid adding to history
    router.replace("/login");
    
    // Fallback timeout: if redirect doesn't work, try again after 1 second
    const fallbackTimer = setTimeout(() => {
      router.replace("/login");
    }, 1000);
    
    return () => clearTimeout(fallbackTimer);
  }, [router, mounted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-muted-foreground">Redirecting to login...</div>
      </div>
    </div>
  );
}
