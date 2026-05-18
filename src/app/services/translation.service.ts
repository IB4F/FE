import { ApplicationRef, Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export type Language = string;

export interface LanguageOption {
  code: Language;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'preferredLanguage';
  private readonly DEFAULT_LANGUAGE: Language = 'sq';

  private currentLanguageSubject = new BehaviorSubject<Language>(this.loadFromStorage());
  public currentLanguage$: Observable<Language> = this.currentLanguageSubject.asObservable();

  private translations: { [key: string]: string } = {};
  private cache: { [lang: string]: { [key: string]: string } } = {};

  readonly availableLanguages: LanguageOption[] = [
    { code: 'sq', label: 'Shqip' },
    { code: 'en', label: 'English' },
  ];

  constructor(private http: HttpClient, private ngZone: NgZone, private appRef: ApplicationRef) {
    this.loadLanguage(this.currentLanguageSubject.value).subscribe();
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  setLanguage(language: Language): void {
    this.loadLanguage(language).subscribe(() => {
      this.ngZone.run(() => {
        Promise.resolve().then(() => {
          this.currentLanguageSubject.next(language);
          this.saveToStorage(language);
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

  private loadFromStorage(): Language {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.STORAGE_KEY) ?? this.DEFAULT_LANGUAGE;
    }
    return this.DEFAULT_LANGUAGE;
  }

  private saveToStorage(language: Language): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, language);
    }
  }

  private applyLanguage(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', this.currentLanguageSubject.value);
    }
  }
}