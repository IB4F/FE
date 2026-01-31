import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DyslexicFontService {
  private readonly STORAGE_KEY = 'dyslexicFontEnabled';
  private isEnabledSubject = new BehaviorSubject<boolean>(this.loadFromStorage());
  public isEnabled$: Observable<boolean> = this.isEnabledSubject.asObservable();

  constructor() {
    this.applyFontClass();
  }

  toggle(): void {
    const newState = !this.isEnabledSubject.value;
    this.isEnabledSubject.next(newState);
    this.saveToStorage(newState);
    this.applyFontClass();
  }

  isEnabled(): boolean {
    return this.isEnabledSubject.value;
  }

  private loadFromStorage(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  }

  private saveToStorage(enabled: boolean): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, enabled.toString());
    }
  }

  private applyFontClass(): void {
    if (typeof document !== 'undefined') {
      const body = document.body;
      if (this.isEnabledSubject.value) {
        body.classList.add('dyslexic-font-enabled');
      } else {
        body.classList.remove('dyslexic-font-enabled');
      }
    }
  }
}


