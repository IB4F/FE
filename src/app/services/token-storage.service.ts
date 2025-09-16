import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {isPlatformBrowser} from "@angular/common";

@Injectable({providedIn: 'root'})
export class TokenStorageService {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
    private userRoleSubject = new BehaviorSubject<string | null>(null);
  private mustChangePasswordSubject = new BehaviorSubject<boolean>(false);

  public isLoggedIn$ = this.loggedInSubject.asObservable();
  public mustChangePassword$ = this.mustChangePasswordSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getAccessToken();
      this.loggedInSubject.next(!!token);
      if (token) {
        this.parseAndSetRole(token);
      }
    }
  }

  // GETTERS (optimized for speed)
  getAccessToken = (): string | null => isPlatformBrowser(this.platformId) ? localStorage.getItem('accessToken') : null;
  getRefreshToken = (): string | null => isPlatformBrowser(this.platformId) ? localStorage.getItem('refreshToken') : null;
  getRole = (): string | null => this.userRoleSubject.value;
  getMustChangePassword = (): boolean => this.mustChangePasswordSubject.value;
  getUserId = (): string | null => {
    const token = this.getAccessToken();
    if (!token) return null;
    const payload = this.parseJwt(token);
    return payload?.sub || payload?.nameid || null;
  };

  // SETTERS (optimized for speed)
  saveTokens = (tokens: { accessToken: string; refreshToken: string; mustChangePassword?: boolean }): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    if (tokens.mustChangePassword !== undefined) {
      localStorage.setItem('mustChangePassword', tokens.mustChangePassword.toString());
      this.mustChangePasswordSubject.next(tokens.mustChangePassword);
    }
    this.parseAndSetRole(tokens.accessToken);
    this.loggedInSubject.next(true);
  };

  // UTILITIES (optimized for speed)
  clearTokens = (): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('mustChangePassword');
    this.loggedInSubject.next(false);
    this.userRoleSubject.next(null);
    this.mustChangePasswordSubject.next(false);
  };

  setMustChangePassword = (value: boolean): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('mustChangePassword', value.toString());
    this.mustChangePasswordSubject.next(value);
  };

  loadTokensFromStorage = (): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const mustChangePassword = localStorage.getItem('mustChangePassword') === 'true';
    if (accessToken && refreshToken) {
      this.saveTokens({accessToken, refreshToken, mustChangePassword});
    }
  };

  private parseAndSetRole(token: string): void {
    try {
      const payload = this.parseJwt(token);
      if (payload && payload.role) {
        this.userRoleSubject.next(payload.role);
      }
    } catch (e) {
      console.error('Error parsing JWT token', e);
      this.userRoleSubject.next(null);
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
