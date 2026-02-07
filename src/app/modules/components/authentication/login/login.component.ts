import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {Router, RouterLink} from "@angular/router";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatInputModule} from "@angular/material/input";
import {MatDialog} from "@angular/material/dialog";
import {passwordValidator} from "../../../../helpers/customValidators/check-password.validator";
import {ForgetPasswordComponent} from "../forget-password/forget-password.component";
import {NgToastService} from "ng-angular-popup";
import {TokenStorageService} from "../../../../services/token-storage.service";
import {AuthService} from "../../../../api-client";
import {ROUTES, UserRole} from "../../../shared/constant/enums";
import {switchMap} from "rxjs";
import {UserService} from "../../../../services/user.service";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatTooltipModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginFormGroup!: FormGroup;
  hidePass = true;

  constructor(
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private toast: NgToastService,
    private _tokenStorageService: TokenStorageService,
    private userService: UserService,
    private router: Router,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.initaliazeLoginForm();
    this.checkForRegistrationSuccess();
  }

  private checkForRegistrationSuccess(): void {
    // Check for registration success message from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');

    if (message === 'registration-success') {
      this.toast.success('Regjistrimi u përfundua me sukses! Ju lutemi hyni në llogarinë tuaj.', 'SUKSES', 5000);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (message === 'payment-cancelled') {
      this.toast.warning('Pagesa u anulua. Mund të provoni regjistrimin përsëri.', 'ANULUAR', 4000);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  initaliazeLoginForm() {
    this.loginFormGroup = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidator]]
    });
  }

  onLogin() {
    this._authService.apiAuthLoginPost(this.loginFormGroup.value).pipe(
      switchMap(resp => {
        this._tokenStorageService.saveTokens(resp?.data);
        this.toast.success(resp?.message, 'SUCCESS', 3000);
        
        // Check if user must change password
        if (resp?.data?.mustChangePassword) {
          // Set the flag and redirect to password change page for first-time login
          this._tokenStorageService.setMustChangePassword(true);
          this.router.navigate(['/change-password-first-time']);
          return this.userService.loadUserData(true);
        }
        
        return this.userService.loadUserData(true);
      })
    ).subscribe({
      next: () => {
        // Only navigate to dashboard if user doesn't need to change password
        if (!this._tokenStorageService.getMustChangePassword()) {
          this.navigateTo();
        }
      },
      error: (error) => this.toast.danger(error?.error?.message, 'ERROR', 3000)
    });
  }

  isLoginFormValid(): boolean {
    return this.loginFormGroup.valid;
  }

  openDialog(): void {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    const isLandscape = window.innerHeight < 520 && window.innerWidth > window.innerHeight;

    let dialogConfig: any = {
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'custom-backdrop',
      panelClass: 'forget-password-modal'
    };

    if (isLandscape) {
      // Modale in orizzontale: dimensioni che si adattano all'altezza ridotta
      dialogConfig = {
        ...dialogConfig,
        width: '92vw',
        height: '92vh',
        maxWidth: '700px',
        maxHeight: '92vh',
        panelClass: ['forget-password-modal', 'landscape-modal']
      };
    } else if (isMobile) {
      dialogConfig = {
        ...dialogConfig,
        width: '95vw',
        height: '92vh',
        maxWidth: '420px',
        maxHeight: '92vh',
        panelClass: ['forget-password-modal', 'mobile-modal']
      };
    } else if (isTablet) {
      dialogConfig = {
        ...dialogConfig,
        width: '90vw',
        height: '85vh',
        maxWidth: '900px',
        maxHeight: '700px',
        panelClass: ['forget-password-modal', 'tablet-modal']
      };
    } else {
      dialogConfig = {
        ...dialogConfig,
        width: '1200px',
        height: '640px',
        panelClass: ['forget-password-modal', 'desktop-modal']
      };
    }

    const dialogRef = this.dialog.open(ForgetPasswordComponent, dialogConfig);
    
    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed:', result);
    });
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
      case UserRole.FAMILY:
        this.router.navigate([ROUTES.STUDENT]);
        break;
      default:
        this.router.navigate([ROUTES.DEFAULT]);
        this.toast.warning('Roli nuk njihet, ridrejtimi në faqen kryesore', 'Kujdes', 3000);
        break;
    }
  }
}
