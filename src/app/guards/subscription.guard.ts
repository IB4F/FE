import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SubscriptionManagementService } from '../services/subscription.service';
import { UserService } from '../services/user.service';
import { TokenStorageService } from '../services/token-storage.service';
import { SubscriptionAccessService } from '../api-client';
import { NgToastService } from "ng-angular-popup";
import { map, catchError, switchMap } from "rxjs";
import { of } from 'rxjs';

/**
 * Smart subscription guard that handles:
 * - BGA students (@bga.al): Access depends on supervisor/family subscription
 * - Regular students: Must have their own subscription (active or trial)
 */
export const smartSubscriptionGuard: CanActivateFn = (route, state) => {
  const subscriptionService = inject(SubscriptionManagementService);
  const userService = inject(UserService);
  const tokenService = inject(TokenStorageService);
  const subscriptionAccessService = inject(SubscriptionAccessService);
  const router = inject(Router);
  const notificationService = inject(NgToastService);

  // Synchronous check — token is read from localStorage before any async work
  if (!tokenService.getAccessToken()) {
    notificationService.warning('Nuk mund të verifikohet informacioni i përdoruesit!', 'KUJDES', 3000);
    router.navigate(['/membership']);
    return of(false);
  }

  // loadUserData() returns cached user or fetches from API — avoids the null
  // BehaviorSubject value that user$.pipe(take(1)) captures on fresh page load
  return userService.loadUserData().pipe(
    switchMap(user => {
      if (!user) {
        notificationService.warning('Nuk mund të verifikohet informacioni i përdoruesit!', 'KUJDES', 3000);
        router.navigate(['/membership']);
        return of(false);
      }

      // BGA students inherit access from supervisor/family
      if (user.email?.endsWith('@bga.al')) {
        return checkBgaStudentAccess(user, subscriptionAccessService, router, notificationService);
      }

      // Regular students need their own subscription
      return subscriptionService.getActiveSubscription().pipe(
        map((subscription: any) => {
          const hasValidSubscription =
            subscriptionService.isSubscriptionActive(subscription) ||
            subscriptionService.isSubscriptionInTrial(subscription);

          if (!hasValidSubscription) {
            notificationService.warning('Duhet të kesh një subscription aktiv ose në provë për të aksesuar këtë faqe!', 'KUJDES', 3000);
            router.navigate(['/membership']);
            return false;
          }
          return true;
        }),
        catchError(() => {
          notificationService.warning('Gabim gjatë verifikimit të subscriptionit!', 'KUJDES', 3000);
          router.navigate(['/membership']);
          return of(false);
        })
      );
    }),
    catchError(() => {
      notificationService.warning('Gabim gjatë verifikimit të informacionit të përdoruesit!', 'KUJDES', 3000);
      router.navigate(['/membership']);
      return of(false);
    })
  );
};

/**
 * Check BGA student access based on supervisor/family subscription
 */
function checkBgaStudentAccess(user: any, subscriptionAccessService: SubscriptionAccessService, router: Router, notificationService: NgToastService) {
  return subscriptionAccessService.apiSubscriptionAccessUserTierGet().pipe(
    map((tierResponse: any) => {
      if (tierResponse && (tierResponse.tier > 0 || tierResponse.hasAccess)) {
        return true;
      }
      
      const message = user.supervisorId 
        ? 'Supervizori juaj nuk ka një subscription aktiv. Kontaktoni supervizorin tuaj.'
        : 'Anëtari i familjes që ju mbështet nuk ka një subscription aktiv. Kontaktoni familjen tuaj.';
      
      notificationService.warning(message, 'KUJDES', 4000);
      router.navigate(['/membership']);
      return false;
    }),
    catchError(() => {
      const message = user.supervisorId 
        ? 'Gabim gjatë verifikimit të subscriptionit të supervizorit. Kontaktoni supervizorin tuaj.'
        : 'Gabim gjatë verifikimit të subscriptionit të familjes. Kontaktoni familjen tuaj.';
      
      notificationService.warning(message, 'KUJDES', 4000);
      router.navigate(['/membership']);
      return of(false);
    })
  );
}
