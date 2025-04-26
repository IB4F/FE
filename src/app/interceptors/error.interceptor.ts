import { HttpInterceptorFn } from '@angular/common/http';
import {Router} from "@angular/router";
import {inject} from "@angular/core";
import {catchError, throwError} from "rxjs";
import {AuthService} from "../api-client/auth";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logoutPost();
        router.navigate(['/hyr'], { queryParams: { sessionExpired: true } });
      }
      return throwError(() => error);
    })
  );
};
