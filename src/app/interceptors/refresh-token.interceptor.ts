import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { TokenStorageService } from '../services/token-storage.service';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import {AuthService} from "../api-client";

export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenStorage = inject(TokenStorageService);

  return next(req).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('/refresh')
      ) {
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken) {
          return authService.refreshPost({ refreshToken }).pipe(
            switchMap((newTokens) => {
              tokenStorage.saveTokens(newTokens);
              const clonedReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newTokens.accessToken}` }
              });
              return next(clonedReq);
            }),
            catchError((err) => {
              authService.logoutPost();
              return throwError(() => err);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
