import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkSubject = new BehaviorSubject<boolean>(false);
  isDark$ = this.darkSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('bg-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = stored != null ? stored === 'dark' : prefersDark;
      this.apply(isDark);
    }
  }

  get isDark(): boolean {
    return this.darkSubject.value;
  }

  toggle(): void {
    this.apply(!this.darkSubject.value);
  }

  private apply(dark: boolean): void {
    this.darkSubject.next(dark);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('bg-theme', dark ? 'dark' : 'light');
      document.body.classList.toggle('dark-theme', dark);
    }
  }
}
