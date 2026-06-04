import { InjectionToken } from '@angular/core';

export const INITIAL_LANGUAGE = new InjectionToken<string>('INITIAL_LANGUAGE');

export const VALID_LANGUAGES = ['sq', 'en'] as const;
export type AppLanguage = typeof VALID_LANGUAGES[number];

export function parseLangCookie(cookieHeader: string | undefined): AppLanguage {
  if (!cookieHeader) return 'sq';
  const match = cookieHeader.match(/(?:^|;\s*)lang=([^;]+)/);
  const val = match ? decodeURIComponent(match[1]) : 'sq';
  return (VALID_LANGUAGES as readonly string[]).includes(val) ? val as AppLanguage : 'sq';
}
