"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
    <Card>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Recuperar contraseña</h1>
        <p className="text-sm text-stone-600">
          Te enviaremos un enlace para crear una contraseña nueva.
        </p>
      </div>

      {state === "sent" ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          Si el correo está registrado, recibirás un enlace en unos minutos. Revisa también la carpeta
          de spam.
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {state === "error" && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}
          <Input
            label="Correo institucional"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldError}
            disabled={state === "loading"}
          />
          <Button type="submit" loading={state === "loading"} className="w-full">
            Enviar enlace
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
