"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
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
        <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-700">
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
      <div className="flex justify-end gap-2">
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-stone-900">Usuarios</h2>
        <Button onClick={() => setEditing("new")}>Nuevo usuario</Button>
      </div>

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
          <Table>
            <THead>
              <TR>
                <TH>Nombre</TH>
                <TH>Correo</TH>
                <TH>Rol</TH>
                <TH>Estado</TH>
                <TH>Último acceso</TH>
                <TH>Acciones</TH>
              </TR>
            </THead>
            <TBody>
              {users.data.data.map((user) => (
                <TR key={user.id}>
                  <TD className="font-medium text-stone-900">{user.fullName}</TD>
                  <TD className="font-mono">{user.email}</TD>
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
                  <TD className="font-mono">{formatDateTime(user.lastLoginAt)}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1.5">
                      <Button variant="secondary" onClick={() => setEditing(user)} disabled={busyId === user.id}>
                        Editar
                      </Button>
                      {isLocked(user) && (
                        <Button
                          variant="secondary"
                          onClick={() => void unlock(user)}
                          loading={busyId === user.id}
                        >
                          Desbloquear
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => void revokeSessions(user)}
                        disabled={busyId === user.id}
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
