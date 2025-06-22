import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {CommonModule} from "@angular/common";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatInputModule} from "@angular/material/input";
import {provideNativeDateAdapter} from "@angular/material/core";
import {passwordValidator} from "../../../../helpers/customValidators/check-password.validator";
import {MembershipStudentService} from "../../../../services/membership-student.service";
import {MatSelectModule} from "@angular/material/select";
import {Class, DetailsService} from "../../../../api-client";

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
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  providers: [provideNativeDateAdapter()]
})
export class  RegisterComponent implements OnInit {
  registerFormGroup!: FormGroup;
  hidePass = true;
  classesList: Class[] = [];

  constructor(
    private _formBuilder: FormBuilder,
    private membershipStudentService: MembershipStudentService,
    private _detailsService: DetailsService
  ) {
  }

  ngOnInit() {
    this.registerFormInitialize();
    this.loadCombos();
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

    this.registerFormGroup.statusChanges.subscribe(status => {
      this.membershipStudentService.setRegisterFormValid(status === 'VALID');
    });
  }

  private loadCombos() {
    this.getClassesList();
  }

  private getClassesList() {
    this._detailsService.apiDetailsGetClassGet().subscribe(res => {
      this.classesList = res;
    })
  }

}
