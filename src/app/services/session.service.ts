import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import {Router} from "@angular/router";
import {isPlatformBrowser} from "@angular/common";

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private inactivityTimer?: ReturnType<typeof setTimeout>;

  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.setupInactivityListener();
    }
  }

  private setupInactivityListener() {
    window.addEventListener('mousemove', this.resetTimer.bind(this));
    window.addEventListener('keypress', this.resetTimer.bind(this));
    this.resetTimer();
  }

  private resetTimer() {
    clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      this.router.navigate(['/hyr'], { queryParams: { sessionTimeout: true } });
    }, 30 * 60 * 1000); // 30 minutes
  }
}
