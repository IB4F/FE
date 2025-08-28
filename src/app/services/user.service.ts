import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of, shareReplay, tap} from "rxjs";
import {AuthService, User} from "../api-client";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUser = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.currentUser.asObservable();

  constructor(private _authService: AuthService) {
  }

  loadUserData(forceRefresh = false): Observable<User | null> {
    if (this.currentUser.value && !forceRefresh) {
      return of(this.currentUser.value);
    }
    return this.fetchFromApi();
  }

  private fetchFromApi(): Observable<User> {
    return this._authService.apiAuthMeGet().pipe(
      tap(user => this.currentUser.next(user)),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  clearUserData() {
    this.currentUser.next(null);
  }
}
