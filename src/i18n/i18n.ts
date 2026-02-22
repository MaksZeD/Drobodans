import type { Locale, Translation } from '../types/index.js';
import { ua } from './locales/ua.js';
import { en } from './locales/en.js';

const locales: Record<Locale, Translation> = { ua, en };

type ChangeCallback = (locale: Locale) => void;

let currentLocale: Locale = 'ua';
const changeListeners: ChangeCallback[] = [];

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  changeListeners.forEach((cb) => cb(locale));
}

export function getLocale(): Locale {
  return currentLocale;
}

export function toggleLocale(): void {
  setLocale(currentLocale === 'ua' ? 'en' : 'ua');
}

export function t(path: string): string {
  const keys = path.split('.');
  let result: unknown = locales[currentLocale];
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof result === 'string' ? result : path;
}

export function getTranslation(): Translation {
  return locales[currentLocale];
}

export function onChange(cb: ChangeCallback): void {
  changeListeners.push(cb);
}
