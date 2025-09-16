import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

export const mustChangePasswordGuard: CanActivateFn = (route, state) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  // Check if user must change password
  if (tokenStorage.getMustChangePassword()) {
    // Redirect to password change page
    router.navigate(['/change-password-first-time']);
    return false;
  }

  return true;
};

