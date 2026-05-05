/**
 * locale.js — Central country/region configuration
 *
 * Provides currency symbols, measurement units, phone prefixes,
 * postal-code formats, and tax-ID labels for every supported market.
 */

export const COUNTRY_CONFIG = {
  IN: {
    name: 'India',
    flag: '🇮🇳',
    currency: '₹',
    currencyCode: 'INR',
    unit: 'sq ft',
    phonePrefix: '+91',
    postalRegex: /^\d{6}$/,
    postalLabel: 'PIN Code',
    postalPlaceholder: 'e.g. 400001',
    taxLabel: 'GST / PAN',
    locale: 'en-IN',
    phone: '+919167714513',
    email: 'link2logistics001@gmail.com',
  },
  US: {
    name: 'United States',
    flag: '🇺🇸',
    currency: '$',
    currencyCode: 'USD',
    unit: 'sq ft',
    phonePrefix: '+1',
    postalRegex: /^\d{5}(-\d{4})?$/,
    postalLabel: 'ZIP Code',
    postalPlaceholder: 'e.g. 90210',
    taxLabel: 'EIN / Tax ID',
    locale: 'en-US',
    phone: '+919167714513',
    email: 'link2logistics001@gmail.com',
  },
  AE: {
    name: 'UAE',
    flag: '🇦🇪',
    currency: 'AED',
    currencyCode: 'AED',
    unit: 'sq m',
    phonePrefix: '+971',
    postalRegex: /^.{2,10}$/,
    postalLabel: 'P.O. Box',
    postalPlaceholder: 'e.g. 12345',
    taxLabel: 'TRN (Tax Reg No.)',
    locale: 'en-AE',
    phone: '+919167714513',
    email: 'link2logistics001@gmail.com',
  },
  GB: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: '£',
    currencyCode: 'GBP',
    unit: 'sq ft',
    phonePrefix: '+44',
    postalRegex: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
    postalLabel: 'Postcode',
    postalPlaceholder: 'e.g. SW1A 1AA',
    taxLabel: 'VAT Number',
    locale: 'en-GB',
    phone: '+919167714513',
    email: 'link2logistics001@gmail.com',
  },
  DE: {
    name: 'Germany',
    flag: '🇩🇪',
    currency: '€',
    currencyCode: 'EUR',
    unit: 'sq m',
    phonePrefix: '+49',
    postalRegex: /^\d{5}$/,
    postalLabel: 'PLZ',
    postalPlaceholder: 'e.g. 10115',
    taxLabel: 'USt-IdNr. (VAT)',
    locale: 'de-DE',
    phone: '+919167714513',
    email: 'link2logistics001@gmail.com',
  },
  SG: {
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'S$',
    currencyCode: 'SGD',
    unit: 'sq ft',
    phonePrefix: '+65',
    postalRegex: /^\d{6}$/,
    postalLabel: 'Postal Code',
    postalPlaceholder: 'e.g. 018956',
    taxLabel: 'GST Reg No.',
    locale: 'en-SG',
    phone: '+919167714513',
    email: 'link2logistics001@gmail.com',
  },
  SA: {
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    currencyCode: 'SAR',
    unit: 'sq m',
    phonePrefix: '+966',
    postalRegex: /^\d{5}(-\d{4})?$/,
    postalLabel: 'Postal Code',
    postalPlaceholder: 'e.g. 11564',
    taxLabel: 'VAT / CR Number',
    locale: 'en-SA',
    phone: '+919167714513',
    email: 'link2logistics001@gmail.com',
  },
};

export const DEFAULT_COUNTRY = 'IN';
export const SUPPORTED_COUNTRIES = Object.keys(COUNTRY_CONFIG);

/**
 * Get configuration for a specific country code
 */
export function getCountryConfig(code = DEFAULT_COUNTRY) {
  return COUNTRY_CONFIG[code] || COUNTRY_CONFIG[DEFAULT_COUNTRY];
}

/**
 * Format a numeric value as a localized price string
 */
export function formatPrice(amount, countryCode = DEFAULT_COUNTRY) {
  const cfg = getCountryConfig(countryCode);
  if (amount == null || isNaN(amount)) return `${cfg.currency}0`;
  return `${cfg.currency}${Number(amount).toLocaleString(cfg.locale)}`;
}

/**
 * Format an area value with the correct unit
 */
export function formatArea(value, countryCode = DEFAULT_COUNTRY) {
  const cfg = getCountryConfig(countryCode);
  if (!value) return '—';
  return `${Number(value).toLocaleString(cfg.locale)} ${cfg.unit}`;
}
