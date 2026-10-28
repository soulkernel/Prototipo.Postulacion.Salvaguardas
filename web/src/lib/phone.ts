import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";
export function normalizePhone(
  value: string,
  country: CountryCode = "EC",
): string | null {
  if (!value.trim() || value.length > 32 || !/^[+\d\s()-]+$/.test(value))
    return null;
  const phone = parsePhoneNumberFromString(value, {
    defaultCountry: country,
    extract: false,
  });
  return phone?.isValid() && phone.number.length <= 16 ? phone.number : null;
}
