"use client";
import { cities, islands, provinces } from "@/lib/geography";
import type { Concept, Locale } from "@/lib/domain";
import { RequiredMark } from "./required-mark";
export function GeographyFields({
  concept: c,
  locale,
  onChange,
  mode,
}: {
  concept: Concept;
  locale: Locale;
  onChange: (patch: Partial<Concept>) => void;
  mode: "address" | "project";
}) {
  const es = locale === "es";
  const label = (text: string) => (
    <>
      {text}
      <RequiredMark locale={locale} />
    </>
  );
  if (mode === "address") {
    const options = cities[c.province] || [];
    const custom = Boolean(c.city && !options.includes(c.city));
    return (
      <fieldset className="activity-card full-width">
        <legend>{es ? "Domicilio del proponente" : "Applicant address"}</legend>
        <div className="live-grid">
          <label>
            {label(es ? "Provincia" : "Province")}
            <select
              aria-required="true"
              value={c.province}
              onChange={(e) => onChange({ province: e.target.value, city: "" })}
            >
              <option value="">{es ? "Seleccione" : "Select"}</option>
              {provinces.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            {label(es ? "Ciudad o localidad" : "City or locality")}
            <select
              aria-required="true"
              disabled={!c.province}
              value={custom ? "__other" : c.city}
              onChange={(e) =>
                onChange({
                  city: e.target.value === "__other" ? " " : e.target.value,
                })
              }
            >
              <option value="">{es ? "Seleccione" : "Select"}</option>
              {options.map((p) => (
                <option key={p}>{p}</option>
              ))}
              <option value="__other">
                {es ? "Otra ciudad o localidad" : "Other city or locality"}
              </option>
            </select>
          </label>
          {custom && (
            <label>
              {label(
                es
                  ? "Indique la ciudad o localidad"
                  : "Specify city or locality",
              )}
              <input
                aria-required="true"
                value={c.city.trimStart()}
                maxLength={200}
                onChange={(e) => onChange({ city: e.target.value || " " })}
              />
            </label>
          )}
          <label className="full-width">
            {label(es ? "Dirección específica" : "Street address")}
            <input
              aria-required="true"
              value={c.address}
              maxLength={12000}
              placeholder={
                es
                  ? "Calle, número, barrio o referencia"
                  : "Street, number, neighborhood or reference"
              }
              onChange={(e) => onChange({ address: e.target.value })}
            />
          </label>
        </div>
      </fieldset>
    );
  }
  const toggle = (island: string, checked: boolean) => {
    const next = checked
      ? island === "Todo Galápagos"
        ? [island]
        : [...c.project_islands.filter((i) => i !== "Todo Galápagos"), island]
      : c.project_islands.filter((i) => i !== island);
    onChange({
      project_islands: next,
      other_islands: next.includes("Otras islas") ? c.other_islands : "",
    });
  };
  return (
    <fieldset className="activity-card full-width">
      <legend>
        {label(
          es
            ? "Islas de ejecución del proyecto"
            : "Project implementation islands",
        )}
      </legend>
      <p className="field-help">
        {es
          ? "Seleccione una o varias islas, o Todo Galápagos."
          : "Select one or more islands, or All Galápagos."}
      </p>
      <div className="live-grid">
        {islands.map((i) => (
          <label className="check-row" key={i}>
            <input
              type="checkbox"
              checked={c.project_islands.includes(i)}
              onChange={(e) => toggle(i, e.target.checked)}
            />
            {i === "Todo Galápagos"
              ? es
                ? i
                : "All Galápagos"
              : i === "Otras islas"
                ? es
                  ? i
                  : "Other islands"
                : i}
          </label>
        ))}
      </div>
      {c.project_islands.includes("Otras islas") && (
        <label>
          {label(es ? "Indique las otras islas" : "Specify other islands")}
          <input
            aria-required="true"
            maxLength={12000}
            value={c.other_islands}
            onChange={(e) => onChange({ other_islands: e.target.value })}
          />
        </label>
      )}
      <label>
        {label(
          es
            ? "Ubicación específica y ámbito del proyecto"
            : "Specific project location and scope",
        )}
        <textarea
          aria-required="true"
          rows={3}
          maxLength={12000}
          value={c.location}
          onChange={(e) => onChange({ location: e.target.value })}
        />
      </label>
    </fieldset>
  );
}
