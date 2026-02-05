"use client";

import { useAppAuth } from "@/lib/auth/app-auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Package, CheckCircle, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function SupplyHomePage() {
  const { user, role } = useAppAuth();
  const { t } = useI18n();

  // Mock data for demo
  const stats = [
    { label: "Total Properties", value: "24", icon: Package, color: "text-blue-500" },
    { label: "In Progress", value: "8", icon: Clock, color: "text-yellow-500" },
    { label: "Completed", value: "12", icon: CheckCircle, color: "text-green-500" },
    { label: "Pending Review", value: "4", icon: Home, color: "text-purple-500" },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{t.nav.home}</h1>
        <p className="text-muted-foreground">
          {user?.email || "User"} • {role ? t.roles[role as keyof typeof t.roles] : "No role"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Properties</CardTitle>
          <CardDescription>Latest properties in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Property {i}</p>
                  <p className="text-sm text-muted-foreground">Address {i}, City</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {i % 2 === 0 ? "In Progress" : "Pending"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Mode Banner */}
      {process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url_here' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Demo Mode:</strong> This is a frontend-only preview. Configure Supabase to enable full functionality.
          </p>
        </div>
      )}
    </div>
  );
}
