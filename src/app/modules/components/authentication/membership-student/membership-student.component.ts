import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {RegisterComponent} from "../register/register.component";
import {MembershipStudentService} from "../../../../services/membership-student.service";
import {CommonModule} from "@angular/common";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {AuthService, StudentRegistrationDTO} from "../../../../api-client";
import {MatButton} from "@angular/material/button";
import {NgToastService} from "ng-angular-popup";
import {StripeService} from '../../../../services/stripe.service';
import {PaddleService} from '../../../../services/paddle.service';
import {PackagesComponent} from "../../../shared/components/packages/packages.component";
import {SubscriptionErrorHandlerService} from "../../../../services/subscription-error-handler.service";
import {TranslatePipe} from '../../../../pipes/translate.pipe';
import {PaymentProviderSelectorComponent} from '../../../shared/components/payment-provider-selector/payment-provider-selector.component';
import {ManualPaymentInstructionsComponent, ManualPaymentDetails} from '../../../shared/components/manual-payment-instructions/manual-payment-instructions.component';

@Component({
  selector: 'app-membership-student',
  standalone: true,
  imports: [
    PackagesComponent,
    RegisterComponent,
    CommonModule,
    MatProgressSpinnerModule,
    MatButton,
    TranslatePipe,
    PaymentProviderSelectorComponent,
    ManualPaymentInstructionsComponent
  ],
  templateUrl: './membership-student.component.html',
  styleUrl: './membership-student.component.scss'
})
export class MembershipStudentComponent implements OnInit, OnDestroy {
  @ViewChild(RegisterComponent) registerComponent!: RegisterComponent;
  @ViewChild(PackagesComponent) packageComponent!: PackagesComponent;
  private stripeService = inject(StripeService);
  private paddleService = inject(PaddleService);

  loading = false;
  selectedProvider = 'Paddle';
  manualPaymentDetails: ManualPaymentDetails | null = null;
  manualPaymentProvider = '';

  activeStep = 0;
  private stepInterval: ReturnType<typeof setInterval> | null = null;
  private carouselPaused = false;

  constructor(
    public membershipStudentService: MembershipStudentService,
    private _authService: AuthService,
    private toast: NgToastService,
    private errorHandler: SubscriptionErrorHandlerService,
  ) {}

  ngOnInit() {
    this.stepInterval = setInterval(() => {
      if (!this.carouselPaused) {
        this.activeStep = (this.activeStep + 1) % 3;
      }
    }, 5000);
  }

  ngOnDestroy() {
    if (this.stepInterval) clearInterval(this.stepInterval);
  }

  pauseCarousel() { this.carouselPaused = true; }
  resumeCarousel() { this.carouselPaused = false; }
  setStep(i: number) { this.activeStep = i; }

  handlePayment(): void {
    this.loading = true;
    const registerForm: any = this.registerComponent.registerFormGroup.value;
    const selectedPackage: any = this.packageComponent.selectedCard;

    if (!registerForm || !selectedPackage?.id) {
      this.toast.danger('Ju lutemi plotësoni të gjitha fushat dhe zgjidhni një paketë', 'GABIM', 3000);
      this.loading = false;
      return;
    }

    const registerData: StudentRegistrationDTO = {
      ...registerForm,
      subscriptionPackageId: selectedPackage?.id,
      provider: this.providerToInt(this.selectedProvider)
    }

    this._authService.apiAuthRegisterStudentPost(registerData).subscribe({
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
            this.toast.success('Regjistrimi u fillua me sukses. Hapet pagesa...', 'SUKSES', 2000);
            try { await this.paddleService.openCheckout(txnId); } catch { this.loading = false; }
          } else if (txnId) {
            this.toast.success('Regjistrimi u fillua me sukses. Ridrejtohet në pagesë...', 'SUKSES', 2000);
            try { await this.stripeService.redirectToCheckout(txnId); } catch { this.loading = false; }
          } else {
            this.toast.danger('Gabim në inicializimin e pagesës', 'GABIM', 3000);
          }
        }
      },
      error: (err) => {
        console.error('Registration failed:', err);
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