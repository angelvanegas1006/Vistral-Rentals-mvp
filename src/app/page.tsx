"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la nueva página de rentals
    router.replace("/rentals");
  }, [router]);

  // Mostrar un loader mientras redirige
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
}
