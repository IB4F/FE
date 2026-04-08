import {Component, inject, ViewChild} from '@angular/core';
import {RegisterComponent} from "../register/register.component";
import {MembershipStudentService} from "../../../../services/membership-student.service";
import {CommonModule} from "@angular/common";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {AuthService, StudentRegistrationDTO} from "../../../../api-client";
import {StripeService} from "../../../../services/stripe.service";
import {MatButton} from "@angular/material/button";
import {NgToastService} from "ng-angular-popup";
import {PackagesComponent} from "../../../shared/components/packages/packages.component";
import {SubscriptionErrorHandlerService} from "../../../../services/subscription-error-handler.service";
import {DynamicBannerComponent} from "../../../shared/components/dynamic-banner/dynamic-banner.component";
import {TranslatePipe} from '../../../../pipes/translate.pipe';

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
  ,
    TranslatePipe],
  templateUrl: './membership-student.component.html',
  styleUrl: './membership-student.component.scss'
})
export class MembershipStudentComponent {
  @ViewChild(RegisterComponent) registerComponent!: RegisterComponent;
  @ViewChild(PackagesComponent) packageComponent!: PackagesComponent;
  private stripeService = inject(StripeService);

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

          if (!response.sessionId) throw new Error('Stripe session not available');
          await this.stripeService.redirectToCheckout(response.sessionId);
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
