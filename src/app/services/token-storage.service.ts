import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({providedIn: 'root'})
export class TokenStorageService {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
    private userRoleSubject = new BehaviorSubject<string | null>(null);

  public isLoggedIn$ = this.loggedInSubject.asObservable();

  constructor() {
    const token = this.getAccessToken();
    this.loggedInSubject.next(!!token);
  }

  // GETTERS (optimized for speed)
  getAccessToken = (): string | null => localStorage.getItem('accessToken');
  getRefreshToken = (): string | null => localStorage.getItem('refreshToken');
  getRole = (): string | null => this.userRoleSubject.value;

  // SETTERS (optimized for speed)
  saveTokens = (tokens: { accessToken: string; refreshToken: string }): void => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    this.parseAndSetRole(tokens.accessToken);
    this.loggedInSubject.next(true);
  };

  // UTILITIES (optimized for speed)
  clearTokens = (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.loggedInSubject.next(false);
    this.userRoleSubject.next(null);
  };

  loadTokensFromStorage = (): void => {
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
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }
}
