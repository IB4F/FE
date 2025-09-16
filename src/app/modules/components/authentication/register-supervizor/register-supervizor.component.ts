import {Component, OnInit} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {
  MatDatepickerModule
} from "@angular/material/datepicker";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatTooltipModule} from "@angular/material/tooltip";
import {CommonModule} from "@angular/common";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {Router, RouterLink} from "@angular/router";
import {NgToastService} from "ng-angular-popup";
import {City, DetailsService, SupervisorApplicationDTO, SupervisorService} from "../../../../api-client";
import {MatOption} from "@angular/material/autocomplete";
import {MatSelect} from "@angular/material/select";

@Component({
  selector: 'app-register-supervizor',
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
    RouterLink,
    MatOption,
    MatSelect
  ],
  templateUrl: './register-supervizor.component.html',
  styleUrl: './register-supervizor.component.scss'
})
export class RegisterSupervizorComponent implements OnInit {
  registerSupervizorFormGroup!: FormGroup;
  citiesList: City [] = [];

  constructor(
    private _formBuilder: FormBuilder,
    private _supervisorService: SupervisorService,
    private router: Router,
    private toast: NgToastService,
    private _detailsService: DetailsService
  ) {
  }

  ngOnInit() {
    this.registerFormInitialize();
    this.loadCombos();
  }

  registerFormInitialize() {
    this.registerSupervizorFormGroup = this._formBuilder.group({
      schoolName: ['', Validators.required],
      contactPersonFirstName: ['', Validators.required],
      contactPersonLastName: ['', Validators.required],
      contactPersonEmail: ['', [Validators.required, Validators.email]],
      contactPersonPhone: ['', [Validators.required]],
      city: ['', Validators.required],
      address: ['', Validators.required],
      additionalInfo: ['']
    });
  }

  isRegisterFormValid(): boolean {
    return this.registerSupervizorFormGroup.valid;
  }

  private loadCombos() {
    this.getClassesList();
  }

  private getClassesList() {
    this._detailsService.apiDetailsGetCitiesGet().subscribe(res => {
      this.citiesList = res;
    })
  }

  submitRequest() {
    const applicationData: SupervisorApplicationDTO = {
      ...this.registerSupervizorFormGroup.value
    };
    this._supervisorService.apiSupervisorApplyPost(applicationData).subscribe({
      next: (resp) => {
        this.toast.success(resp?.message || 'Aplikimi u dërgua me sukses. Do të kontaktoheni së shpejti.', 'SUCCESS', 3000);
        this.registerSupervizorFormGroup.reset();
        this.router.navigate(['']);
      },
      error: (error) => {
        this.toast.danger(error?.error?.message || 'Ndodhi një gabim gjatë dërgimit të aplikimit.', 'ERROR', 3000);
      }
    });
  }
}
