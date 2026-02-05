"use client";

import { useState } from "react";
import { SupplyKanbanHeader } from "@/components/supply/kanban/supply-kanban-header";
import { SupplyKanbanBoard } from "@/components/supply/kanban/supply-kanban-board";

export default function RenoKanbanPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <SupplyKanbanHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddProperty={() => {
          // Reno roles don't create properties, they work with existing ones
          console.log("Reno roles work with existing properties");
        }}
      />
      <div 
        className="flex-1 overflow-y-auto md:overflow-hidden p-3 md:p-6 bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)]"
        data-scroll-container
      >
        <SupplyKanbanBoard 
          searchQuery={searchQuery}
          isLoading={isLoading}
          kanbanView="reno"
        />
      </div>
    </div>
  );
}
