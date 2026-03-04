"use client";

import { useState } from "react";
import { RentalsSidebar } from "@/components/rentals/rentals-sidebar";
import { useTeam } from "@/hooks/use-team";
import { useI18n } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TeamPage() {
  const { members, loading, createUser } = useTeam();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await createUser({ email, password, full_name: fullName });
      toast.success(t("team.userCreated"));
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || t("team.userCreateError"));
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <RentalsSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4 min-h-[64px]">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {t("team.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("team.subtitle")}
              </p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                {t("team.addUser")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("team.addUser")}</DialogTitle>
                <DialogDescription>
                  {t("team.subtitle")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t("team.fullName")}</Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nombre Apellido"
                    required
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_email">{t("team.email")}</Label>
                  <Input
                    id="new_email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@email.com"
                    required
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">{t("team.temporaryPassword")}</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("team.role")}</Label>
                  <Input value="admin" disabled />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={creating}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="animate-spin" />
                        {t("team.creating")}
                      </>
                    ) : (
                      t("team.createUser")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[var(--vistral-gray-50)] dark:bg-[#000000]">
          <div className="max-w-[1200px] mx-auto px-6 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>{t("team.noMembers")}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("team.fullName")}</TableHead>
                      <TableHead>{t("team.email")}</TableHead>
                      <TableHead>{t("team.role")}</TableHead>
                      <TableHead>{t("team.createdAt")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.full_name || "—"}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(member.created_at), "d MMM yyyy", {
                            locale: es,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
