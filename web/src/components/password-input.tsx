"use client";
import { useState, type ComponentProps, type Ref } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordInput({
  locale,
  inputRef,
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  locale: "es" | "en";
  inputRef?: Ref<HTMLInputElement>;
}) {
  const [visible, setVisible] = useState(false);
  const label =
    locale === "es"
      ? visible
        ? "Ocultar contraseña"
        : "Mostrar contraseña"
      : visible
        ? "Hide password"
        : "Show password";
  return (
    <span className="password-control">
      <input {...props} ref={inputRef} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-toggle"
        aria-label={label}
        aria-pressed={visible}
        title={label}
        onClick={() => setVisible(!visible)}
      >
        {visible ? (
          <EyeOff size={20} aria-hidden="true" />
        ) : (
          <Eye size={20} aria-hidden="true" />
        )}
      </button>
    </span>
  );
}
