"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ApiError, errorMessage, isLocked } from "@/lib/api/errors";
import { useAuth } from "@/providers/AuthProvider";

type FormState = "idle" | "loading" | "error" | "locked";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: typeof fieldErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Escribe tu correo institucional completo.";
    if (password.length === 0) errors.password = "Escribe tu contraseña.";
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    setState("loading");
    try {
      await login(email.trim(), password);
      router.replace("/inicio");
    } catch (error) {
      // 423 ACCOUNT_LOCKED and 429 TOO_MANY_REQUESTS block the form (API_CONTRATO §6.1).
      const blocked =
        isLocked(error) || (error instanceof ApiError && error.statusCode === 429);
      setState(blocked ? "locked" : "error");
      setMessage(errorMessage(error));
    }
  }

  const loading = state === "loading";

  return (
    <Card>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Iniciar sesión</h1>
        <p className="text-sm text-stone-600">Usa tu correo institucional.</p>
      </div>

      {(state === "error" || state === "locked") && (
        <div
          role="alert"
          className={
            state === "locked"
              ? "rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-stone-700"
              : "rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
          }
        >
          {message}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          label="Correo institucional"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          disabled={loading || state === "locked"}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          disabled={loading || state === "locked"}
        />
        <Button type="submit" loading={loading} disabled={state === "locked"} className="w-full">
          {loading ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>

      <p className="text-center text-xs">
        <Link
          href="/recuperar"
          className="text-stone-700 underline underline-offset-2 hover:text-stone-900"
        >
          Recuperar contraseña
        </Link>
      </p>
    </Card>
  );
}
