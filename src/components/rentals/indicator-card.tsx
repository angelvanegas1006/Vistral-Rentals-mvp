"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface IndicatorCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
}

export function IndicatorCard({
  title,
  value,
  description,
  icon: Icon,
}: IndicatorCardProps) {
  return (
    <Card className="bg-card border-2 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl md:text-2xl font-bold text-foreground">
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
