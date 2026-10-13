"use client";
import { useState, type TextareaHTMLAttributes } from "react";
export function LimitedTextarea({
  locale = "es",
  maxLength = 12000,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { locale?: "es" | "en" }) {
  const [count, setCount] = useState(String(props.defaultValue || "").length);
  const length = props.value === undefined ? count : String(props.value).length;
  return (
    <>
      <textarea
        {...props}
        maxLength={maxLength}
        spellCheck={props.spellCheck ?? true}
        lang={props.lang || locale}
        onChange={(e) => {
          setCount(e.target.value.length);
          props.onChange?.(e);
        }}
      />
      {maxLength !== undefined && (
        <small className="text-limit">
          {length.toLocaleString(locale)} / {maxLength.toLocaleString(locale)}{" "}
          {locale === "es" ? "caracteres" : "characters"}
        </small>
      )}
    </>
  );
}
