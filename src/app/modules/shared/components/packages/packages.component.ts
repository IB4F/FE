import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {MatRadioModule} from "@angular/material/radio";
import {CommonModule} from "@angular/common";
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {MembershipStudentService} from "../../../../services/membership-student.service";
import {SubscriptionPackageService, FamilyPricingResponseDTO} from "../../../../api-client";
import {BillingInterval} from "../../constant/enums";

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
  selector: 'app-packages',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatRadioModule
  ],
  templateUrl: './packages.component.html',
  styleUrl: './packages.component.scss'
})
export class PackagesComponent implements OnChanges {
  @Input() userType!: string;
  @Input() familyPricingData: FamilyPricingResponseDTO[] = [];

  cards: Record<BillingCycle, Card[]> = {
    annual: [],
    monthly: []
  };

  selectedCard: Card | null = null;
  packegeForm!: FormGroup;
  paymentInfo: any[] = [];

  constructor(
    private fb: FormBuilder,
    private membershipStudentService: MembershipStudentService,
    private subscriptionPackageService: SubscriptionPackageService
  ) {
  }

  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
    this.loadInfo();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['familyPricingData'] && this.familyPricingData.length > 0) {
      this.mapFamilyPricingToCards();
    }
  }

  initForm() {
    this.packegeForm = this.fb.group({
      billingCycle: ['annual' as BillingCycle]
    });
  }

  setupFormListeners() {
    this.packegeForm.valueChanges.subscribe(() => {
      this.selectedCard = null;
      this.membershipStudentService.setSelectedPackage(null);
    });
  }

  get currentCards(): Card[] {
    const billingCycle = this.packegeForm.value.billingCycle as BillingCycle;
    return this.cards[billingCycle];
  }

  selectCard(card: Card) {
    this.selectedCard = card;
    this.membershipStudentService.setSelectedPackage(card);
  }

  private loadInfo() {
    this.getPaymentInfo();
  }

  private getPaymentInfo() {
    this.subscriptionPackageService.apiSubscriptionPackageUserTypeUserTypeGet(this.userType).subscribe(res => {
      this.paymentInfo = res;
      this.mapApiDataToCards();
    });
  }

  private mapApiDataToCards() {
    // Clear existing cards
    this.cards = {annual: [], monthly: []};

    // Define feature templates for each package type in Albanian
    const featureTemplates: Record<string, Feature[]> = {
      "Bazë": [
        {text: '3 mësime video HD', available: true},
        {text: '1 provim zyrtar', available: true},
        {text: 'Kuize praktike', available: false},
        {text: 'Mbështetje me email', available: false}
      ],
      "Standarde": [
        {text: '10 mësime video HD', available: true},
        {text: '3 provime zyrtare', available: true},
        {text: 'Kuize praktike', available: true},
        {text: 'Mbështetje me email prioritare', available: true}
      ],
      "Premium": [
        {text: 'Mësime video HD të pakufizuara', available: true},
        {text: '5 provime zyrtare', available: true},
        {text: 'Kuize praktike', available: true},
        {text: 'Mbështetje prioritare 24/7', available: true},
        {text: 'Sesione me tutor personal', available: true}
      ]
    };

    // Map API data to cards
    this.paymentInfo.forEach(item => {
      // Get features for this package, with fallback to default features
      const packageName = item.name || '';
      const features = featureTemplates[packageName] || [
        {text: 'Mësime video HD', available: true},
        {text: 'Provime zyrtare', available: true},
        {text: 'Kuize praktike', available: true},
        {text: 'Mbështetje me email', available: true}
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
      if (item.name.includes('Standard')) {
        monthlyCard.isBestValue = true;
        yearlyCard.isBestValue = true;
      }

      // Add cards based on billing interval
      // Handle both string and numeric billing intervals
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

    // Sort cards to ensure "Standarde" (best value) is in the middle if applicable,
    // assuming there are always three packages: Bazë, Standarde, Premium.
    // This sorting ensures the "best-value" class is applied to the middle card.
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

  private mapFamilyPricingToCards() {
    // Clear existing cards
    this.cards = {annual: [], monthly: []};

    // Define feature templates for each package type in Albanian
    const featureTemplates: Record<string, Feature[]> = {
      "Bazë": [
        {text: '3 mësime video HD', available: true},
        {text: '1 provim zyrtar', available: true},
        {text: 'Kuize praktike', available: false},
        {text: 'Mbështetje me email', available: false}
      ],
      "Standarde": [
        {text: '10 mësime video HD', available: true},
        {text: '3 provime zyrtare', available: true},
        {text: 'Kuize praktike', available: true},
        {text: 'Mbështetje me email prioritare', available: true}
      ],
      "Premium": [
        {text: 'Mësime video HD të pakufizuara', available: true},
        {text: '5 provime zyrtare', available: true},
        {text: 'Kuize praktike', available: true},
        {text: 'Mbështetje prioritare 24/7', available: true},
        {text: 'Sesione me tutor personal', available: true}
      ]
    };

    // Map family pricing data to cards
    this.familyPricingData.forEach(pricing => {
      const packageName = pricing.name || '';
      const features = featureTemplates[packageName] || [
        {text: 'Mësime video HD', available: true},
        {text: 'Provime zyrtare', available: true},
        {text: 'Kuize praktike', available: true},
        {text: 'Mbështetje me email', available: true}
      ];

      // Create cards for both monthly and yearly billing intervals
      const monthlyCard: Card = {
        id: pricing.packageId || '',
        title: pricing.name || '',
        price: (pricing.totalPrice || 0) / 100,
        priceDisplay: pricing.totalPriceFormatted || `${(pricing.totalPrice || 0) / 100} €/muaj`,
        features: [...features],
        maxUsers: pricing.maxMembers
      };

      const yearlyCard: Card = {
        id: pricing.packageId || '',
        title: pricing.name || '',
        price: (pricing.totalPrice || 0) / 100,
        priceDisplay: pricing.totalPriceFormatted || `${(pricing.totalPrice || 0) / 100} €/vit`,
        features: [...features],
        maxUsers: pricing.maxMembers
      };

      // Mark "Standarde" as the best value
      if (pricing.name?.includes('Standard')) {
        monthlyCard.isBestValue = true;
        yearlyCard.isBestValue = true;
      }

      // Add cards based on billing interval
      const billingInterval = pricing.billingInterval;
      if (billingInterval === BillingInterval.Month) {
        this.cards.monthly.push(monthlyCard);
      } else if (billingInterval === BillingInterval.Year) {
        this.cards.annual.push(yearlyCard);
      } else {
        // If billing interval is not specified, add both
        this.cards.monthly.push(monthlyCard);
        this.cards.annual.push(yearlyCard);
      }
    });

    // Sort cards to ensure "Standarde" (best value) is in the middle if applicable
    this.cards.annual.sort((a, b) => {
      const order = ["Bazë", "Standarde", "Premium"];
      return order.indexOf(a.title) - order.indexOf(b.title);
    });
    this.cards.monthly.sort((a, b) => {
      const order = ["Bazë", "Standarde", "Premium"];
      return order.indexOf(a.title) - order.indexOf(b.title);
    });
  }
}
