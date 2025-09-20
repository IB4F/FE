import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user.service';
import { NgToastService } from "ng-angular-popup";
import { map, take } from "rxjs";

export const domainGuard = (excludedDomain: string): CanActivateFn => {
  return (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);
    const notificationService = inject(NgToastService);

    return userService.user$.pipe(
      take(1),
      map(user => {
        if (!user || !user.email) {
          notificationService.warning('Nuk mund të verifikohet informacioni i përdoruesit!', 'KUJDES', 3000);
          router.navigate(['/']);
          return false;
        }

        const userEmailDomain = user.email.split('@')[1];
        
        // If user has the excluded domain (e.g., @bga.al), deny access
        if (userEmailDomain === excludedDomain) {
          notificationService.info('Kjo funksionalitet nuk është i disponueshëm për llogaritë e brendshme.', 'INFO', 3000);
          router.navigate(['/']);
          return false;
        }

        return true;
      })
    );
  };
};

/**
 * Guard that restricts access to subscription dashboard for users with @bga.al domain
 */
export const subscriptionDomainGuard = domainGuard('bga.al');
