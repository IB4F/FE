import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'sq' | 'en';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'preferredLanguage';
  private currentLanguageSubject = new BehaviorSubject<Language>(this.loadFromStorage());
  public currentLanguage$: Observable<Language> = this.currentLanguageSubject.asObservable();

  private translations: { [key: string]: { sq: string; en: string } } = {
    'settings.title': { sq: 'Cilësimet', en: 'Settings' },
    'settings.preferences': { sq: 'Preferencat', en: 'Preferences' },
    'settings.profile': { sq: 'Profili', en: 'Profile' },
    'settings.changePassword': { sq: 'Ndrysho Passwordin', en: 'Change Password' },
    'settings.subscription': { sq: 'Abonimi Im', en: 'My Subscription' },
    'preferences.title': { sq: 'Preferencat', en: 'Preferences' },
    'preferences.description': { sq: 'Përshtat cilësimet e aplikacionit sipas preferencave të tua.', en: 'Customize application settings according to your preferences.' },
    'preferences.dyslexicFont.title': { sq: 'Fonti për Disleksikë', en: 'Dyslexic Font' },
    'preferences.dyslexicFont.subtitle': { sq: 'Aktivizo fontin e specializuar për lexim më të lehtë për personat me disleksi', en: 'Enable specialized font for easier reading for people with dyslexia' },
    'preferences.dyslexicFont.info.title': { sq: 'Çfarë është fonti për disleksikë?', en: 'What is dyslexic font?' },
    'preferences.dyslexicFont.info.description': { sq: 'Fonti i specializuar për disleksikë përdor karaktere të projektuar posaçërisht për të reduktuar konfuzionin midis shkronjave dhe për të lehtësuar leximin. Aktivizimi i kësaj mundësie do të ndryshojë fontin në të gjithë aplikacionin.', en: 'The specialized font for dyslexia uses specially designed characters to reduce confusion between letters and facilitate reading. Enabling this option will change the font throughout the application.' },
    'header.dashboard': { sq: 'Dashboardi im', en: 'My Dashboard' },
    'header.panel': { sq: 'Panel', en: 'Panel' },
    'header.profile': { sq: 'Profili', en: 'Profile' },
    'header.logout': { sq: 'Dil', en: 'Logout' },
    'header.login': { sq: 'Hyr', en: 'Login' },
    'header.register': { sq: 'Regjistrohu', en: 'Register' }
  };

  constructor() {
    // Apply language on initialization
    this.applyLanguage();
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  setLanguage(language: Language): void {
    this.currentLanguageSubject.next(language);
    this.saveToStorage(language);
    this.applyLanguage();
  }

  translate(key: string): string {
    const translation = this.translations[key];
    if (!translation) {
      return key;
    }
    return translation[this.currentLanguageSubject.value] || translation.sq;
  }

  translateAsync(key: string): Observable<string> {
    return new Observable(observer => {
      const sub = this.currentLanguage$.subscribe(() => {
        observer.next(this.translate(key));
      });
      return () => sub.unsubscribe();
    });
  }

  private loadFromStorage(): Language {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return (stored === 'en' || stored === 'sq') ? stored : 'sq';
    }
    return 'sq';
  }

  private saveToStorage(language: Language): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, language);
    }
  }

  private applyLanguage(): void {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      html.setAttribute('lang', this.currentLanguageSubject.value);
    }
  }
}


