import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { TokenStorageService } from '../services/token-storage.service';
import { inject } from '@angular/core';
import {BehaviorSubject, catchError, filter, switchMap, take, throwError} from 'rxjs';
import {AuthService} from "../api-client";
import {Router} from "@angular/router";

const isRefreshingSubject = new BehaviorSubject<boolean>(false);
let refreshTokenInFlight: BehaviorSubject<string | null> | null = null;

export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('/refresh')
      ) {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
          tokenStorage.clearTokens();
          router.navigate(['/hyr']);
          return throwError(() => error);
        }

        if (!refreshTokenInFlight) {
          refreshTokenInFlight = new BehaviorSubject<string | null>(null);
          isRefreshingSubject.next(true);
          authService.apiAuthRefreshPost({ refreshToken }).subscribe({
            next: (newTokens) => {
              tokenStorage.saveTokens(newTokens);
              refreshTokenInFlight?.next(newTokens.accessToken);
              refreshTokenInFlight?.complete();
              refreshTokenInFlight = null;
              isRefreshingSubject.next(false);
            },
            error: () => {
              tokenStorage.clearTokens();
              authService.apiAuthLogoutPost();
              refreshTokenInFlight?.error(error);
              refreshTokenInFlight = null;
              isRefreshingSubject.next(false);
              router.navigate(['/hyr']);
            }
          });
        }

        return (refreshTokenInFlight as BehaviorSubject<string | null>).pipe(
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
