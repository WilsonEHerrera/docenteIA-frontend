"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PlusIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SectionHeader } from "@/components/ui/PageHeader";
import { Pager } from "@/components/ui/Pager";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/format";
import type { Paginated, Role, UserView } from "@/types/api";

const LIMIT = 20;
const ROLES = Object.keys(ROLE_LABELS) as Role[];
const MIN_PASSWORD = 10;

interface UserFormProps {
  user: UserView | null; // null = create
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    email: string;
    fullName: string;
    role: Role;
    isActive: boolean;
    password: string;
  }) => void;
}

function UserForm({ user, saving, onCancel, onSubmit }: UserFormProps) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "TEACHER");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!user && !/^\S+@\S+\.\S+$/.test(email)) found.email = "Escribe un correo válido.";
    if (fullName.trim().length < 2) found.fullName = "Escribe el nombre completo.";
    if ((!user || password) && password.length < MIN_PASSWORD) {
      found.password = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
    }
    setErrors(found);
    if (Object.keys(found).length === 0) {
      onSubmit({ email: email.trim(), fullName: fullName.trim(), role, isActive, password });
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {!user && (
        <Input
          label="Correo institucional"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
      )}
      <Input
        label="Nombre completo"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        error={errors.fullName}
      />
      <Select label="Rol" value={role} onChange={(event) => setRole(event.target.value as Role)}>
        {ROLES.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value]}
          </option>
        ))}
      </Select>
      {user && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-stone-200 px-3 text-sm text-stone-800">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="size-4 cursor-pointer accent-stone-900"
          />
          Cuenta activa
        </label>
      )}
      <Input
        label={user ? "Nueva contraseña (opcional)" : "Contraseña inicial"}
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
        hint={user ? "Cambiarla cierra las sesiones del usuario." : undefined}
      />
      <div className="flex flex-col-reverse gap-2 border-t border-border-soft pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {user ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}

export function UsersScreen() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const users = useApiQuery<Paginated<UserView>>("/users", { page, limit: LIMIT });
  const [editing, setEditing] = useState<UserView | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function save(values: Parameters<UserFormProps["onSubmit"]>[0]) {
    setSaving(true);
    try {
      if (editing === "new") {
        await apiFetch("/users", {
          method: "POST",
          body: {
            email: values.email,
            fullName: values.fullName,
            role: values.role,
            password: values.password,
          },
        });
        toast.show("Usuario creado.", "success");
      } else if (editing) {
        await apiFetch(`/users/${editing.id}`, {
          method: "PATCH",
          body: {
            fullName: values.fullName,
            role: values.role,
            isActive: values.isActive,
            ...(values.password ? { password: values.password } : {}),
          },
        });
        toast.show("Cambios guardados.", "success");
      }
      setEditing(null);
      users.reload();
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function unlock(user: UserView) {
    setBusyId(user.id);
    try {
      await apiFetch(`/users/${user.id}`, { method: "PATCH", body: { unlock: true } });
      toast.show(`Cuenta de ${user.fullName} desbloqueada.`, "success");
      users.reload();
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setBusyId(null);
    }
  }

  async function revokeSessions(user: UserView) {
    setBusyId(user.id);
    try {
      await apiFetch<void>(`/users/${user.id}/sessions`, { method: "DELETE" });
      toast.show(`Se cerraron las sesiones de ${user.fullName}.`, "success");
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setBusyId(null);
    }
  }

  // Captured when the screen opens: a lock that expires while the list is open is cleared on reload.
  const [openedAt] = useState(() => Date.now());
  const isLocked = (user: UserView) =>
    user.lockedUntil !== null && new Date(user.lockedUntil).getTime() > openedAt;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Usuarios"
        description="Cuentas de la institución, sus roles y el estado de acceso."
        actions={
          <Button onClick={() => setEditing("new")}>
            <PlusIcon />
            Nuevo usuario
          </Button>
        }
      />

      {users.error !== null ? (
        <ErrorState error={users.error} onRetry={users.reload} />
      ) : users.loading || !users.data ? (
        <div role="status" aria-label="Cargando usuarios" className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : users.data.data.length === 0 ? (
        <EmptyState title="Sin usuarios" description="Crea el primer usuario de la institución." />
      ) : (
        <>
          <Table label="Usuarios" className="min-w-[60rem]">
            <THead>
              <TR>
                <TH sticky>Nombre</TH>
                <TH>Correo</TH>
                <TH>Rol</TH>
                <TH>Estado</TH>
                <TH>Último acceso</TH>
                <TH numeric>
                  <span className="sr-only">Acciones</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {users.data.data.map((user) => (
                <TR key={user.id}>
                  <TD sticky className="font-medium whitespace-nowrap text-stone-900">{user.fullName}</TD>
                  <TD className="font-mono text-xs">{user.email}</TD>
                  <TD>{ROLE_LABELS[user.role]}</TD>
                  <TD>
                    {isLocked(user) ? (
                      <Badge variant="warning">Bloqueado</Badge>
                    ) : user.isActive ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="neutral">Inactivo</Badge>
                    )}
                  </TD>
                  <TD className="font-mono text-xs whitespace-nowrap">{formatDateTime(user.lastLoginAt)}</TD>
                  <TD>
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditing(user)}
                        disabled={busyId === user.id}
                        aria-label={`Editar a ${user.fullName}`}
                      >
                        Editar
                      </Button>
                      {isLocked(user) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void unlock(user)}
                          loading={busyId === user.id}
                          aria-label={`Desbloquear a ${user.fullName}`}
                        >
                          Desbloquear
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void revokeSessions(user)}
                        disabled={busyId === user.id}
                        aria-label={`Cerrar las sesiones de ${user.fullName}`}
                      >
                        Cerrar sesiones
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pager page={page} limit={LIMIT} total={users.data.meta.total} onChange={setPage} />
        </>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Nuevo usuario" : "Editar usuario"}
      >
        {editing !== null && (
          <UserForm
            key={editing === "new" ? "new" : editing.id}
            user={editing === "new" ? null : editing}
            saving={saving}
            onCancel={() => setEditing(null)}
            onSubmit={(values) => void save(values)}
          />
        )}
      </Modal>
    </div>
  );
}
