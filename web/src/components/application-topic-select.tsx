"use client";

import { useId } from "react";
import {
  applicationTopicIssue,
  applicationTopicMessage,
  type CallTheme,
} from "@/lib/call-themes";

export function ApplicationTopicSelect({
  value,
  themes,
  locale,
  invalid,
  onChange,
}: {
  value: string;
  themes?: CallTheme[];
  locale: "es" | "en";
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const helpId = useId();
  const issue = applicationTopicIssue(value, { themes });
  const previous = Boolean(value && issue);
  const showIssue = issue && (previous || invalid || !themes?.length);
  return (
    <>
      <select
        value={value}
        disabled={!themes?.length}
        aria-required="true"
        aria-invalid={Boolean(themes?.length && (invalid || previous))}
        aria-describedby={showIssue ? helpId : undefined}
        onChange={(event) => {
          const next = event.target.value;
          if (themes?.some((theme) => theme.id === next)) onChange(next);
        }}
      >
        <option value="" disabled>
          {!themes?.length
            ? locale === "es"
              ? "Temas pendientes de configuración"
              : "Topics pending configuration"
            : locale === "es"
              ? "Seleccione un tema de aplicación"
              : "Select an application topic"}
        </option>
        {previous && (
          <option value={value} disabled>
            {value} {locale === "es" ? "(valor anterior)" : "(previous value)"}
          </option>
        )}
        {themes?.map((theme) => (
          <option value={theme.id} key={theme.id}>
            {locale === "es" ? theme.label_es : theme.label_en}
          </option>
        ))}
      </select>
      {showIssue && (
        <small
          id={helpId}
          className={themes?.length ? "field-warning" : undefined}
          data-field-message={themes?.length ? "error" : undefined}
        >
          {applicationTopicMessage(issue, locale)}
        </small>
      )}
    </>
  );
}
