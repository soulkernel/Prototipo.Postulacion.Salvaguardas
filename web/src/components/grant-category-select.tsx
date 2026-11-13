import { grantCategoryAllowed, type Rules, type Locale } from "@/lib/domain";

export function GrantCategorySelect({
  applicantType,
  value,
  rules,
  locale,
  onChange,
}: {
  applicantType: string;
  value: string;
  rules: Pick<Rules, "categories">;
  locale: Locale;
  onChange: (value: string) => void;
}) {
  const es = locale === "es";
  const individual = applicantType === "individual";
  const incompatible =
    Boolean(value) && !grantCategoryAllowed(applicantType, value);
  return (
    <>
      <select
        aria-required="true"
        aria-invalid={incompatible || undefined}
        aria-describedby={individual ? "individual-grant-guidance" : undefined}
        data-validation-field="category_id"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{es ? "Seleccione" : "Select"}</option>
        {rules.categories.map((c) => (
          <option
            key={c.id}
            value={c.id}
            disabled={!grantCategoryAllowed(applicantType, c.id)}
          >
            {es ? c.label_es : c.label_en} · USD{" "}
            {c.min_amount.toLocaleString(locale)}–
            {c.max_amount?.toLocaleString(locale) || "∞"}
          </option>
        ))}
      </select>
      {individual && (
        <small
          id="individual-grant-guidance"
          className={incompatible ? "field-warning" : undefined}
          role={incompatible ? "alert" : undefined}
        >
          {es
            ? "Las personas naturales solo pueden solicitar subvención pequeña, hasta USD 100.000."
            : "Individuals may only apply for a small grant, up to USD 100,000."}
          {incompatible &&
            (es
              ? " Este borrador conserva su categoría anterior. Seleccione pequeña y revise el monto antes de continuar."
              : " This draft retains its previous category. Select small and review the amount before continuing.")}
        </small>
      )}
    </>
  );
}
