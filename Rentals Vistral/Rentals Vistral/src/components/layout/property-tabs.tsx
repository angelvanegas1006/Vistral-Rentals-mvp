"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface PropertyTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export function PropertyTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: PropertyTabsProps) {
  const handleTabClick = (tabId: string) => {
    onTabChange?.(tabId);
  };

  return (
    <div
      className={cn(
        "flex-shrink-0 overflow-x-auto -mx-[20px] px-[20px] sm:-mx-8 sm:px-8 md:-mx-10 md:px-10 lg:mx-0 lg:px-0 scrollbar-hidden pt-[3px] pb-[3px]",
        className
      )}
    >
      <nav className="bg-[#FAFAFA] dark:bg-[var(--prophero-gray-800)] rounded-[18px] px-1 py-0 h-auto w-max lg:w-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "rounded-[18px] px-4 py-2 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                "text-[#212121] dark:text-foreground",
                isActive
                  ? "bg-white dark:bg-[var(--prophero-gray-700)] shadow-sm text-[#212121] dark:text-foreground"
                  : "bg-transparent hover:opacity-80"
              )}
            >
              <div className="flex items-center gap-2">
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="inline-flex items-center justify-center h-4 w-4 md:h-5 md:w-5 rounded-full bg-red-500 text-white text-[10px] md:text-xs font-semibold">
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
