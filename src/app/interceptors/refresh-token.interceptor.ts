import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { TokenStorageService } from '../services/token-storage.service';
import { SessionService } from '../services/session.service';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../api-client';
import { Router } from '@angular/router';

let refreshTokenInFlight: BehaviorSubject<string | null> | null = null;

export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenStorage = inject(TokenStorageService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('/refresh')
      ) {
        if (!refreshTokenInFlight) {
          const subject = new BehaviorSubject<string | null>(null);
          refreshTokenInFlight = subject;

          // No body needed — the HttpOnly cookie is sent automatically via withCredentials
          authService.apiAuthRefreshPost({}).subscribe({
            next: (response: any) => {
              const newAccessToken = response?.data?.accessToken ?? response?.accessToken;
              if (newAccessToken) {
                tokenStorage.saveTokens({ accessToken: newAccessToken });
                subject.next(newAccessToken);
                subject.complete();
              } else {
                subject.error(error);
              }
              refreshTokenInFlight = null;
            },
            error: () => {
              tokenStorage.clearTokens();
              sessionService.clearInactivityTimer();
              authService.apiAuthLogoutPost().subscribe();
              subject.error(error);
              refreshTokenInFlight = null;
              router.navigate(['/hyr']);
            }
          });
        }

        return refreshTokenInFlight.pipe(
          filter((token): token is string => !!token),
          take(1),
          switchMap((newAccessToken: string) => {
            const clonedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newAccessToken}` }
            });
            return next(clonedReq);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
