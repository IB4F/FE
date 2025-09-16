import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SubscriptionPackageService, SubscriptionService, SupervisorSubscriptionRequestDTO } from '../../../../api-client';
import { BillingInterval } from '../../../shared/constant/enums';
import { NgToastService } from 'ng-angular-popup';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '@env';

interface Feature {
  text: string;
  available: boolean;
}

interface Card {
  id: string;
  title: string;
  price: number;
  priceDisplay: string;
  features: Feature[];
  isBestValue?: boolean;
  maxUsers?: number;
}

type BillingCycle = 'annual' | 'monthly';

@Component({
  selector: 'app-supervisor-subscription-packages',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatRadioModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './supervisor-subscription-packages.component.html',
  styleUrl: './supervisor-subscription-packages.component.scss'
})
export class SupervisorSubscriptionPackagesComponent implements OnInit {
  supervisorApplicationId: string | null = null;
  cards: Record<BillingCycle, Card[]> = {
    annual: [],
    monthly: []
  };
  selectedCard: Card | null = null;
  packageForm!: FormGroup;
  paymentInfo: any[] = [];
  loading = false;
  private stripePromise: Promise<Stripe | null> = loadStripe(environment.stripePublishableKey);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private subscriptionPackageService: SubscriptionPackageService,
    private subscriptionService: SubscriptionService,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.supervisorApplicationId = this.route.snapshot.queryParams['supervisorApplicationId'];
    
    if (!this.supervisorApplicationId) {
      this.toast.danger('ID-ja e aplikimit të supervizorit nuk është e vlefshme', 'GABIM', 3000);
      this.router.navigate(['/hyr']);
      return;
    }

    this.initForm();
    this.setupFormListeners();
    this.loadPackages();
  }

  initForm() {
    this.packageForm = this.fb.group({
      billingCycle: ['annual' as BillingCycle]
    });
  }

  setupFormListeners() {
    this.packageForm.valueChanges.subscribe(() => {
      this.selectedCard = null;
    });
  }

  get currentCards(): Card[] {
    const billingCycle = this.packageForm.value.billingCycle as BillingCycle;
    return this.cards[billingCycle];
  }

  selectCard(card: Card) {
    this.selectedCard = card;
  }

  private loadPackages() {
    this.subscriptionPackageService.apiSubscriptionPackageUserTypeUserTypeGet('Supervisor').subscribe({
      next: (res) => {
        this.paymentInfo = res;
        this.mapApiDataToCards();
      },
      error: (error) => {
        console.error('Error loading packages:', error);
        this.toast.danger('Gabim në ngarkimin e paketave', 'GABIM', 3000);
      }
    });
  }

  private mapApiDataToCards() {
    // Clear existing cards
    this.cards = {annual: [], monthly: []};

    // Define feature templates for supervisor packages in Albanian
    const featureTemplates: Record<string, Feature[]> = {
      "Bazë": [
        {text: 'Menaxhim deri 10 nxënës', available: true},
        {text: 'Raportet bazë të progresit', available: true},
        {text: 'Komunikim me nxënësit', available: true},
        {text: 'Mbështetje me email', available: false}
      ],
      "Standarde": [
        {text: 'Menaxhim deri 25 nxënës', available: true},
        {text: 'Raportet e detajuara të progresit', available: true},
        {text: 'Komunikim me nxënësit dhe prindërit', available: true},
        {text: 'Mbështetje me email prioritare', available: true},
        {text: 'Analizë e performancës', available: true}
      ],
      "Premium": [
        {text: 'Menaxhim i pakufizuar i nxënësve', available: true},
        {text: 'Raportet e avancuara dhe dashboard', available: true},
        {text: 'Komunikim me të gjithë palët', available: true},
        {text: 'Mbështetje prioritare 24/7', available: true},
        {text: 'Analizë e avancuar e performancës', available: true},
        {text: 'Mjetet e personalizimit', available: true}
      ]
    };

    // Map API data to cards
    this.paymentInfo.forEach(item => {
      const packageName = item.name || '';
      const features = featureTemplates[packageName] || [
        {text: 'Menaxhim i nxënësve', available: true},
        {text: 'Raportet e progresit', available: true},
        {text: 'Komunikim', available: true},
        {text: 'Mbështetje', available: true}
      ];

      // Create cards for both monthly and yearly billing intervals
      const monthlyCard: Card = {
        id: item.id,
        title: item.name || '',
        price: (item.monthlyPrice || 0) / 100,
        priceDisplay: this.getPriceDisplay((item.monthlyPrice || 0) / 100, 'monthly'),
        features: [...features],
        maxUsers: item.maxUsers
      };

      const yearlyCard: Card = {
        id: item.id,
        title: item.name || '',
        price: (item.yearlyPrice || 0) / 100,
        priceDisplay: this.getPriceDisplay((item.yearlyPrice || 0) / 100, 'yearly'),
        features: [...features],
        maxUsers: item.maxUsers
      };

      // Mark "Standarde" as the best value
      if (item.name?.includes('Standard')) {
        monthlyCard.isBestValue = true;
        yearlyCard.isBestValue = true;
      }

      // Add cards based on billing interval
      const billingInterval = item.billingInterval;
      if (billingInterval === BillingInterval.Month || billingInterval === 'MONTHLY' || billingInterval === 3) {
        this.cards.monthly.push(monthlyCard);
      } else if (billingInterval === BillingInterval.Year || billingInterval === 'YEARLY' || billingInterval === 4) {
        this.cards.annual.push(yearlyCard);
      } else {
        // If billing interval is not specified, add both
        this.cards.monthly.push(monthlyCard);
        this.cards.annual.push(yearlyCard);
      }
    });

    // Sort cards to ensure "Standarde" (best value) is in the middle
    this.cards.annual.sort((a, b) => {
      const order = ["Bazë", "Standarde", "Premium"];
      return order.indexOf(a.title) - order.indexOf(b.title);
    });
    this.cards.monthly.sort((a, b) => {
      const order = ["Bazë", "Standarde", "Premium"];
      return order.indexOf(a.title) - order.indexOf(b.title);
    });
  }

  private getPriceDisplay(price: number, type: string): string {
    return type === 'yearly'
      ? `${price} €/vit`
      : `${price} €/muaj`;
  }

  continueWithPayment(): void {
    if (!this.selectedCard || !this.supervisorApplicationId) {
      this.toast.danger('Ju lutemi zgjidhni një paketë', 'GABIM', 3000);
      return;
    }

    this.loading = true;

    const billingCycle = this.packageForm.value.billingCycle as BillingCycle;
    const billingInterval = billingCycle === 'annual' ? BillingInterval.Year : BillingInterval.Month;

    const request: SupervisorSubscriptionRequestDTO = {
      supervisorApplicationId: this.supervisorApplicationId,
      subscriptionPackageId: this.selectedCard.id,
      billingInterval: billingInterval
    };

    this.subscriptionService.apiSubscriptionCreateSupervisorPost(request).subscribe({
      next: async (response) => {
        try {
          this.toast.success('Subskriptioni u krijua me sukses. Ridrejtohet në pagesë...', 'SUKSES', 2000);

          const stripe = await this.stripePromise;
          if (stripe && response.sessionId) {
            await stripe.redirectToCheckout({
              sessionId: response.sessionId
            });
          } else {
            this.toast.danger('Gabim në inicializimin e pagesës', 'GABIM', 3000);
            this.loading = false;
          }
        } catch (error) {
          console.error('Stripe error:', error);
          this.toast.danger('Gabim në procesin e pagesës', 'GABIM', 3000);
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Subscription creation error:', error);
        this.toast.danger('Gabim në krijimin e subskriptionit', 'GABIM', 3000);
        this.loading = false;
      }
    });
  }

  isContinueDisabled(): boolean {
    return !this.selectedCard || this.loading;
  }
}
