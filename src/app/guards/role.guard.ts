import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';
import { NgToastService } from "ng-angular-popup";
import { map, take } from "rxjs";

export const roleGuard = (...expectedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const tokenService = inject(TokenStorageService);
    const router = inject(Router);
    const notificationService = inject(NgToastService);

    return tokenService.isLoggedIn$.pipe(
      take(1),
      map(isLoggedIn => {
        if (!isLoggedIn) {
          notificationService.warning('Duhet të logohesh për të aksesuar këtë faqe!', 'KUJDES', 3000);
          router.navigate(['/hyr']);
          return false;
        }

        const userRole = tokenService.getRole();
        if (!userRole || !expectedRoles.includes(userRole)) {
          const rolesString = expectedRoles.join(' ose ');
          notificationService.danger(`Nuk keni akses si ${rolesString}!`, 'GABIM', 3000);
          router.navigate(['/']);
          return false;
        }

        return true;
      })
    );
  };
};
