"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { canAssignProperty } from "@/lib/auth/permissions";
import type { Database } from "@/lib/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface PropertyAssignmentProps {
  propertyId: string;
  userRole: AppRole | null;
  onAssigned?: () => void;
}

interface User {
  id: string;
  email: string;
  role: string;
}

export function PropertyAssignment({ propertyId, userRole, onAssigned }: PropertyAssignmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!canAssignProperty(userRole)) {
    return null;
  }

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Get all users with supply roles
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["supply_partner", "supply_analyst"]);

      if (roleError) {
        console.error("Error loading users:", roleError);
        toast.error("Error al cargar usuarios");
        return;
      }

      if (!roleData || roleData.length === 0) {
        setUsers([]);
        return;
      }

      // Get user emails from auth.users (we'll need to use a function or get from a view)
      // For now, we'll use the user_roles data and try to get emails
      type RoleRow = { user_id: string; role: string };
      const roleRows = roleData as RoleRow[];
      const userIds = roleRows.map((r: RoleRow) => r.user_id);
      
      // Note: In production, you might want to create a view or function that joins
      // user_roles with auth.users to get emails. For now, we'll use a workaround.
      const usersList: User[] = roleRows.map((r: RoleRow) => ({
        id: r.user_id,
        email: `user_${r.user_id.substring(0, 8)}`, // Placeholder
        role: r.role,
      }));

      setUsers(usersList);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error("Selecciona un usuario");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      
      // Update property's created_by or use property_contact table
      // For now, we'll update created_by (though this changes ownership)
      // In production, you might want to use a separate "assigned_to" field
      const { error } = await supabase
        .from("properties")
        .update({
          created_by: selectedUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", propertyId);

      if (error) {
        console.error("Error assigning property:", error);
        toast.error("Error al asignar la propiedad");
        return;
      }

      toast.success("Propiedad asignada correctamente");
      setIsOpen(false);
      setSelectedUserId("");
      onAssigned?.();
    } catch (error) {
      console.error("Error assigning property:", error);
      toast.error("Error al asignar la propiedad");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Asignar Propiedad
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Propiedad</DialogTitle>
            <DialogDescription>
              Selecciona un usuario para asignar esta propiedad.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Usuario
              </label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssign} disabled={isSaving || !selectedUserId}>
              {isSaving ? "Asignando..." : "Asignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
