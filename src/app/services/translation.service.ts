import { ApplicationRef, Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { INITIAL_LANGUAGE, VALID_LANGUAGES } from '../tokens/language.token';

export type Language = string;

export interface LanguageOption {
  code: Language;
  label: string;
}

const COOKIE_NAME = 'lang';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly DEFAULT_LANGUAGE: Language = 'sq';

  private currentLanguageSubject: BehaviorSubject<Language>;
  public currentLanguage$: Observable<Language>;

  private translations: { [key: string]: string } = {};
  private cache: { [lang: string]: { [key: string]: string } } = {};

  readonly availableLanguages: LanguageOption[] = [
    { code: 'sq', label: 'Shqip' },
    { code: 'en', label: 'English' },
  ];

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
    private appRef: ApplicationRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(INITIAL_LANGUAGE) initialLanguage: Language,
  ) {
    this.currentLanguageSubject = new BehaviorSubject<Language>(initialLanguage);
    this.currentLanguage$ = this.currentLanguageSubject.asObservable();
  }

  /** Called by APP_INITIALIZER — resolves only when translations are fully loaded. */
  init(): Promise<void> {
    return firstValueFrom(this.loadLanguage(this.currentLanguageSubject.value)).then(() => {
      this.applyLanguage();
    });
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  setLanguage(language: Language): void {
    this.loadLanguage(language).subscribe(() => {
      this.ngZone.run(() => {
        Promise.resolve().then(() => {
          this.currentLanguageSubject.next(language);
          this.saveToCookie(language);
          this.applyLanguage();
        });
      });
    });
  }

  translate(key: string): string {
    return this.translations[key] ?? key;
  }

  translateAsync(key: string): Observable<string> {
    return new Observable(observer => {
      const sub = this.currentLanguage$.subscribe(() => {
        observer.next(this.translate(key));
      });
      return () => sub.unsubscribe();
    });
  }

  private loadLanguage(lang: Language): Observable<{ [key: string]: string }> {
    if (this.cache[lang]) {
      this.translations = this.cache[lang];
      return of(this.cache[lang]);
    }

    return this.http.get<{ [key: string]: string }>(`/assets/i18n/${lang}.json`).pipe(
      tap(data => {
        this.cache[lang] = data;
        this.translations = data;
      }),
      catchError(() => {
        console.warn(`Translation file for '${lang}' not found, falling back to '${this.DEFAULT_LANGUAGE}'.`);
        const fallback = this.cache[this.DEFAULT_LANGUAGE] ?? {};
        this.translations = fallback;
        return of(fallback);
      })
    );
  }

  private saveToCookie(language: Language): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(language)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }

  private applyLanguage(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', this.currentLanguageSubject.value);
    }
  }
}
