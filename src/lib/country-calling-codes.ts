import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode
} from 'libphonenumber-js';

export type CountryCallingCodeOption = {
  code: CountryCode;
  dialCode: string;
  name: string;
  flag: string;
};

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'AE';

export function countryCodeToFlagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  const first = code.codePointAt(0);
  const second = code.codePointAt(1);
  if (first === undefined || second === undefined) return '🏳️';
  return String.fromCodePoint(127397 + first, 127397 + second);
}

export function getCountryCallingCodeOptions(
  locale = 'en'
): CountryCallingCodeOption[] {
  const displayNames = new Intl.DisplayNames([locale], { type: 'region' });

  return getCountries()
    .map((code) => {
      const dialCode = `+${getCountryCallingCode(code)}`;
      return {
        code,
        dialCode,
        name: displayNames.of(code) ?? code,
        flag: countryCodeToFlagEmoji(code)
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export function getCountryOption(
  country: CountryCode,
  locale = 'en'
): CountryCallingCodeOption {
  const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
  return {
    code: country,
    dialCode: `+${getCountryCallingCode(country)}`,
    name: displayNames.of(country) ?? country,
    flag: countryCodeToFlagEmoji(country)
  };
}

/** Build an E.164-ish phone from country + national digits. */
export function formatPhoneE164(
  country: CountryCode,
  nationalNumber: string
): string | null {
  const digits = nationalNumber.replace(/\D/g, '');
  if (!digits) return null;

  const parsed = parsePhoneNumberFromString(digits, country);
  if (parsed) {
    return parsed.format('E.164');
  }

  const callingCode = getCountryCallingCode(country);
  const national = digits.replace(/^0+/, '');
  if (!national) return null;
  return `+${callingCode}${national}`;
}

export function parsePrefillPhone(value: string | null | undefined): {
  country: CountryCode;
  nationalNumber: string;
} | null {
  if (!value?.trim()) return null;

  const parsed = parsePhoneNumberFromString(value.trim());
  if (parsed?.country) {
    return {
      country: parsed.country,
      nationalNumber: String(parsed.nationalNumber)
    };
  }

  return {
    country: DEFAULT_PHONE_COUNTRY,
    nationalNumber: value.replace(/\D/g, '')
  };
}
