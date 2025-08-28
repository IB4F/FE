import {Component, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {passwordValidator} from "../../../../helpers/customValidators/check-password.validator";
import {PackagesComponent} from "../../../shared/components/packages/packages.component";
import {CommonModule} from "@angular/common";
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from "@angular/material/icon";
import {MatTooltip} from "@angular/material/tooltip";
import {loadStripe, Stripe} from "@stripe/stripe-js";
import {environment} from "@env";
import {
  AuthService,
  Class,
  DetailsService,
  FamilyRegistrationDTO,
  StudentRegistrationDTO
} from "../../../../api-client";
import {NgToastService} from "ng-angular-popup";
import {MatOption} from "@angular/material/autocomplete";
import {MatSelect} from "@angular/material/select";

@Component({
  selector: 'app-register-family',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PackagesComponent,
    MatTooltip,
    MatOption,
    MatSelect
  ],
  templateUrl: './register-family.component.html',
  styleUrl: './register-family.component.scss'
})
export class RegisterFamilyComponent implements OnInit {
  @ViewChild(PackagesComponent) packageComponent!: PackagesComponent;
  private stripePromise: Promise<Stripe | null> = loadStripe(environment.stripePublishableKey);
  loading = false;

  registerFamilyForm!: FormGroup;
  hidePass = true;

  numberOfChildren: number = 1;
  showChildrenForms: boolean = false;

  classesList: Class[] = [];

  constructor(
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private toast: NgToastService,
    private _detailsService: DetailsService
  ) {
  }

  ngOnInit() {
    this.loadCombos();
    this.registerFamilyFormInitialize();
  }

  private loadCombos() {
    this.getClassesList();
  }

  registerFamilyFormInitialize() {
    this.registerFamilyForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      password: ['', [Validators.required, passwordValidator]],
      familyMembers: this._formBuilder.array([])
    });
  }

  private createFamilyMemberFormGroup(): FormGroup {
    return this._formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      currentClass: ['', Validators.required]
    });
  }

  get familyMembers(): FormArray {
    return this.registerFamilyForm.get('familyMembers') as FormArray;
  }

  // Il metodo per incrementare/decrementare rimane lo stesso,
  // ma non aggiornerà più il FormArray in tempo reale.
  incrementChildren() {
    if (this.numberOfChildren < 10) {
      this.numberOfChildren++;
    }
  }

  decrementChildren() {
    if (this.numberOfChildren > 1) {
      this.numberOfChildren--;
    }
  }

  // Questo è il nuovo metodo che gestirà la conferma
  confirmChildrenCount() {
    this.showChildrenForms = true;
    this.updateChildrenForms();
  }

  // Questo metodo aggiorna il FormArray in base a numberOfChildren
  private updateChildrenForms() {
    // Prima svuota l'array
    while (this.familyMembers.length !== 0) {
      this.familyMembers.removeAt(0);
    }
    // Poi lo ripopola
    for (let i = 0; i < this.numberOfChildren; i++) {
      this.familyMembers.push(this.createFamilyMemberFormGroup());
    }
  }

  private getClassesList() {
    this._detailsService.apiDetailsGetClassGet().subscribe(res => {
      this.classesList = res;
    })
  }

  handlePayment(): void {
    this.loading = true;
    const registerForm: any = this.registerFamilyForm.value;
    const selectedPackage: any = this.packageComponent.selectedCard;
    const familyRegistrationDTO: FamilyRegistrationDTO = {
      ...registerForm,
      planId: selectedPackage?.id,
    }

    if (!familyRegistrationDTO) {
      this.loading = false;
      return;
    }

    this._authService.apiAuthRegisterFamilyPost(familyRegistrationDTO).subscribe({
      next: async (response) => {
        const stripe = await this.stripePromise;
        await stripe?.redirectToCheckout({
          sessionId: response.sessionId
        });
      },
      error: (err) => {
        this.toast.danger(err?.error?.error, 'GABIM', 3000);
        console.error('Registration failed:', err);
        this.loading = false;
      }
    });
  }
}
