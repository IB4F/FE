import {Component, inject, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {passwordValidator} from "../../../../helpers/customValidators/check-password.validator";
import {CommonModule} from "@angular/common";
import {MatTooltip} from "@angular/material/tooltip";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {StripeService} from "../../../../services/stripe.service";
import {PaddleService} from '../../../../services/paddle.service';
import {
  AuthService,
  Class,
  DetailsService,
  FamilyRegistrationDTO,
  SubscriptionPackageService,
  FamilyPricingRequestDTO,
  FamilyPricingResponseDTO
} from "../../../../api-client";
import {BillingInterval} from '../../../shared/constant/enums';
import {NgToastService} from "ng-angular-popup";
import {SubscriptionErrorHandlerService} from "../../../../services/subscription-error-handler.service";
import {PhoneInputComponent} from "../../../shared/components/phone-input/phone-input.component";
import {TranslatePipe} from '../../../../pipes/translate.pipe';
import {PaymentProviderSelectorComponent} from '../../../shared/components/payment-provider-selector/payment-provider-selector.component';
import {ManualPaymentInstructionsComponent, ManualPaymentDetails} from '../../../shared/components/manual-payment-instructions/manual-payment-instructions.component';

@Component({
  selector: 'app-register-family',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatTooltip,
    PhoneInputComponent,
    TranslatePipe,
    PaymentProviderSelectorComponent,
    ManualPaymentInstructionsComponent
  ],
  templateUrl: './register-family.component.html',
  styleUrl: './register-family.component.scss'
})
export class RegisterFamilyComponent implements OnInit {
  private stripeService = inject(StripeService);
  private paddleService = inject(PaddleService);
  loading = false;
  selectedProvider = 'Paddle';
  manualPaymentDetails: ManualPaymentDetails | null = null;
  manualPaymentProvider = '';

  registerFamilyForm!: FormGroup;
  hidePass = true;

  numberOfChildren: number = 1;
  showChildrenForms: boolean = false;
  showParentForm: boolean = false;
  currentStep: 'memberCountAndPackage' | 'parentInfo' | 'childrenInfo' | 'payment' = 'memberCountAndPackage';

  classesList: Class[] = [];
  familyPricingData: FamilyPricingResponseDTO[] = [];
  familyBillingCycle: 'monthly' | 'annual' = 'annual';
  pricingLoading: boolean = false;
  selectedPackage: any = null;

  get filteredFamilyPricingData(): FamilyPricingResponseDTO[] {
    const target = this.familyBillingCycle === 'annual' ? BillingInterval.Year : BillingInterval.Month;
    return this.familyPricingData.filter(p => p.billingInterval === target);
  }

  get isFamilyAnnual(): boolean {
    return this.familyBillingCycle === 'annual';
  }

  setFamilyBillingCycle(cycle: 'monthly' | 'annual') {
    this.familyBillingCycle = cycle;
    this.selectedPackage = null;
  }

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
      provider: this.providerToInt(this.selectedProvider)
    }

    this._authService.apiAuthRegisterFamilyPost(familyRegistrationDTO).subscribe({
      next: async (response) => {
        this.loading = false;
        const session = response.sessionId;
        const isManual = session?.isManual ?? false;

        if (isManual) {
          this.manualPaymentDetails = session.manualDetails;
          this.manualPaymentProvider = this.resolveProviderName(session.provider);
          this.toast.success('Regjistrimi u krye. Shihni instruksionet e transfertës.', 'SUKSES', 3000);
        } else {
          const txnId = typeof session === 'string' ? session : session?.sessionId;
          const isPaddle = session?.provider === 3 || this.selectedProvider === 'Paddle';
          if (txnId && isPaddle) {
            this.toast.success('Regjistrimi i familjes u fillua me sukses. Hapet pagesa...', 'SUKSES', 2000);
            try { await this.paddleService.openCheckout(txnId); } catch { this.loading = false; }
          } else if (txnId) {
            this.toast.success('Regjistrimi i familjes u fillua me sukses. Ridrejtohet në pagesë...', 'SUKSES', 2000);
            try { await this.stripeService.redirectToCheckout(txnId); } catch { this.loading = false; }
          } else {
            this.toast.danger('Gabim në inicializimin e pagesës', 'GABIM', 3000);
          }
        }
      },
      error: (err) => {
        console.error('Family registration failed:', err);
        this.errorHandler.handleRegistrationError(err);
        this.loading = false;
      }
    });
  }

  private providerToInt(provider: string): number {
    const map: Record<string, number> = { Stripe: 1, Novalnet: 2, Paddle: 3, BKT: 4, Raiffeisen: 5 };
    return map[provider] ?? 1;
  }

  private resolveProviderName(provider: number | string): string {
    if (typeof provider === 'string') return provider;
    const map: Record<number, string> = { 1: 'Stripe', 2: 'Novalnet', 3: 'Paddle', 4: 'BKT', 5: 'Raiffeisen' };
    return map[provider] ?? 'Bank';
  }

}

