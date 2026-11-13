"use client";
import { useId, useState } from "react";
import {
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";
import { normalizePhone } from "@/lib/phone";
import type { Locale } from "@/lib/domain";
import { RequiredMark } from "./required-mark";
import countryOptions from "@/lib/phone-country-options.json";
export function PhoneField({
  value,
  onChange,
  locale,
  inline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
  inline?: boolean;
}) {
  const parsed = parsePhoneNumberFromString(value, "EC");
  const [country, setCountry] = useState<CountryCode>(parsed?.country || "EC");
  const [number, setNumber] = useState(
    parsed?.nationalNumber.toString() || value,
  );
  const id = useId();
  const es = locale === "es";
  // A single catalogue avoids CLDR differences between Node and Chrome causing
  // React to discard the server-rendered form during hydration.
  const countries = countryOptions[locale];
  const valid = !number || Boolean(normalizePhone(number, country));
  const update = (nextCountry: CountryCode, nextNumber: string) => {
    setCountry(nextCountry);
    setNumber(nextNumber);
    const canonical = normalizePhone(nextNumber, nextCountry);
    onChange(
      nextNumber
        ? canonical || `+${getCountryCallingCode(nextCountry)} ${nextNumber}`
        : "",
    );
  };
  const controls = (
    <>
      <label className="editor-field">
        <span>
          {es ? "País y código" : "Country and code"}
          {inline && <RequiredMark locale={locale} />}
        </span>
        <select
          aria-required="true"
          value={country}
          autoComplete="tel-country-code"
          onChange={(e) => update(e.target.value as CountryCode, number)}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label} (+{getCountryCallingCode(c.code as CountryCode)})
            </option>
          ))}
        </select>
      </label>
      <label
        className="editor-field"
        data-validation-field={inline ? "phone" : undefined}
      >
        <span>
          {inline
            ? es
              ? "Teléfono de contacto"
              : "Contact phone"
            : es
              ? "Número celular o convencional"
              : "Mobile or landline number"}
          {inline && <RequiredMark locale={locale} />}
        </span>
        <input
          aria-required="true"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={number}
          maxLength={20}
          aria-invalid={!valid}
          aria-describedby={id}
          onChange={(e) =>
            update(country, e.target.value.replace(/[^\d\s()-]/g, ""))
          }
          placeholder={country === "EC" ? "0991234567 / 052526000" : undefined}
        />
      </label>
    </>
  );
  const help = (
    <small
      className={inline ? "contact-phone-help full-width" : undefined}
      id={id}
      role={!valid ? "alert" : undefined}
    >
      {!valid
        ? es
          ? "Revise el número y su longitud para el país seleccionado."
          : "Check the number and its length for the selected country."
        : es
          ? "Ingrese el número sin repetir el código de país. Se admiten celulares y teléfonos convencionales."
          : "Enter the number without repeating the country code. Mobile and landline numbers are accepted."}
    </small>
  );
  if (inline)
    return (
      <>
        {controls}
        {help}
      </>
    );
  return (
    <section
      role="group"
      className="activity-card"
      data-validation-field="phone"
    >
      <h3 className="section-card-title">
        {es ? "Teléfono de contacto" : "Contact phone"}
        <RequiredMark locale={locale} />
      </h3>
      <div className="live-grid">{controls}</div>
      {help}
    </section>
  );
}
