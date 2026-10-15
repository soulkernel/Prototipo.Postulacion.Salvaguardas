import { z } from "zod";
import { callThemes } from "./grant-rules";

export type CallTheme = { id: string; label_es: string; label_en: string };
const normalized = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en");
const themeSchema = z
  .object({
    id: z
      .string()
      .max(50)
      .refine(
        (id) =>
          callThemes.some((t) => t.id === id) ||
          (id.startsWith("custom_") && z.uuid().safeParse(id.slice(7)).success),
      ),
    label_es: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[^\u0000-\u001f\u007f]+$/),
    label_en: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[^\u0000-\u001f\u007f]+$/),
  })
  .strict();
export const themeOptionsSchema = z
  .array(themeSchema)
  .max(50)
  .superRefine((rows, ctx) => {
    for (const key of ["id", "label_es", "label_en"] as const) {
      const values = rows.map((row) =>
        key === "id" ? row[key] : normalized(row[key]),
      );
      if (new Set(values).size !== rows.length)
        ctx.addIssue({ code: "custom", message: "Duplicate theme" });
    }
    for (const row of rows) {
      const builtin = callThemes.find((t) => t.id === row.id);
      if (
        builtin &&
        (builtin.label_es !== row.label_es || builtin.label_en !== row.label_en)
      )
        ctx.addIssue({ code: "custom", message: "Invalid standard theme" });
    }
  });

export function themeOptions(rules?: {
  themes?: CallTheme[];
  theme_options?: CallTheme[];
}): CallTheme[] {
  return [
    ...new Map(
      [
        ...callThemes,
        ...(rules?.theme_options ?? []),
        ...(rules?.themes ?? []),
      ].map((t) => [t.id, t]),
    ).values(),
  ];
}

export function parseCallThemes(raw: string, selected: string[]) {
  if (raw.length > 65000) throw new Error("Invalid themes");
  const options = themeOptionsSchema.parse(JSON.parse(raw));
  if (
    new Set(selected).size !== selected.length ||
    selected.some((id) => !options.some((t) => t.id === id))
  )
    throw new Error("Invalid selection");
  return {
    theme_options: options,
    themes: options.filter((t) => selected.includes(t.id)),
  };
}

export function callThemeLabel(
  value: string,
  rules: unknown,
  locale: "es" | "en",
) {
  if (!rules || typeof rules !== "object") return value;
  const themes = (rules as { themes?: unknown }).themes;
  if (!Array.isArray(themes)) return value;
  const theme = themes.find(
    (t) => t && typeof t === "object" && t.id === value,
  );
  const label = theme?.[locale === "es" ? "label_es" : "label_en"];
  return typeof label === "string" && label.trim() ? label : value;
}
