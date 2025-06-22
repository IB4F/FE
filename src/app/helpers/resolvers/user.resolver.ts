import {ResolveFn} from '@angular/router';
import {inject} from "@angular/core";
import {UserService} from "../../services/user.service";
import {TokenStorageService} from "../../services/token-storage.service";
import {of, switchMap, take} from "rxjs";
import {User} from "../../api-client";

export const userResolver: ResolveFn<User | null> = (route, state) => {
  const userService = inject(UserService);
  const tokenService = inject(TokenStorageService);

  return tokenService.isLoggedIn$.pipe(
    take(1),
    switchMap(isLoggedIn => {
      return isLoggedIn ? userService.loadUserData() : of(null);
    })
  );
};
