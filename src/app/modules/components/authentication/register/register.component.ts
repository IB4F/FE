import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {CommonModule} from "@angular/common";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatTooltipModule} from "@angular/material/tooltip";
import {Router, RouterLink} from "@angular/router";
import {MatInputModule} from "@angular/material/input";
import {provideNativeDateAdapter} from "@angular/material/core";
import {passwordValidator} from "../../../../helpers/customValidators/check-password.validator";
import {AuthService, StudentRegistrationDTO} from "../../../../api-client/auth";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    CommonModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  providers: [provideNativeDateAdapter()]
})
export class RegisterComponent implements OnInit {
  registerFormGroup!: FormGroup;
  hidePass = true;

  constructor(
    private _formBuilder: FormBuilder,
    private router: Router,
    private _authService: AuthService
  ) {
  }

  ngOnInit() {
    this.registerFormInitialize();
  }

  registerFormInitialize() {
    this.registerFormGroup = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      school: ['', Validators.required],
      currentClass: ['', Validators.required],
      dateOfBirth: [null, Validators.required],
      password: ['', [Validators.required, passwordValidator]]
    });
  }

  isRegisterFormValid(): boolean {
    return this.registerFormGroup.valid;
  }

  registerSubmit() {
    const registerData: StudentRegistrationDTO = {
      ...this.registerFormGroup.value
    };
    this._authService.registerStudentPost(registerData).subscribe({
      next: (resp) => {
        console.log(resp)
        // this.toast.success({ detail: "SUCCESS", summary: resp.message, duration: 5000, position: 'topCenter' });
        this.registerFormGroup.reset();
        this.router.navigate(['hyr']);
      },
      error: (error) => {
        console.log(error);
        // this.toast.error({ detail: "ERROR", summary: "Something went wrong!", duration: 5000, position: 'topCenter' });
      }
    });
  }
}
