"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

interface ChangePasswordModalProps {
  collapsed?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChangePasswordModal({ 
  collapsed = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ChangePasswordModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    // TODO: Implementar cambio de contraseña con Supabase
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Contraseña cambiada exitosamente");
    }, 1000);
  };

  // Si se pasa open controlado, no renderizar el trigger
  const dialogContent = (
    <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("changePassword")}</DialogTitle>
          <DialogDescription>
            Ingresa tu contraseña actual y la nueva contraseña.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current">Contraseña actual</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">Nueva contraseña</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar nueva contraseña</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Cambiando..." : "Cambiar contraseña"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
  );

  // Si se controla desde fuera (open y onOpenChange), no usar trigger
  if (controlledOpen !== undefined && controlledOnOpenChange) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  // Si no se controla desde fuera, usar trigger
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full", collapsed ? "justify-center" : "justify-start")}
        >
          <Lock className="h-4 w-4" />
          {!collapsed && <span className="ml-2">{t("changePassword")}</span>}
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
