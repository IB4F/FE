import {HttpInterceptorFn} from '@angular/common/http';
import {TokenStorageService} from "../services/token-storage.service";
import {inject} from "@angular/core";

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getAccessToken();

  if (token) {
    req = req.clone({
      setHeaders: {Authorization: `Bearer ${token}`}
    });
  }

  return next(req);
};
