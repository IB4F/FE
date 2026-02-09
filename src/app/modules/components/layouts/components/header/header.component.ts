import {Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {CommonModule} from "@angular/common";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {TokenStorageService} from "../../../../../services/token-storage.service";
import {UserRole} from "../../../../shared/constant/enums";
import {UserService} from "../../../../../services/user.service";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {AuthService} from "../../../../../api-client";
import {MatButtonModule} from "@angular/material/button";
import {SessionService} from "../../../../../services/session.service";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    MatButtonModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  isLogged = false;
  userRole: string | null = null;
  user$ = this.userService.user$;
  initials$ = this.user$.pipe(
    map(user => {
      if (!user) return '';
      const firstNameInitial = user.firstName?.[0] || '';
      const lastNameInitial = user.lastName?.[0] || '';
      return `${firstNameInitial}${lastNameInitial}`.toUpperCase();
    })
  );

  @Output() toggleSidenav = new EventEmitter<void>();
  @Input() isSideNavOpen: boolean = true;

  private destroyRef = inject(DestroyRef);
  private _sessionService = inject(SessionService);

  constructor(
    private _tokenStorageService: TokenStorageService,
    private _authService: AuthService,
    private router: Router,
    private userService: UserService,
  ) {
  }

  ngOnInit(): void {
    this._tokenStorageService.isLoggedIn$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loggedIn => {
        this.isLogged = loggedIn;
        if (loggedIn) {
          this.userRole = this._tokenStorageService.getRole();
        } else {
          this.userRole = null;
        }
      });
  }

  onToggleSidenavClick(): void {
    this.toggleSidenav.emit();
  }

  logout() {
    this._authService.apiAuthLogoutPost().subscribe({
      next: () => {
        this._tokenStorageService.clearTokens();
        this._sessionService.clearInactivityTimer();
        this.userService.clearUserData();
        this.router.navigate(['']);
      },
      error: () => {
        this._tokenStorageService.clearTokens();
        this._sessionService.clearInactivityTimer();
        this.userService.clearUserData();
        this.router.navigate(['']);
      }
    });
  }

  showDashboard(): boolean {
    return this.userRole === UserRole.STUDENT || this.userRole === UserRole.FAMILY;
  }

  showPanel(): boolean {
    return this.userRole === UserRole.ADMIN;
  }

  isSupervisor(): boolean {
    return this.userRole === UserRole.SUPERVISOR;
  }

  onLogoClick(): void {
    if (this.isLogged && this.isSupervisor()) {
      this.router.navigate(['/supervizor/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
