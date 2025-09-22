import {Component, ViewChild} from '@angular/core';
import {RegisterComponent} from "../register/register.component";
import {MembershipStudentService} from "../../../../services/membership-student.service";
import {CommonModule} from "@angular/common";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {AuthService, StudentRegistrationDTO} from "../../../../api-client";
import {loadStripe, Stripe} from "@stripe/stripe-js";
import {environment} from "@env";
import {MatButton} from "@angular/material/button";
import {NgToastService} from "ng-angular-popup";
import {PackagesComponent} from "../../../shared/components/packages/packages.component";
import {SubscriptionErrorHandlerService} from "../../../../services/subscription-error-handler.service";
import {DynamicBannerComponent} from "../../../shared/components/dynamic-banner/dynamic-banner.component";

@Component({
  selector: 'app-membership-student',
  standalone: true,
  imports: [
    PackagesComponent,
    RegisterComponent,
    CommonModule,
    MatProgressSpinnerModule,
    MatButton,
    DynamicBannerComponent
  ],
  templateUrl: './membership-student.component.html',
  styleUrl: './membership-student.component.scss'
})
export class MembershipStudentComponent {
  @ViewChild(RegisterComponent) registerComponent!: RegisterComponent;
  @ViewChild(PackagesComponent) packageComponent!: PackagesComponent;
  private stripePromise: Promise<Stripe | null> = loadStripe(environment.stripePublishableKey);

  loading = false;

  constructor(
    public membershipStudentService: MembershipStudentService,
    private _authService: AuthService,
    private toast: NgToastService,
    private errorHandler: SubscriptionErrorHandlerService,
  ) {
  }

  handlePayment(): void {
    this.loading = true;
    const registerForm: any = this.registerComponent.registerFormGroup.value;
    const selectedPackage: any = this.packageComponent.selectedCard;

    // Validate required data
    if (!registerForm || !selectedPackage?.id) {
      this.toast.danger('Ju lutemi plotësoni të gjitha fushat dhe zgjidhni një paketë', 'GABIM', 3000);
      this.loading = false;
      return;
    }

    const registerData: StudentRegistrationDTO = {
      ...registerForm,
      subscriptionPackageId: selectedPackage?.id,
    }

    this._authService.apiAuthRegisterStudentPost(registerData).subscribe({
      next: async (response) => {
        try {
          // Show success message for registration initiation
          this.toast.success('Regjistrimi u fillua me sukses. Ridrejtohet në pagesë...', 'SUKSES', 2000);

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
        console.error('Registration failed:', err);
        this.errorHandler.handleRegistrationError(err);
        this.loading = false;
      }
    });
  }

}
