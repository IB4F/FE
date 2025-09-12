import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatTooltipModule} from "@angular/material/tooltip";
import {passwordValidator} from "../../../../helpers/customValidators/check-password.validator";
import {ChangePasswordDTO} from "../../../../api-client/model/changePasswordDTO";

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit{
  @Input() changePasswordFormGroup!: FormGroup;
  @Output() passwordChangeRequest = new EventEmitter<ChangePasswordDTO>();

  hidePass = true;
  hidePass1 = true;

  ngOnInit(): void {
    this.changePasswordFormGroup.get('currentPassword')?.setValidators([Validators.required, passwordValidator]);
    this.changePasswordFormGroup.get('newPassword')?.setValidators([Validators.required, passwordValidator]);
    this.changePasswordFormGroup.get('currentPassword')?.updateValueAndValidity();
    this.changePasswordFormGroup.get('newPassword')?.updateValueAndValidity();
  }

  emitPasswordChange() {
    if (this.changePasswordFormGroup.valid) {
      this.passwordChangeRequest.emit({
        currentPassword: this.changePasswordFormGroup.get('currentPassword')?.value,
        newPassword: this.changePasswordFormGroup.get('newPassword')?.value
      });
    }
  }
}
