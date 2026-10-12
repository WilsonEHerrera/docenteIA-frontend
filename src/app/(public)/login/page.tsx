"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ApiError, errorMessage, isLocked } from "@/lib/api/errors";
import { returnPathFromLocation } from "@/lib/auth/return-path";
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
      router.replace(returnPathFromLocation());
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
    <AuthCard
      title="Iniciar sesión"
      description="Ingresa con tu correo institucional."
      footerLink={{ href: "/recuperar", label: "¿Olvidaste tu contraseña?" }}
    >
      {state === "locked" && (
        <Alert variant="warning" title="Acceso bloqueado temporalmente">
          {message}
        </Alert>
      )}
      {state === "error" && <Alert variant="danger">{message}</Alert>}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          label="Correo institucional"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="nombre@institucion.edu.co"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          disabled={loading || state === "locked"}
        />
        <PasswordInput
          label="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          disabled={loading || state === "locked"}
        />
        <Button type="submit" loading={loading} disabled={state === "locked"} className="mt-2 w-full">
          {loading ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>
    </AuthCard>
  );
}
