"use client";
import { useId } from "react";
import {
  cities,
  islands,
  provinces,
  organizationProvince,
  organizationProvinceIssue,
  provinceAddressPatch,
  cityMatchesProvince,
} from "@/lib/geography";
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
  const id = useId();
  const label = (text: string) => (
    <span className="field-label">
      {text}
      <RequiredMark locale={locale} />
    </span>
  );
  if (mode === "address") {
    const organization = c.applicant_type === "organization";
    const incompatibleProvince = organizationProvinceIssue(c);
    const options = cities[c.province] || [];
    const custom = Boolean(c.city && !options.includes(c.city));
    return (
      <section role="group" className="activity-card full-width">
        <h3 className="section-card-title application-section-title">
          {es ? "Domicilio del proponente" : "Applicant address"}
        </h3>
        <div className="live-grid applicant-address-fields">
          <label>
            {label(es ? "Provincia" : "Province")}
            <select
              data-validation-field="province"
              aria-required="true"
              disabled={organization && !incompatibleProvince}
              aria-invalid={incompatibleProvince || undefined}
              aria-describedby={
                organization ? "organization-province-help" : undefined
              }
              value={c.province}
              onChange={(e) =>
                onChange(provinceAddressPatch(c, e.target.value))
              }
            >
              {(!organization || incompatibleProvince) && (
                <option value="">{es ? "Seleccione" : "Select"}</option>
              )}
              {incompatibleProvince && c.province && (
                <option value={c.province} disabled>
                  {c.province} ·{" "}
                  {es
                    ? "valor anterior, requiere corrección"
                    : "previous value, correction required"}
                </option>
              )}
              {(organization ? [organizationProvince] : provinces).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            {organization && (
              <small
                id="organization-province-help"
                className={incompatibleProvince ? "field-warning" : undefined}
                role={incompatibleProvince ? "alert" : undefined}
              >
                {incompatibleProvince
                  ? es
                    ? "Este borrador conserva una provincia incompatible. Seleccione Galápagos y revise la ciudad o localidad para poder guardar."
                    : "This draft retains an incompatible province. Select Galápagos and review the city or locality before saving."
                  : es
                    ? "Las organizaciones deben tener domicilio en Galápagos."
                    : "Organizations must be based in Galápagos."}
              </small>
            )}
          </label>
          <label>
            {label(es ? "Ciudad o localidad" : "City or locality")}
            <select
              aria-required="true"
              data-validation-field={custom ? undefined : "city"}
              disabled={!c.province || incompatibleProvince}
              aria-invalid={
                (Boolean(c.city.trim()) &&
                  !cityMatchesProvince(c.city, c.province)) ||
                undefined
              }
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
            {c.province && !c.city.trim() && (
              <small>
                {es
                  ? "Seleccione nuevamente la ciudad o localidad de la provincia indicada."
                  : "Select the city or locality for the indicated province."}
              </small>
            )}
          </label>
          {custom && (
            <label>
              {label(
                es
                  ? "Indique la ciudad o localidad"
                  : "Specify city or locality",
              )}
              <input
                data-validation-field="city"
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
              data-validation-field="address"
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
      </section>
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
    <section
      role="group"
      className="activity-card full-width"
      data-validation-field="project_islands"
    >
      <h3 className="section-card-title application-section-title">
        {label(
          es
            ? "Ubicación y área de influencia"
            : "Location and area of influence",
        )}
      </h3>
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
      <div className="project-location-fields">
        {c.project_islands.includes("Otras islas") && (
          <div className="project-location-field">
            <label htmlFor={`${id}-other-islands`}>
              {label(es ? "Indique las otras islas" : "Specify other islands")}
            </label>
            <small id={`${id}-other-islands-help`}>
              {es
                ? "Escriba los nombres de las islas o islotes adicionales donde se ejecutará el proyecto."
                : "Enter the names of any additional islands or islets where the project will take place."}
            </small>
            <input
              id={`${id}-other-islands`}
              data-validation-field="other_islands"
              aria-required="true"
              aria-describedby={`${id}-other-islands-help`}
              maxLength={12000}
              value={c.other_islands}
              onChange={(e) => onChange({ other_islands: e.target.value })}
            />
          </div>
        )}
        <div className="project-location-field">
          <label htmlFor={`${id}-location`}>
            {label(
              es
                ? "Ubicación específica y ámbito del proyecto"
                : "Specific project location and scope",
            )}
          </label>
          <small id={`${id}-location-help`}>
            {es
              ? "Describa los sitios concretos de intervención y el área que abarcará el proyecto."
              : "Describe the specific intervention sites and the area the project will cover."}
          </small>
          <textarea
            id={`${id}-location`}
            placeholder={
              es
                ? "Describa los sitios de intervención y el área que abarcará el proyecto."
                : "Describe the intervention sites and the area the project will cover."
            }
            data-validation-field="location"
            aria-required="true"
            aria-describedby={`${id}-location-help`}
            rows={3}
            maxLength={12000}
            value={c.location}
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </div>
      </div>
    </section>
  );
}
