import {Component, DestroyRef, EventEmitter, HostListener, inject, Input, OnInit, Output} from '@angular/core';
import {NavigationEnd, Router, RouterLink} from "@angular/router";
import {CommonModule} from "@angular/common";
import {TokenStorageService} from "../../../../../services/token-storage.service";
import {UserRole} from "../../../../shared/constant/enums";
import {UserService} from "../../../../../services/user.service";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import {AuthService} from "../../../../../api-client";
import {SessionService} from "../../../../../services/session.service";
import {TranslationService} from "../../../../../services/translation.service";
import {TranslatePipe} from "../../../../../pipes/translate.pipe";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  isLogged = false;
  navScrolled = false;
  isMobileMenuOpen = false;
  isUserMenuOpen = false;
  userRole: string | null = null;

  get isLandingPage(): boolean {
    return this.router.url.split('#')[0] === '/';
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.navScrolled = window.scrollY > 8;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isUserMenuOpen = false;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  get userRoleLabel(): string {
    switch (this.userRole) {
      case UserRole.ADMIN:       return 'Administrator';
      case UserRole.STUDENT:     return 'Student';
      case UserRole.SUPERVISOR:  return 'Supervizor';
      case UserRole.FAMILY:      return 'Familja';
      default:                   return this.userRole ?? '';
    }
  }
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
    public translationService: TranslationService,
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

    this.translationService.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.isMobileMenuOpen = false);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  get labelDashboard(): string { return this.translationService.translate('header.dashboard'); }
  get labelPanel(): string { return this.translationService.translate('header.panel'); }
  get labelProfile(): string { return this.translationService.translate('header.profile'); }
  get labelLogout(): string { return this.translationService.translate('header.logout'); }
  get labelLogin(): string { return this.translationService.translate('header.login'); }
  get labelRegister(): string { return this.translationService.translate('header.register'); }
  get labelCloseMenu(): string { return this.translationService.translate('header.closeMenu'); }
  get labelOpenMenu(): string { return this.translationService.translate('header.openMenu'); }

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

  get dashboardRoute(): string {
    return this.userRole === UserRole.FAMILY ? '/family/dashboard' : '/student/dashboard';
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
