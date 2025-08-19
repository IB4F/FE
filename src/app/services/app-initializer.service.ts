import { Inject, inject, PLATFORM_ID } from '@angular/core';
import {TokenStorageService} from "./token-storage.service";
import {isPlatformBrowser} from "@angular/common";

export function appInitializer(): () => Promise<void> {
  const tokenService = inject(TokenStorageService);
  const platformId = inject(PLATFORM_ID);

  return () => {
    if (isPlatformBrowser(platformId)) {
      tokenService.loadTokensFromStorage();
    }
    return Promise.resolve();
  };
}
