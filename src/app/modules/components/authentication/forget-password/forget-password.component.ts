import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {CommonModule} from "@angular/common";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatDialogRef} from "@angular/material/dialog";
import {AuthService, ForgotPasswordDTO} from "../../../../api-client/auth";
import {NgToastService} from "ng-angular-popup";

@Component({
  selector: 'app-forget-password',
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
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss'
})
export class ForgetPasswordComponent implements OnInit {
  emailForm!: FormGroup;

  constructor(
    private _formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<ForgetPasswordComponent>,
    private _authService: AuthService,
    private toast: NgToastService,
  ) {
  }

  ngOnInit() {
    this.initaliazeForm();
  }

  initaliazeForm() {
    this.emailForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  isFormvalid(): boolean {
    return this.emailForm.valid;
  }

  closeModal() {
    this.dialogRef.close();
  }

  sendEmail() {
    const email: ForgotPasswordDTO = {email: this.emailForm.get('email')?.value};
    this._authService.requestResetPost(email).subscribe({
      next: (resp) => {
        console.log(resp)
        this.toast.success('Email-i u dergua me sukses!', 'SUKSES', 5000);
        this.closeModal();
      },
      error: (err) => {
        this.toast.danger('Somthing went Wrong!', 'ERROR', 5000);
      }
    })
  }
}
