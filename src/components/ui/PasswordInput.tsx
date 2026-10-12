"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";
import { Input, type InputProps } from "./Input";

/**
 * Password field with a show/hide toggle. Hidden by default; toggling only swaps the input type,
 * so the typed value, focus order and form validation stay untouched.
 */
export function PasswordInput({ disabled, ...props }: Omit<InputProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  const action = visible ? "Ocultar contraseña" : "Mostrar contraseña";

  return (
    <Input
      {...props}
      disabled={disabled}
      type={visible ? "text" : "password"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          disabled={disabled}
          aria-label={action}
          aria-pressed={visible}
          title={action}
          className="flex size-9 cursor-pointer items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50 sm:size-8"
        >
          {visible ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
        </button>
      }
    />
  );
}
