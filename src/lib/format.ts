export const REFERENCE_RATES = {
  USD: 1,
  INR: 95.43,
  EUR: 0.8645,
  GBP: 0.7387,
  AED: 3.6725,
} as const;

export type DisplayCurrency = keyof typeof REFERENCE_RATES;

export const DEFAULT_CURRENCY: DisplayCurrency = 'INR';
export const REFERENCE_RATE_DATE = '14 Aug 2026';

export function baseToDisplayAmount(value: number, currency: DisplayCurrency = DEFAULT_CURRENCY): number {
  return value * REFERENCE_RATES[currency];
}

export function displayToBaseAmount(value: number, currency: DisplayCurrency = DEFAULT_CURRENCY): number {
  return value / REFERENCE_RATES[currency];
}

export function formatCurrencyAmount(value: number, currency: DisplayCurrency, locale = currency === 'INR' ? 'en-IN' : 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  }).format(value);
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions, locale = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`) : value);
}

export function formatMoney(value: number, locale = 'en-IN'): string {
  return formatCurrencyAmount(baseToDisplayAmount(value), DEFAULT_CURRENCY, locale);
}

export function pluralize(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? '' : 's'}`;
}
