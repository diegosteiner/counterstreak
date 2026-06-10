import { browser } from '$app/environment';
import i18next from 'i18next';
import en from './locales/en.json';
import de from './locales/de.json';

export const SUPPORTED_LOCALES = ['en', 'de'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const FALLBACK: Locale = 'en';

function isLocale(value: string): value is Locale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Browser language (e.g. `de-CH` → `de`) if supported, else the fallback. */
function detectLocale(): Locale {
	if (!browser) return FALLBACK;
	const lang = navigator.language?.split('-')[0] ?? '';
	return isLocale(lang) ? lang : FALLBACK;
}

i18next.init({
	lng: detectLocale(),
	fallbackLng: FALLBACK,
	resources: {
		en: { translation: en },
		de: { translation: de }
	},
	interpolation: { escapeValue: false }
});

// Reactive mirror of the active locale: every `t()` reads it, so changing the
// locale re-runs all translations across the app.
let locale = $state<Locale>(i18next.language as Locale);

/** Translate `key`, optionally interpolating `values` (and `count` for plurals). */
export function t(key: string, values?: Record<string, unknown>): string {
	void locale; // establish the reactive dependency
	return i18next.t(key, values);
}

export function getLocale(): Locale {
	return locale;
}

export function setLocale(next: Locale): void {
	i18next.changeLanguage(next);
	locale = next;
}
