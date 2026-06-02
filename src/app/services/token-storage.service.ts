import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private accessToken: string | null = null;

  private loggedInSubject = new BehaviorSubject<boolean>(false);
  private userRoleSubject = new BehaviorSubject<string | null>(null);
  private mustChangePasswordSubject = new BehaviorSubject<boolean>(false);
  private userIdSubject = new BehaviorSubject<string | null>(null);

  public isLoggedIn$ = this.loggedInSubject.asObservable();
  public mustChangePassword$ = this.mustChangePasswordSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      // mustChangePassword is not sensitive — restore from sessionStorage on reload
      const mcp = sessionStorage.getItem('mustChangePassword') === 'true';
      this.mustChangePasswordSubject.next(mcp);
    }
  }

  getAccessToken = (): string | null => this.accessToken;

  getRole = (): string | null => this.userRoleSubject.value;
  getMustChangePassword = (): boolean => this.mustChangePasswordSubject.value;
  getUserId = (): string | null => this.userIdSubject.value;
  getUserEmail = (): string | null => {
    const token = this.accessToken;
    if (!token) return null;
    const payload = this.parseJwt(token);
    return payload?.email ?? payload?.unique_name ?? null;
  };

  saveTokens = (tokens: { accessToken: string; mustChangePassword?: boolean }): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    this.accessToken = tokens.accessToken;
    if (tokens.mustChangePassword !== undefined) {
      sessionStorage.setItem('mustChangePassword', tokens.mustChangePassword.toString());
      this.mustChangePasswordSubject.next(tokens.mustChangePassword);
    }
    this.parseAndSetRole(tokens.accessToken);
    this.loggedInSubject.next(true);
  };

  clearTokens = (): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    this.accessToken = null;
    sessionStorage.removeItem('mustChangePassword');
    this.loggedInSubject.next(false);
    this.userRoleSubject.next(null);
    this.mustChangePasswordSubject.next(false);
    this.userIdSubject.next(null);
  };

  setMustChangePassword = (value: boolean): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    sessionStorage.setItem('mustChangePassword', value.toString());
    this.mustChangePasswordSubject.next(value);
  };

  private parseAndSetRole(token: string): void {
    try {
      const payload = this.parseJwt(token);
      if (payload) {
        if (payload.role) {
          this.userRoleSubject.next(payload.role);
        }
        const userId = payload.sub ?? payload.nameid ?? null;
        this.userIdSubject.next(userId);
      }
    } catch {
      this.userRoleSubject.next(null);
      this.userIdSubject.next(null);
    }
  }

  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const globalAtob = typeof atob === 'function' ? atob : (b64: string) => Buffer.from(b64, 'base64').toString('binary');
      const jsonPayload = decodeURIComponent(
        globalAtob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
}
