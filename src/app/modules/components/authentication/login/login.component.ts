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
  }

  initaliazeLoginForm() {
    this.loginFormGroup = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidator]]
    });
  }

  onLogin() {
    this._authService.loginPost(this.loginFormGroup.value).pipe(
      switchMap(resp => {
        this._tokenStorageService.saveTokens(resp?.data);
        this.toast.success(resp?.message, 'SUCCESS', 3000);
        return this.userService.loadUserData(true);
      })
    ).subscribe({
      next: () => {
        this.navigateTo();
      },
      error: (error) => this.toast.danger(error?.error?.message, 'ERROR', 3000)
    });
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

  navigateTo() {
    const role = this._tokenStorageService.getRole();
    switch (role) {
      case UserRole.ADMIN:
        this.router.navigate([ROUTES.ADMIN]);
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
