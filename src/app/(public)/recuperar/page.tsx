"use client";

import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";

type FormState = "idle" | "loading" | "sent" | "error";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFieldError("Escribe tu correo institucional completo.");
      return;
    }
    setFieldError(undefined);
    setState("loading");
    try {
      await apiFetch<void>("/auth/forgot-password", { method: "POST", body: { email: email.trim() } });
      setState("sent");
    } catch (caught) {
      setError(errorMessage(caught));
      setState("error");
    }
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      description="Te enviaremos un enlace para crear una contraseña nueva."
      footerLink={{ href: "/login", label: "Volver a iniciar sesión" }}
    >
      {state === "sent" ? (
        <Alert variant="success" title="Revisa tu correo">
          Si el correo está registrado, recibirás un enlace en unos minutos. Revisa también la carpeta de spam.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {state === "error" && <Alert variant="danger">{error}</Alert>}
          <Input
            label="Correo institucional"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="nombre@institucion.edu.co"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldError}
            disabled={state === "loading"}
          />
          <Button type="submit" loading={state === "loading"} className="mt-2 w-full">
            Enviar enlace
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
