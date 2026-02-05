"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, use } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAppAuth } from "@/lib/auth/app-auth-context";
import { canCreateBudget } from "@/lib/auth/permissions";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Budget {
  id: string;
  property_id: string;
  version: number;
  items: BudgetItem[];
  total_amount: number | null;
  notes: string | null;
  is_current: boolean;
  created_at: string;
}

export default function PropertyBudgetPage() {
  const router = useRouter();
  const paramsPromise = useParams();
  const params = paramsPromise instanceof Promise ? use(paramsPromise) : paramsPromise;
  const propertyId = params.id as string;
  const { user, role } = useAppAuth();
  const { t } = useI18n();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || !canCreateBudget(role)) {
      router.push("/reno/kanban");
      return;
    }

    loadBudget();
  }, [propertyId, user, role]);

  const loadBudget = async () => {
    if (!propertyId) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_current", true)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading budget:", error);
        toast.error("Error al cargar el presupuesto");
        return;
      }

      if (data) {
        setBudget(data);
        setItems(Array.isArray(data.items) ? data.items : []);
        setNotes(data.notes || "");
      } else {
        // Create empty budget
        setItems([]);
        setNotes("");
      }
    } catch (error) {
      console.error("Error loading budget:", error);
      toast.error("Error al cargar el presupuesto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item_${Date.now()}`,
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unitPrice") {
            updated.total = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!propertyId || !user) return;

    setIsSaving(true);

    try {
      const supabase = createClient();
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      const version = budget ? budget.version + 1 : 1;

      const budgetData = {
        property_id: propertyId,
        version,
        items: items,
        total_amount: totalAmount,
        notes: notes || null,
        created_by: user.id,
        is_current: true,
      };

      const { error } = await supabase.from("budgets").insert(budgetData);

      if (error) {
        console.error("Error saving budget:", error);
        toast.error("Error al guardar el presupuesto");
        return;
      }

      toast.success("Presupuesto guardado correctamente");
      loadBudget();
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Error al guardar el presupuesto");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)]">
        <div className="container mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/reno/kanban")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Kanban
            </Button>
            <h1 className="text-2xl font-bold">Presupuesto de Propiedad</h1>
            <p className="text-muted-foreground">Propiedad ID: {propertyId}</p>
            {budget && (
              <p className="text-sm text-muted-foreground">
                Versión: {budget.version} | Creado: {new Date(budget.created_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Budget Items */}
          <div className="bg-card rounded-lg border p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Items del Presupuesto</h2>
              <Button onClick={handleAddItem} size="sm">
                Agregar Item
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay items en el presupuesto. Haz clic en "Agregar Item" para comenzar.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex gap-4 items-start p-4 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Descripción
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateItem(item.id, "description", e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Descripción del item"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border rounded-md"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Precio Unitario
                        </label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border rounded-md"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-lg font-semibold">
                        €{item.total.toFixed(2)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold">€{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card rounded-lg border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Notas</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md min-h-[100px]"
              placeholder="Agregar notas sobre el presupuesto..."
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push("/reno/kanban")}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Presupuesto"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
