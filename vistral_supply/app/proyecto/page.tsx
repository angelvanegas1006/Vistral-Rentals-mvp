"use client";

import { useAppAuth } from "@/lib/auth/app-auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ProyectoPage() {
  const { user, role } = useAppAuth();
  const { t } = useI18n();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t.nav.proyecto ?? "Proyecto"}</h1>
        <p className="text-muted-foreground">
          {user?.email || "User"} • {role ? (t.roles as Record<string, string>)[role] ?? role : "No role"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            {t.nav.proyecto ?? "Proyecto"}
          </CardTitle>
          <CardDescription>
            Área de proyectos multiunidad. Formularios Scouter y gestión de proyectos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aquí se integrarán los formularios y la lista de proyectos cuando se conecte Airtable o la fuente de datos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
