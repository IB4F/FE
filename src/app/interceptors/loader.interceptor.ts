// loader.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../modules/shared/components/loader/loader.service';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  let requestsInProgress = 0;

  // Show loader for all requests
  requestsInProgress++;
  if (requestsInProgress === 1) {
    loaderService.show();
  }

  return next(req).pipe(
    finalize(() => {
      requestsInProgress--;
      if (requestsInProgress === 0) {
        loaderService.hide();
      }
    })
  );
};
