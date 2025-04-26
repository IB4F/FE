import { Injectable } from '@angular/core';
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private inactivityTimer?: ReturnType<typeof setTimeout>;

  constructor(private router: Router) {
    this.setupInactivityListener();
  }

  private setupInactivityListener() {
    window.addEventListener('mousemove', this.resetTimer.bind(this));
    window.addEventListener('keypress', this.resetTimer.bind(this));
    this.resetTimer();
  }

  private resetTimer() {
    clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      this.router.navigate(['/login'], { queryParams: { sessionTimeout: true } });
    }, 30 * 60 * 1000); // 30 minutes
  }
}
