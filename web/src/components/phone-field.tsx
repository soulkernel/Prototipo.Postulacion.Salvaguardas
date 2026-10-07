"use client";
import { useId, useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";
import { normalizePhone } from "@/lib/phone";
import type { Locale } from "@/lib/domain";
export function PhoneField({
  value,
  onChange,
  locale,
}: {
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
}) {
  const parsed = parsePhoneNumberFromString(value, "EC");
  const [country, setCountry] = useState<CountryCode>(parsed?.country || "EC");
  const [number, setNumber] = useState(
    parsed?.nationalNumber.toString() || value,
  );
  const id = useId();
  const es = locale === "es";
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return getCountries()
      .map((code) => ({ code, label: names.of(code) || code }))
      .sort((a, b) =>
        a.code === "EC"
          ? -1
          : b.code === "EC"
            ? 1
            : a.label.localeCompare(b.label, locale),
      );
  }, [locale]);
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
  return (
    <fieldset className="activity-card">
      <legend>{es ? "Teléfono de contacto" : "Contact phone"}</legend>
      <div className="live-grid">
        <label>
          {es ? "País y código" : "Country and code"}
          <select
            value={country}
            autoComplete="tel-country-code"
            onChange={(e) => update(e.target.value as CountryCode, number)}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} (+{getCountryCallingCode(c.code)})
              </option>
            ))}
          </select>
        </label>
        <label>
          {es ? "Número celular o convencional" : "Mobile or landline number"}
          <input
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
            placeholder={
              country === "EC" ? "0991234567 / 052526000" : undefined
            }
          />
        </label>
      </div>
      <small id={id} role={!valid ? "alert" : undefined}>
        {!valid
          ? es
            ? "Revise el número y su longitud para el país seleccionado."
            : "Check the number and its length for the selected country."
          : es
            ? "Ingrese el número sin repetir el código de país. Se admiten celulares y teléfonos convencionales."
            : "Enter the number without repeating the country code. Mobile and landline numbers are accepted."}
      </small>
    </fieldset>
  );
}
