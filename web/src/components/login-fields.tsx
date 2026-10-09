"use client";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/domain";

export function LoginFields({
  locale,
  lastEmail,
}: {
  locale: Locale;
  lastEmail: string;
}) {
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("glf_last_login_email") || "null",
      );
      if (
        !lastEmail &&
        saved &&
        saved.expires > Date.now() &&
        typeof saved.email === "string" &&
        saved.email.length <= 254 &&
        email.current
      )
        email.current.value = saved.email;
    } catch {
      /* Storage may be unavailable on private/shared browsers. */
    }
    const clearPassword = () => {
      if (password.current) {
        password.current.value = "";
        password.current.readOnly = true;
      }
    };
    clearPassword();
    window.addEventListener("pageshow", clearPassword);
    const form = email.current?.form;
    const rememberEmail = () => {
      if (!email.current?.validity.valid || !email.current.value) return;
      try {
        localStorage.setItem(
          "glf_last_login_email",
          JSON.stringify({
            email: email.current.value.trim(),
            expires: Date.now() + 90 * 86400000,
          }),
        );
      } catch {
        /* Login must remain usable without local storage. */
      }
    };
    form?.addEventListener("submit", rememberEmail);
    return () => {
      window.removeEventListener("pageshow", clearPassword);
      form?.removeEventListener("submit", rememberEmail);
    };
  }, [lastEmail]);
  return (
    <>
      <label>
        {locale === "es" ? "Correo electrónico" : "Email"}
        <input
          ref={email}
          type="email"
          name="email"
          autoComplete="off"
          defaultValue={lastEmail}
          required
          maxLength={254}
        />
      </label>
      <label>
        {locale === "es" ? "Contraseña" : "Password"}
        <input
          ref={password}
          type="password"
          name="password"
          autoComplete="off"
          defaultValue=""
          readOnly
          required
          maxLength={128}
          onFocus={(event) => {
            if (event.currentTarget.readOnly) {
              event.currentTarget.value = "";
              event.currentTarget.readOnly = false;
            }
          }}
        />
      </label>
    </>
  );
}
