import {
  financialErrors,
  type Concept,
  type Rules,
  type Locale,
} from "./domain";

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
) {
  const es = locale === "es";
  const currency = (amount: number) =>
    amount.toLocaleString(locale, { style: "currency", currency: "USD" });
  const category = rules.categories.find((x) => x.id === c.category_id);
  const errors = financialErrors(c, rules);
  const requested = c.requested_amount !== null && c.requested_amount > 0;
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
          ? "Cofinanciamiento no obligatorio. Ingrese 0 si no contempla aportes adicionales."
          : "Cofinancing is optional. Enter 0 if no additional contributions are planned."
        : requested
          ? (es ? "Cofinanciamiento mínimo: " : "Minimum cofinancing: ") +
            currency((c.requested_amount! * category.cofinance_percent) / 100)
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
      const eligible = focused !== key && (attempted || Boolean(touched[key]));
      const missing = c[key] === null;
      const invalid = eligible && (missing || Boolean(errors[key]));
      return [
        key,
        {
          invalid,
          text:
            invalid && missing
              ? (es
                  ? "Complete este campo obligatorio. "
                  : "Complete this required field. ") + hints[key]
              : hints[key],
        },
      ];
    }),
  ) as Record<MoneyField, { invalid: boolean; text: string }>;
}
