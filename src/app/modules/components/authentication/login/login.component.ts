import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {Router, RouterLink} from "@angular/router";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {passwordValidator} from "../../../../helpers/customValidators/check-password.validator";
import {NgToastService} from "ng-angular-popup";
import {TokenStorageService} from "../../../../services/token-storage.service";
import {AuthService, ForgotPasswordDTO} from "../../../../api-client";
import {ROUTES, UserRole} from "../../../shared/constant/enums";
import {switchMap} from "rxjs";
import {UserService} from "../../../../services/user.service";
import {TranslatePipe} from "../../../../pipes/translate.pipe";
import {animate, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-login',
  standalone: true,
  animations: [
    trigger('viewSwitch', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('320ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ position: 'absolute', width: '100%' }),
        animate('180ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    CommonModule,
    MatTooltipModule,
    RouterLink,
    TranslatePipe
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginFormGroup!: FormGroup;
  forgotFormGroup!: FormGroup;
  hidePass = true;
  rememberMe = false;
  showForgotForm = false;
  resetSent = false;
  isSendingReset = false;

  lockedUntil: Date | null = null;
  lockoutCountdown = '';
  private lockoutInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private toast: NgToastService,
    private _tokenStorageService: TokenStorageService,
    private userService: UserService,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this.initializeLoginForm();
    this.initializeForgotForm();
    this.checkForRegistrationSuccess();
  }

  private checkForRegistrationSuccess(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');

    if (message === 'registration-success') {
      this.toast.success('Regjistrimi u përfundua me sukses! Ju lutemi hyni në llogarinë tuaj.', 'SUKSES', 5000);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (message === 'payment-cancelled') {
      this.toast.warning('Pagesa u anulua. Mund të provoni regjistrimin përsëri.', 'ANULUAR', 4000);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  initializeLoginForm() {
    this.loginFormGroup = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidator]]
    });
  }

  initializeForgotForm() {
    this.forgotFormGroup = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  toggleForgotForm(): void {
    this.showForgotForm = !this.showForgotForm;
    this.resetSent = false;

    if (this.showForgotForm) {
      const loginEmail = this.loginFormGroup.get('email');
      this.forgotFormGroup.patchValue({
        email: loginEmail?.valid ? loginEmail.value : ''
      });
    }
  }

  sendResetEmail(): void {
    if (this.forgotFormGroup.invalid) return;

    this.isSendingReset = true;
    const payload: ForgotPasswordDTO = { email: this.forgotFormGroup.get('email')?.value };

    this._authService.apiAuthRequestResetPost(payload).subscribe({
      next: (resp) => {
        this.resetSent = true;
        this.isSendingReset = false;
        this.toast.success(resp.message, 'SUKSES', 5000);
      },
      error: (err) => {
        this.isSendingReset = false;
        this.toast.danger(err?.error?.message || 'Ndodhi një gabim', 'GABIM', 5000);
      }
    });
  }

  onLogin() {
    let skipNavigation = false;

    this._authService.apiAuthLoginPost({ ...this.loginFormGroup.value, rememberMe: this.rememberMe }).pipe(
      switchMap(resp => {
        this._tokenStorageService.saveTokens(resp?.data);

        if (resp?.data?.requiresTermsReAcceptance) {
          skipNavigation = true;
          this.router.navigate(['/accept-terms']);
          return this.userService.loadUserData(true);
        }

        if (resp?.data?.mustChangePassword) {
          this._tokenStorageService.setMustChangePassword(true);
          this.router.navigate(['/change-password-first-time']);
          return this.userService.loadUserData(true);
        }

        return this.userService.loadUserData(true);
      })
    ).subscribe({
      next: () => {
        if (!this._tokenStorageService.getMustChangePassword() && !skipNavigation) {
          this.navigateTo();
        }
      },
      error: (error) => {
        if (error?.status === 429 && error?.error?.lockedUntil) {
          this.handleLockout(error.error.lockedUntil);
        } else {
          this.toast.danger(error?.error?.message || 'Ndodhi një gabim', 'GABIM', 4000);
        }
      }
    });
  }

  isLoginFormValid(): boolean {
    return this.loginFormGroup.valid && !this.lockedUntil;
  }

  ngOnDestroy(): void {
    this.clearLockoutInterval();
  }

  private handleLockout(lockedUntil: string): void {
    this.lockedUntil = new Date(lockedUntil);
    this.updateCountdown();
    this.lockoutInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  private updateCountdown(): void {
    if (!this.lockedUntil) return;
    const remaining = Math.max(0, this.lockedUntil.getTime() - Date.now());

    if (remaining === 0) {
      this.lockedUntil = null;
      this.lockoutCountdown = '';
      this.clearLockoutInterval();
      return;
    }

    const totalSec = Math.ceil(remaining / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    if (h > 0) {
      this.lockoutCountdown = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    } else {
      this.lockoutCountdown = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }

  private clearLockoutInterval(): void {
    if (this.lockoutInterval !== null) {
      clearInterval(this.lockoutInterval);
      this.lockoutInterval = null;
    }
  }

  navigateTo() {
    const role = this._tokenStorageService.getRole();
    switch (role) {
      case UserRole.ADMIN:
        this.router.navigate([ROUTES.ADMIN]);
        break;
      case UserRole.SUPERVISOR:
        this.router.navigate([ROUTES.SUPERVISOR]);
        break;
      case UserRole.STUDENT:
        this.router.navigate([ROUTES.STUDENT]);
        break;
      case UserRole.FAMILY:
        this.router.navigate([ROUTES.FAMILY]);
        break;
      default:
        this.router.navigate([ROUTES.DEFAULT]);
        this.toast.warning('Roli nuk njihet, ridrejtimi në faqen kryesore', 'Kujdes', 3000);
        break;
    }
  }
}
