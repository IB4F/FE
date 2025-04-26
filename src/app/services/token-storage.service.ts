import {Injectable, Inject, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly ACCESS_TOKEN_KEY = 'secure_at';
  private readonly REFRESH_TOKEN_KEY = 'secure_rt';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getAccessToken(): string | null {
    return this.isBrowser ? localStorage.getItem(this.ACCESS_TOKEN_KEY) : null;
  }

  getRefreshToken(): string | null {
    return this.isBrowser ? sessionStorage.getItem(this.REFRESH_TOKEN_KEY) : null;
  }

  saveTokens(tokens: { accessToken: string; refreshToken: string }): void {
    if (this.isBrowser) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  }

  clearTokens(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }
}
