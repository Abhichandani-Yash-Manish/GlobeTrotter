export type AppLanguage = 'en' | 'hi' | 'gu';

export const languageLocale: Record<AppLanguage, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  gu: 'gu-IN',
};

export const primaryCopy = {
  en: { home: 'Home', trips: 'Trips', explore: 'Explore', settings: 'Settings', signOut: 'Sign out', nav: 'Application navigation' },
  hi: { home: 'होम', trips: 'यात्राएँ', explore: 'खोजें', settings: 'सेटिंग्स', signOut: 'साइन आउट', nav: 'ऐप नेविगेशन' },
  gu: { home: 'હોમ', trips: 'મુસાફરીઓ', explore: 'શોધો', settings: 'સેટિંગ્સ', signOut: 'સાઇન આઉટ', nav: 'એપ નેવિગેશન' },
} satisfies Record<AppLanguage, Record<string, string>>;

export function normalizeLanguage(value: string): AppLanguage {
  return value === 'hi' || value === 'gu' ? value : 'en';
}
