"use client";

import { useI18n } from "@/hooks/use-i18n";

export function RentalsHomeHeader() {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between px-margin-xs sm:px-margin-sm md:px-margin-md lg:px-margin-lg xl:px-margin-xl 2xl:px-margin-xxl py-4 border-b border-border bg-card">
      <h1 className="text-lg md:text-xl lg:text-2xl font-semibold">{t("nav.home")}</h1>
    </div>
  );
}
