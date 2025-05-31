import { inject } from '@angular/core';
import {TokenStorageService} from "./token-storage.service";

export function appInitializer(): () => Promise<void> {
  const tokenService = inject(TokenStorageService);

  return () => {
      tokenService.loadTokensFromStorage();
    return Promise.resolve();
  };
}
