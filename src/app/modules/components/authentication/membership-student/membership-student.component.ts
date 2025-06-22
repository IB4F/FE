import {Component, ViewChild} from '@angular/core';
import {PackegeCardsComponent} from "./packege-cards/packege-cards.component";
import {RegisterComponent} from "../register/register.component";
import {MembershipStudentService} from "../../../../services/membership-student.service";
import {CommonModule} from "@angular/common";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {AuthService, StudentRegistrationDTO} from "../../../../api-client";
import {loadStripe, Stripe} from "@stripe/stripe-js";
import {environment} from "../../../../../envirorment/envirorment";

@Component({
  selector: 'app-membership-student',
  standalone: true,
  imports: [
    PackegeCardsComponent,
    RegisterComponent,
    CommonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './membership-student.component.html',
  styleUrl: './membership-student.component.scss'
})
export class MembershipStudentComponent {
  @ViewChild(RegisterComponent) registerComponent!: RegisterComponent;
  @ViewChild(PackegeCardsComponent) packageComponent!: PackegeCardsComponent;
  private stripePromise: Promise<Stripe | null> = loadStripe(environment.stripePublishableKey);

  loading = false;

  constructor(
    public membershipStudentService: MembershipStudentService,
    private _authService: AuthService,
  ) {
  }

  handlePayment(): void {
    this.loading = true;
    const registerForm: any = this.registerComponent.registerFormGroup.value;
    const selectedPackage: any = this.packageComponent.selectedCard;
    const registerData: StudentRegistrationDTO = {
      ...registerForm,
      planId: selectedPackage?.id,
    }

    if (!registerData) {
      this.loading = false;
      return;
    }

    this._authService.registerStudentPost(registerData).subscribe({
      next: async (response) => {
        const stripe = await this.stripePromise;
        await stripe?.redirectToCheckout({
          sessionId: response.sessionId
        });
      },
      error: (err) => {
        console.error('Registration failed:', err);
        this.loading = false;
      }
    });
  }
}
