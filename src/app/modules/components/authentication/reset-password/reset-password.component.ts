import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {CommonModule} from "@angular/common";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService, ResetPasswordDTO} from "../../../../api-client";
import {NgToastService} from "ng-angular-popup";
import {ConfirmPasswordValidator} from "../../../../helpers/customValidators/confirm-password.validator";
import {passwordValidator} from "../../../../helpers/customValidators/check-password.validator";

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  resetPassForm!: FormGroup;
  emailToken!: string;
  hidePass = true;
  hidePass2 = true;

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private _authService: AuthService,
    private toast: NgToastService,
  ) {
  }

  ngOnInit(): void {
    this.initializeForm();
    this.activatedRoute.queryParams.subscribe(val => {
      this.emailToken = val['token']; // Assicurati che il parametro si chiami 'token' nell'URL
    });
  }

  initializeForm() {
    this.resetPassForm = this.formBuilder.group({
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, {validator: ConfirmPasswordValidator("password", "confirmPassword")});
  }

  reset() {
    if (this.resetPassForm.valid && this.emailToken) {
      const resetPasswordObj: ResetPasswordDTO = {
        token: this.emailToken,
        newPassword: this.resetPassForm.value.password
      };

      this._authService.resetPost(resetPasswordObj).subscribe({
        next: (resp) => {
          this.toast.success(resp?.message, 'SUKSES', 3000);
          this.router.navigate(['hyr']);
        },
        error: (err) => {
          this.toast.danger(err?.error?.message || 'Gabim gjatë resetimit të password-it', 'ERROR', 3000);
        }
      });
    }
  }

  isResetFormValid(): boolean {
    return this.resetPassForm.valid && !!this.emailToken;
  }
}
