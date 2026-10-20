import {
  financialErrors,
  type Concept,
  type Rules,
  type Locale,
} from "./domain";
import { inspectMoneyEntry, moneyEntryError } from "./money-input";

export const moneyFields = [
  "requested_amount",
  "cofinance_amount",
  "admin_cost",
] as const;
export type MoneyField = (typeof moneyFields)[number];
export const isMoneyField = (key: string): key is MoneyField =>
  (moneyFields as readonly string[]).includes(key);

// Presentation timing never changes the values or the submission validators.
export function financialFeedback(
  c: Concept,
  rules: Rules,
  locale: Locale,
  touched: Partial<Record<MoneyField, boolean>>,
  focused: MoneyField | null,
  attempted: boolean,
  stage = 2,
  inputText: Partial<Record<MoneyField, string>> = {},
) {
  const es = locale === "es";
  const currency = (amount: number) =>
    amount.toLocaleString(locale, { style: "currency", currency: "USD" });
  const configuredCategory = rules.categories.find(
    (x) => x.id === c.category_id,
  );
  const category =
    configuredCategory &&
    c.applicant_type === "individual" &&
    c.category_id === "small"
      ? {
          ...configuredCategory,
          max_amount: Math.min(configuredCategory.max_amount ?? 100000, 100000),
        }
      : configuredCategory;
  const errors = financialErrors(c, rules, stage);
  const requestedEntry =
    inputText.requested_amount === undefined
      ? undefined
      : inspectMoneyEntry(inputText.requested_amount);
  const requested =
    c.requested_amount !== null &&
    c.requested_amount > 0 &&
    (requestedEntry === undefined ||
      (requestedEntry.kind === "amount" && requestedEntry.supported));
  const categoryName = category
    ? es
      ? category.label_es
      : category.label_en
    : "";
  const hints = {
    requested_amount: category
      ? (es ? "Monto permitido: " : "Allowed amount: ") +
        (category.min_amount === 0
          ? es
            ? "mayor que cero"
            : "greater than zero"
          : currency(category.min_amount)) +
        (category.max_amount !== null
          ? " – " + currency(category.max_amount)
          : es
            ? " en adelante"
            : " and above")
      : es
        ? "Seleccione una categoría para consultar el rango permitido."
        : "Select a category to see the allowed range.",
    cofinance_amount: category
      ? category.cofinance_percent === 0
        ? es
          ? "Esta categoría no exige cofinanciamiento. Si no contempla aportes adicionales, ingrese 0."
          : "This category does not require cofinancing. If no additional contributions are planned, enter 0."
        : requested
          ? (es ? "Cofinanciamiento mínimo: " : "Minimum cofinancing: ") +
            currency((c.requested_amount! * category.cofinance_percent) / 100) +
            ` (${category.cofinance_percent}% ` +
            (es
              ? "del monto solicitado al GLF)."
              : "of requested GLF funding).")
          : (es ? "Cofinanciamiento mínimo: " : "Minimum cofinancing: ") +
            category.cofinance_percent +
            (es
              ? "% del monto solicitado al GLF."
              : "% of requested GLF funding.")
      : es
        ? "Seleccione una categoría para consultar el cofinanciamiento requerido."
        : "Select a category to see the cofinancing requirement.",
    admin_cost:
      (es ? "Máximo: " : "Maximum: ") +
      (requested && c.cofinance_amount !== null
        ? currency(
            ((c.requested_amount! + c.cofinance_amount) *
              rules.max_admin_percent) /
              100,
          ) +
          " (" +
          rules.max_admin_percent +
          (es ? "% del costo total)." : "% of total cost).")
        : rules.max_admin_percent +
          (es
            ? "% del costo total (monto GLF + cofinanciamiento)."
            : "% of total cost (GLF funding + cofinancing).")),
  };
  return Object.fromEntries(
    moneyFields.map((key) => {
      if (stage === 1 && key === "admin_cost")
        return [key, { invalid: false, text: "" }];
      const eligible = attempted || (focused !== key && Boolean(touched[key]));
      const raw = inputText[key];
      const entry = raw === undefined ? undefined : inspectMoneyEntry(raw);
      const amount =
        entry === undefined
          ? c[key]
          : entry.kind === "amount"
            ? entry.value
            : null;
      // The grant maximum takes precedence even when raw digits exceed numeric storage capacity.
      if (
        key === "requested_amount" &&
        category?.max_amount !== null &&
        category &&
        amount !== null &&
        amount > category.max_amount &&
        (entry?.kind === "amount" || eligible)
      ) {
        return [
          key,
          {
            invalid: true,
            text: es
              ? `El monto solicitado supera el máximo de ${currency(category.max_amount)} de la categoría de subvención ${categoryName} seleccionada por usted. Corrija el monto para continuar.`
              : `The requested amount exceeds the maximum of ${currency(category.max_amount)} for the ${categoryName} grant category you selected. Correct the amount to continue.`,
          },
        ];
      }
      if (
        entry?.kind === "format" ||
        (entry?.kind === "amount" && !entry.supported)
      )
        return [key, { invalid: true, text: moneyEntryError(locale, raw) }];
      const missing = c[key] === null;
      const invalid = eligible && (missing || Boolean(errors[key]));
      let text = hints[key];
      if (invalid) {
        if (
          missing &&
          key === "cofinance_amount" &&
          category?.cofinance_percent === 0
        )
          text = es
            ? "Indique el aporte previsto o ingrese 0 si no habrá cofinanciamiento."
            : "Enter the planned contribution or enter 0 if there will be no cofinancing.";
        else if (missing)
          text =
            (es
              ? "Complete este campo obligatorio. "
              : "Complete this required field. ") + hints[key];
        else if (key === "requested_amount")
          text =
            (es
              ? `El monto solicitado no corresponde a la categoría de subvención ${categoryName} seleccionada por usted. `
              : `The requested amount is outside the ${categoryName} grant category you selected. `) +
            hints[key];
        else if (key === "cofinance_amount" && requested)
          text =
            (es
              ? "El cofinanciamiento es inferior al mínimo exigido. "
              : "Cofinancing is below the required minimum. ") + hints[key];
      }
      return [
        key,
        {
          invalid:
            key === "cofinance_amount" && !requested && !missing
              ? false
              : invalid,
          text,
        },
      ];
    }),
  ) as Record<MoneyField, { invalid: boolean; text: string }>;
}
