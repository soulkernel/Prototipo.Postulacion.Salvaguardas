"use client";
import { useId, useState, type TextareaHTMLAttributes } from "react";
import { TextLimitCounter } from "./text-limit-counter";
export function LimitedTextarea({
  locale = "es",
  maxLength = 12000,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { locale?: "es" | "en" }) {
  const [count, setCount] = useState(String(props.defaultValue || "").length);
  const length = props.value === undefined ? count : String(props.value).length;
  const countId = `${useId()}-count`;
  return (
    <>
      <textarea
        {...props}
        maxLength={maxLength}
        aria-describedby={[props["aria-describedby"], countId]
          .filter(Boolean)
          .join(" ")}
        spellCheck={props.spellCheck ?? true}
        lang={props.lang || locale}
        onChange={(e) => {
          setCount(e.target.value.length);
          props.onChange?.(e);
        }}
      />
      {maxLength !== undefined && (
        <TextLimitCounter
          id={countId}
          count={length}
          limit={maxLength}
          locale={locale}
        />
      )}
    </>
  );
}
