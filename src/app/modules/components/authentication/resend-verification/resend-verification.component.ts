import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgToastService } from 'ng-angular-popup';
import { AuthService } from '../../../../api-client';
import {TranslatePipe} from '../../../../pipes/translate.pipe';

@Component({
  selector: 'app-resend-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    TranslatePipe],
  templateUrl: './resend-verification.component.html',
  styleUrl: './resend-verification.component.scss'
})
export class ResendVerificationComponent {
  form: FormGroup;
  isLoading = false;
  sent = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: NgToastService,
    public router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit() {
    if (this.form.invalid || this.isLoading) return;
    this.isLoading = true;
    this.authService.apiAuthResendVerificationPost({ email: this.form.value.email }).subscribe({
      next: () => {
        this.sent = true;
        this.isLoading = false;
      },
      error: () => {
        // Backend always returns 200 even if email not found — this handles network errors
        this.toast.danger('Diçka shkoi keq. Ju lutemi provoni përsëri.', 'GABIM', 4000);
        this.isLoading = false;
      }
    });
  }
}