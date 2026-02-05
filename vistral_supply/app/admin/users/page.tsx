"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Edit2, Save, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppAuth } from "@/lib/auth/app-auth-context";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  id: string;
  email: string;
  role: AppRole | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  updated_at: string | null;
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "supply_partner", label: "Supply Partner" },
  { value: "supply_analyst", label: "Supply Analyst" },
  { value: "renovator_analyst", label: "Renovator Analyst" },
  { value: "supply_lead", label: "Supply Lead" },
  { value: "reno_lead", label: "Reno Lead" },
  { value: "supply_admin", label: "Supply Admin" },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, role, isLoading: authLoading } = useAppAuth();
  const { t } = useI18n();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("supply_partner");
  const [isCreating, setIsCreating] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || role !== "supply_admin")) {
      router.push("/supply");
    }
  }, [user, role, authLoading, router]);

  // Load users
  useEffect(() => {
    if (role === "supply_admin") {
      loadUsers();
    }
  }, [role]);

  // Filter users by search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.email?.toLowerCase().includes(query) ||
            u.role?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      
      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }

      const { users: usersData } = await response.json();

      // Map users data from API response
      const usersList: UserWithRole[] = usersData.map((u: any) => ({
        id: u.id,
        email: u.email || `user_${u.id.substring(0, 8)}@example.com`,
        role: u.role as AppRole,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
        updated_at: u.updated_at || null,
      }));

      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (userId: string, currentRole: AppRole | null) => {
    setEditingUserId(userId);
    setEditingRole(currentRole);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingRole(null);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error("Email y contraseña son requeridos");
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear el usuario");
      }

      toast.success("Usuario creado correctamente");
      setShowAddUserModal(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("supply_partner");
      loadUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Error al crear el usuario");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveRole = async (userId: string) => {
    if (!editingRole) {
      toast.error("Selecciona un rol");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: editingRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar el rol");
      }

      toast.success("Rol actualizado correctamente");
      setEditingUserId(null);
      setEditingRole(null);
      loadUsers();
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast.error(error.message || "Error al guardar el rol");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (role !== "supply_admin") {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)]">
        <div className="container mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/supply")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold mb-2">Administración de Usuarios</h1>
            <p className="text-muted-foreground">
              Gestiona usuarios y sus roles en el sistema
            </p>
          </div>

          {/* Search and Add User */}
          <div className="mb-6 flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email o rol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowAddUserModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Usuario
            </Button>
          </div>

          {/* Users Table */}
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {isLoading ? "Cargando usuarios..." : "No se encontraron usuarios"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <Select
                            value={editingRole || ""}
                            onValueChange={(value: string) =>
                              setEditingRole(value as AppRole)
                            }
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="px-2 py-1 bg-muted rounded-md text-sm">
                            {user.role
                              ? ROLE_OPTIONS.find((r) => r.value === user.role)?.label ||
                                user.role
                              : "Sin rol"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleString("es-ES", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : user.updated_at
                          ? `Actualizado: ${new Date(user.updated_at).toLocaleString("es-ES", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : "Nunca"}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingUserId === user.id ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveRole(user.id)}
                              disabled={isSaving}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEdit(user.id, user.role)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Total Usuarios</div>
              <div className="text-2xl font-bold">{users.length}</div>
            </div>
            {ROLE_OPTIONS.map((roleOption) => {
              const count = users.filter((u) => u.role === roleOption.value).length;
              return (
                <div key={roleOption.value} className="bg-card rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{roleOption.label}</div>
                  <div className="text-2xl font-bold">{count}</div>
                </div>
              );
            })}
          </div>

          {/* Add User Modal */}
          <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Crea un nuevo usuario y asígnale un rol en el sistema.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="usuario@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={newUserRole}
                    onValueChange={(value: string) => setNewUserRole(value as AppRole)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUserEmail("");
                    setNewUserPassword("");
                    setNewUserRole("supply_partner");
                  }}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating ? "Creando..." : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
