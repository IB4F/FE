import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {passwordValidator} from "../../../../helpers/customValidators/check-password.validator";
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
  StudentRegistrationDTO,
  SubscriptionPackageService,
  FamilyPricingRequestDTO,
  FamilyPricingResponseDTO
} from "../../../../api-client";
import {NgToastService} from "ng-angular-popup";
import {MatOption} from "@angular/material/autocomplete";
import {MatSelect} from "@angular/material/select";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {SubscriptionErrorHandlerService} from "../../../../services/subscription-error-handler.service";
import {PhoneInputComponent} from "../../../shared/components/phone-input/phone-input.component";

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
    MatProgressSpinnerModule,
    MatTooltip,
    MatOption,
    MatSelect,
    PhoneInputComponent
  ],
  templateUrl: './register-family.component.html',
  styleUrl: './register-family.component.scss'
})
export class RegisterFamilyComponent implements OnInit {
  private stripePromise: Promise<Stripe | null> = loadStripe(environment.stripePublishableKey);
  loading = false;

  registerFamilyForm!: FormGroup;
  hidePass = true;

  numberOfChildren: number = 1;
  showChildrenForms: boolean = false;
  showParentForm: boolean = false;
  currentStep: 'memberCountAndPackage' | 'parentInfo' | 'childrenInfo' | 'payment' = 'memberCountAndPackage';

  classesList: Class[] = [];
  familyPricingData: FamilyPricingResponseDTO[] = [];
  pricingLoading: boolean = false;
  selectedPackage: any = null;

  constructor(
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private toast: NgToastService,
    private _detailsService: DetailsService,
    private _subscriptionPackageService: SubscriptionPackageService,
    private errorHandler: SubscriptionErrorHandlerService
  ) {
  }

  ngOnInit() {
    this.loadCombos();
    this.registerFamilyFormInitialize();
    this.calculateFamilyPricing();
  }

  private loadCombos() {
    this.getClassesList();
  }

  registerFamilyFormInitialize() {
    this.registerFamilyForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, this.phoneValidator]],
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

  incrementChildren() {
    if (this.numberOfChildren < 10) {
      this.numberOfChildren++;
      this.selectedPackage = null; // Reset package selection when count changes
      this.calculateFamilyPricing();
    }
  }

  decrementChildren() {
    if (this.numberOfChildren > 1) {
      this.numberOfChildren--;
      this.selectedPackage = null; // Reset package selection when count changes
      this.calculateFamilyPricing();
    }
  }

  proceedToParentInfo() {
    this.currentStep = 'parentInfo';
    this.showParentForm = true;
  }

  proceedToChildrenInfo() {
    this.currentStep = 'childrenInfo';
    this.showChildrenForms = true;
    this.updateChildrenForms();
  }

  proceedToPayment() {
    this.currentStep = 'payment';
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

  goBackToMemberCountAndPackage() {
    this.currentStep = 'memberCountAndPackage';
    this.showParentForm = false;
    this.showChildrenForms = false;
  }

  goBackToParentInfo() {
    this.currentStep = 'parentInfo';
    this.showChildrenForms = false;
  }

  goBackToChildrenInfo() {
    this.currentStep = 'childrenInfo';
  }

  selectPackage(pricing: FamilyPricingResponseDTO) {
    this.selectedPackage = {
      id: pricing.packageId || '',
      title: pricing.name || '',
      price: (pricing.totalPrice || 0) / 100,
      priceDisplay: pricing.totalPriceFormatted || `${(pricing.totalPrice || 0) / 100} €/muaj`,
      features: [],
      maxUsers: pricing.maxMembers
    };
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

  private calculateFamilyPricing() {
    this.pricingLoading = true;
    const request: FamilyPricingRequestDTO = {
      familyMembers: this.numberOfChildren
    };

    this._subscriptionPackageService.apiSubscriptionPackageFamilyCalculatePricePost(request).subscribe({
      next: (response) => {
        this.familyPricingData = response;
        this.pricingLoading = false;
      },
      error: (error) => {
        console.error('Error calculating family pricing:', error);
        this.toast.danger('Gabim në llogaritjen e çmimeve. Ju lutemi provoni përsëri.', 'GABIM', 3000);
        this.pricingLoading = false;
      }
    });
  }

  handlePayment(): void {
    this.loading = true;
    const registerForm: any = this.registerFamilyForm.value;
    
    // Validate required data
    if (!registerForm || !this.selectedPackage?.id) {
      this.toast.danger('Ju lutemi plotësoni të gjitha fushat dhe zgjidhni një paketë', 'GABIM', 3000);
      this.loading = false;
      return;
    }

    // Extract phone number in E164 format
    const phoneValue = registerForm.phoneNumber;
    const phoneNumber = phoneValue?.e164Number || phoneValue;

    const familyRegistrationDTO: FamilyRegistrationDTO = {
      ...registerForm,
      phoneNumber: phoneNumber,
      subscriptionPackageId: this.selectedPackage?.id,
    }

    this._authService.apiAuthRegisterFamilyPost(familyRegistrationDTO).subscribe({
      next: async (response) => {
        try {
          // Show success message for registration initiation
          this.toast.success('Regjistrimi i familjes u fillua me sukses. Ridrejtohet në pagesë...', 'SUKSES', 2000);
          
          const stripe = await this.stripePromise;
          if (stripe && response.sessionId) {
            await stripe.redirectToCheckout({
              sessionId: response.sessionId
            });
          } else {
            throw new Error('Stripe session not available');
          }
        } catch (error) {
          console.error('Stripe redirect failed:', error);
          this.toast.danger('Gabim në ridrejtimin e pagesës. Ju lutemi provoni përsëri.', 'GABIM', 3000);
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Family registration failed:', err);
        this.errorHandler.handleRegistrationError(err);
        this.loading = false;
      }
    });
  }

}

