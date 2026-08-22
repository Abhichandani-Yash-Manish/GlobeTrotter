export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`) : value);
}

export function formatMoney(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function pluralize(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? '' : 's'}`;
}
