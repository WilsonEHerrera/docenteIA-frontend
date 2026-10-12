"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { AuthCard } from "./AuthCard";

const MIN_PASSWORD = 10;

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) {
      return setFieldError(`Usa al menos ${MIN_PASSWORD} caracteres.`);
    }
    if (password !== confirm) return setFieldError("Las contraseñas no coinciden.");
    setFieldError(undefined);
    setError(null);
    setLoading(true);
    try {
      await apiFetch<void>("/auth/reset-password", {
        method: "POST",
        body: { token, newPassword: password },
      });
      setDone(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Nueva contraseña"
      description={token && !done ? "Elige una contraseña segura que no uses en otros servicios." : undefined}
      footerLink={{ href: "/login", label: "Volver a iniciar sesión" }}
    >
      {!token ? (
        <Alert variant="danger" title="Enlace no válido">
          Solicita uno nuevo desde «Recuperar contraseña».
        </Alert>
      ) : done ? (
        <Alert variant="success" title="Contraseña actualizada">
          Ya puedes iniciar sesión con tu nueva contraseña.
        </Alert>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <PasswordInput
            label="Nueva contraseña"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={`Mínimo ${MIN_PASSWORD} caracteres, que no sea común y que no incluya tu correo.`}
          />
          <PasswordInput
            label="Repite la contraseña"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={fieldError}
          />
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Guardar contraseña
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
