// loader.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../modules/shared/components/loader/loader.service';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const skipLoader = req.url.includes('/refresh');
  const loaderService = inject(LoaderService);

  if (!skipLoader) {
    loaderService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!skipLoader) {
        loaderService.hide();
      }
    })
  );
};
