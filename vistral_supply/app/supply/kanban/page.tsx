"use client";

import { useState } from "react";
import { SupplyKanbanHeader } from "@/components/supply/kanban/supply-kanban-header";
import { SupplyKanbanBoard } from "@/components/supply/kanban/supply-kanban-board";
import { AddPropertyModal } from "@/components/supply/add-property-modal";
import { useAppAuth } from "@/lib/auth/app-auth-context";

type KanbanView = "partner" | "analyst" | "reno";

export default function SupplyKanbanPage() {
  const { role } = useAppAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  // Admin can switch between Kanbans
  const [selectedKanbanView, setSelectedKanbanView] = useState<KanbanView>("partner");

  // Simulate loading for demo
  // In real app, this would be based on actual data fetching
  // useEffect(() => {
  //   setIsLoading(true);
  //   // Fetch data...
  //   setTimeout(() => setIsLoading(false), 1000);
  // }, []);

  // Determine which Kanban to show
  const kanbanView: KanbanView = role === "supply_admin" 
    ? selectedKanbanView 
    : role === "supply_analyst" || role === "supply_lead"
    ? "analyst"
    : role === "renovator_analyst" || role === "reno_lead"
    ? "reno"
    : "partner";

  return (
    <div className="flex flex-col h-full">
      <SupplyKanbanHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddProperty={() => {
          setIsAddPropertyModalOpen(true);
        }}
        selectedKanbanView={role === "supply_admin" ? selectedKanbanView : undefined}
        onKanbanViewChange={role === "supply_admin" ? setSelectedKanbanView : undefined}
      />
      <div 
        className="flex-1 overflow-y-auto md:overflow-hidden p-3 md:p-6 bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)]"
        data-scroll-container
      >
        <SupplyKanbanBoard 
          searchQuery={searchQuery}
          isLoading={isLoading}
          kanbanView={kanbanView}
        />
      </div>

      {/* Add Property Modal - Only for creating new properties */}
      <AddPropertyModal
        open={isAddPropertyModalOpen}
        onOpenChange={(open) => {
          setIsAddPropertyModalOpen(open);
        }}
      />
    </div>
  );
}
