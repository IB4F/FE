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
    MatSelect
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
  @Output() saveChanges = new EventEmitter<void>();

  onSaveChanges() {
    this.saveChanges.emit();
  }

  showClassField(): boolean {
    return this.userRole !== UserRole.ADMIN;
  }
}
