import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {Router} from "@angular/router";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatInputModule} from "@angular/material/input";
import {passwordValidator} from "../../../../helpers/customValidators/check-password.validator";
import {ConfirmPasswordValidator} from "../../../../helpers/customValidators/confirm-password.validator";
import {NgToastService} from "ng-angular-popup";
import {TokenStorageService} from "../../../../services/token-storage.service";
import {AuthService} from "../../../../api-client";
import {switchMap} from "rxjs";

@Component({
  selector: 'app-change-password-first-time',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatTooltipModule
  ],
  templateUrl: './change-password-first-time.component.html',
  styleUrl: './change-password-first-time.component.scss'
})
export class ChangePasswordFirstTimeComponent implements OnInit {
  changePasswordFormGroup!: FormGroup;
  hideCurrentPass = true;
  hidePass = true;
  hidePass2 = true;

  constructor(
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private toast: NgToastService,
    private _tokenStorageService: TokenStorageService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm() {
    this.changePasswordFormGroup = this._formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, {validator: ConfirmPasswordValidator("newPassword", "confirmPassword")});
  }

  onChangePassword() {
    if (this.changePasswordFormGroup.valid) {
      const changePasswordObj = {
        currentPassword: this.changePasswordFormGroup.value.currentPassword,
        newPassword: this.changePasswordFormGroup.value.newPassword,
        confirmPassword: this.changePasswordFormGroup.value.confirmPassword
      };

      this._authService.apiAuthChangePasswordPost(changePasswordObj).pipe(
        switchMap(() => {
          // Clear the mustChangePassword flag after successful password change
          this._tokenStorageService.setMustChangePassword(false);
          this.toast.success('Fjalëkalimi u ndryshua me sukses!', 'SUKSES', 3000);
          
          // Navigate to appropriate dashboard based on user role
          const role = this._tokenStorageService.getRole();
          if (role === 'Student') {
            return this.router.navigate(['/student/dashboard']);
          } else if (role === 'Supervisor') {
            return this.router.navigate(['/supervizor/dashboard']);
          } else if (role === 'Admin') {
            return this.router.navigate(['/admin/panel']);
          }
          return this.router.navigate(['/']);
        })
      ).subscribe({
        next: () => {
          // Navigation handled in switchMap
        },
        error: (error) => {
          this.toast.danger(error?.error?.message || 'Gabim gjatë ndryshimit të fjalëkalimit', 'ERROR', 3000);
        }
      });
    }
  }

  isChangePasswordFormValid(): boolean {
    return this.changePasswordFormGroup.valid;
  }
}
