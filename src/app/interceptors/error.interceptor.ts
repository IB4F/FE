import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core'
import {catchError, throwError} from 'rxjs';
import {NgToastService} from "ng-angular-popup";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NgToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Let 401 be handled by the refresh interceptor
      if (error.status === 401) {
        return throwError(() => error);
      }

      // 403 = authenticated but accessing someone else's resource
      if (error.status === 403) {
        notificationService.danger('Nuk keni leje për të kryer këtë veprim.', 'GABIM', 4000);
        return throwError(() => error);
      }

      if (error.status === 0) {
        notificationService.warning('Network error. Check your connection.', 'WARNING', 3000);
      } else if (error.status === 429) {
        notificationService.warning('Shumë kërkesa. Ju lutemi prisni pak sekonda.', 'KUJDES', 4000);
      } else if (error.status >= 500) {
        notificationService.danger('Server error. Please try again later.', 'ERROR', 3000);
      }
      return throwError(() => error);
    })
  );
};
