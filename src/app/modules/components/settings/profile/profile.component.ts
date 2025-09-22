import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatOption, provideNativeDateAdapter} from "@angular/material/core";
import {MatSelect} from "@angular/material/select";
import {Class} from "../../../../api-client";
import {UserRole} from "../../../shared/constant/enums";
import {PhoneInputComponent} from "../../../shared/components/phone-input/phone-input.component";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatOption,
    MatSelect,
    PhoneInputComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  providers: [provideNativeDateAdapter()]
})
export class ProfileComponent {
  @Input() profileFormGroup!: FormGroup;
  @Input() userInitials: string | null = null;
  @Input() fullName: string = '';
  @Input() userRole: string | null = null;
  @Input() classList: Class [] = [];
  @Input() childrenCount: number | null = null;
  @Input() studentsCount: number | null = null;
  @Output() saveChanges = new EventEmitter<void>();

  onSaveChanges() {
    this.saveChanges.emit();
  }

  showClassField(): boolean {
    return this.userRole !== UserRole.ADMIN;
  }

  shouldShowCount(): boolean {
    return this.userRole === UserRole.SUPERVISOR || this.userRole === UserRole.FAMILY;
  }

  getCountLabel(): string {
    if (this.userRole === UserRole.SUPERVISOR) {
      return 'Numri i studentëve';
    } else if (this.userRole === UserRole.FAMILY) {
      return 'Numri i fëmijëve';
    }
    return '';
  }

  getCountValue(): number | null {
    if (this.userRole === UserRole.SUPERVISOR) {
      return this.studentsCount;
    } else if (this.userRole === UserRole.FAMILY) {
      return this.childrenCount;
    }
    return null;
  }

  // Custom validator for phone numbers
  phoneValidator(control: any) {
    if (!control.value) {
      return null;
    }
    
    // Check if the phone number object has a valid format
    if (control.value && control.value.e164Number) {
      const phoneNumber = control.value.e164Number;
      // Check if it's a valid international number (at least 10 digits after country code)
      if (phoneNumber.length >= 10) {
        return null; // Valid
      }
    }
    
    return { invalidPhone: true };
  }
}
