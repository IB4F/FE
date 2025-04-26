import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {NgToastService} from "ng-angular-popup";
import {TokenStorageService} from "../services/token-storage.service";

export const authGuard: CanActivateFn = (route, state) => {
  const tokenStorageService = inject(TokenStorageService);
  const router = inject(Router);
  const ngToast = inject(NgToastService);

  if (!!tokenStorageService.getAccessToken()) {
    return true;
  } else {
    router.navigate(['hyr']);
    ngToast.warning('Hyni në llogari, per te aksesuar kontentin!', 'KUJDES', 5000);
    return false;
  }
};
