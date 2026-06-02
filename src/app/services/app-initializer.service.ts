import { inject, PLATFORM_ID } from '@angular/core';
import { TokenStorageService } from './token-storage.service';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../api-client';
import { firstValueFrom } from 'rxjs';

export function appInitializer(): () => Promise<void> {
  const tokenService = inject(TokenStorageService);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  return () => {
    if (!isPlatformBrowser(platformId)) {
      return Promise.resolve();
    }

    // Attempt silent session restore via the HttpOnly refresh cookie.
    // If the cookie is valid the server returns a fresh accessToken and we
    // store it in memory so the user is already logged in after a page reload.
    return firstValueFrom(authService.apiAuthRefreshPost({}))
      .then((response: any) => {
        const accessToken = response?.data?.accessToken ?? response?.accessToken;
        if (accessToken) {
          tokenService.saveTokens({
            accessToken,
            mustChangePassword: response?.data?.mustChangePassword ?? response?.mustChangePassword,
          });
        }
      })
      .catch(() => {
        // Cookie missing or expired — user will be asked to log in.
      });
  };
}
