import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {isPlatformBrowser} from "@angular/common";

@Injectable({providedIn: 'root'})
export class TokenStorageService {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
    private userRoleSubject = new BehaviorSubject<string | null>(null);

  public isLoggedIn$ = this.loggedInSubject.asObservable();

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
  getUserId = (): string | null => {
    const token = this.getAccessToken();
    if (!token) return null;
    const payload = this.parseJwt(token);
    return payload?.sub || payload?.userId || null;
  };

  // SETTERS (optimized for speed)
  saveTokens = (tokens: { accessToken: string; refreshToken: string }): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    this.parseAndSetRole(tokens.accessToken);
    this.loggedInSubject.next(true);
  };

  // UTILITIES (optimized for speed)
  clearTokens = (): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.loggedInSubject.next(false);
    this.userRoleSubject.next(null);
  };

  loadTokensFromStorage = (): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    if (accessToken && refreshToken) {
      this.saveTokens({accessToken, refreshToken});
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
