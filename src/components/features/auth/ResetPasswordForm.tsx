"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";

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
    <Card>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Nueva contraseña</h1>

      {!token ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          El enlace no es válido. Solicita uno nuevo desde “Recuperar contraseña”.
        </p>
      ) : done ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          Tu contraseña se actualizó. Ya puedes iniciar sesión.
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </p>
          )}
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={`Mínimo ${MIN_PASSWORD} caracteres, que no sea común y que no incluya tu correo.`}
          />
          <Input
            label="Repite la contraseña"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={fieldError}
          />
          <Button type="submit" loading={loading} className="w-full">
            Guardar contraseña
          </Button>
        </form>
      )}

      <p className="text-center text-xs">
        <Link href="/login" className="text-stone-700 underline underline-offset-2 hover:text-stone-900">
          Volver a iniciar sesión
        </Link>
      </p>
    </Card>
  );
}
