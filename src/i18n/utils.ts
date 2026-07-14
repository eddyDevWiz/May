import { es } from './es';
import { en } from './en';
import type { Translations } from './es';

export const languages = { es: 'Español', en: 'English' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'es';

const dict: Record<Lang, Translations> = { es, en };

export function getLang(url: URL): Lang {
  const seg = url.pathname.split('/')[1];
  return (seg in languages ? seg : defaultLang) as Lang;
}

export function useTranslations(lang: Lang) {
  const t = dict[lang];
  return t;
}

// Returns the equivalent URL in the other language
export function switchLangUrl(url: URL, target: Lang): string {
  const parts = url.pathname.split('/').filter(Boolean);
  const hasLangPrefix = parts[0] in languages;

  if (target === defaultLang) {
    // Remove lang prefix → /en/shop → /shop
    const rest = hasLangPrefix ? parts.slice(1) : parts;
    return '/' + rest.join('/');
  } else {
    // Add lang prefix → /shop → /en/shop
    const rest = hasLangPrefix ? parts.slice(1) : parts;
    return `/${target}/${rest.join('/')}`;
  }
}
