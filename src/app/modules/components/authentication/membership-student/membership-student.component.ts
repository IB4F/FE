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

@Component({
  selector: 'app-membership-student',
  standalone: true,
  imports: [
    PackagesComponent,
    RegisterComponent,
    CommonModule,
    MatProgressSpinnerModule,
    MatButton
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
        this.toast.danger(err?.error?.error, 'GABIM', 3000);
        console.error('Registration failed:', err);
        this.loading = false;
      }
    });
  }
}
