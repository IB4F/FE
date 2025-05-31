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
export class LoginComponent implements OnInit{
  loginFormGroup!: FormGroup;
  hidePass = true;

  constructor(
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private toast: NgToastService,
    private tokenStorageService: TokenStorageService,
    private router: Router,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.initaliazeLoginForm();
  }

  initaliazeLoginForm() {
    this.loginFormGroup = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidator]]
    });
  }

  onLogin() {
    this._authService.loginPost(this.loginFormGroup.value).subscribe({
      next: (resp) => {
        this.tokenStorageService.saveTokens(resp?.data);
        this.toast.success(resp?.message, 'SUKSES', 3000);
        this.router.navigate(['student', 'dashboard']);
        this.loginFormGroup.reset();
      },
      error: (error) => {
        this.toast.danger(error?.error?.message, 'ERROR', 3000);
      }
    })
  }

  isLoginFormValid(): boolean {
    return this.loginFormGroup.valid;
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ForgetPasswordComponent, {
      width: '1200px',
      height: '640px'
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed:', result);
    });
  }
}
