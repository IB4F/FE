import { Component, OnInit } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatRadioModule } from "@angular/material/radio";
import { MembershipStudentService } from "../../../../../services/membership-student.service";
import { PaymentService } from "../../../../../api-client";

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
  isBestValue?: boolean; // Added for the "best value" indicator
}

type BillingCycle = 'annual' | 'monthly';

@Component({
  selector: 'app-packege-cards',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatRadioModule
  ],
  templateUrl: './packege-cards.component.html',
  styleUrl: './packege-cards.component.scss'
})
export class PackegeCardsComponent implements OnInit {
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
    private _paymentInfoService: PaymentService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
    this.loadInfo();
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
    this._paymentInfoService.apiPaymentsGet().subscribe(res => {
      this.paymentInfo = res;
      this.mapApiDataToCards();
    });
  }

  private mapApiDataToCards() {
    // Clear existing cards
    this.cards = { annual: [], monthly: [] };

    // Define feature templates for each package type in Albanian
    const featureTemplates: Record<string, Feature[]> = {
      "Bazë": [
        { text: '3 mësime video HD', available: true },
        { text: '1 provim zyrtar', available: true },
        { text: 'Kuize praktike', available: false },
        { text: 'Mbështetje me email', available: false }
      ],
      "Standarde": [
        { text: '10 mësime video HD', available: true },
        { text: '3 provime zyrtare', available: true },
        { text: 'Kuize praktike', available: true },
        { text: 'Mbështetje me email prioritare', available: true }
      ],
      "Premium": [
        { text: 'Mësime video HD të pakufizuara', available: true },
        { text: '5 provime zyrtare', available: true },
        { text: 'Kuize praktike', available: true },
        { text: 'Mbështetje prioritare 24/7', available: true },
        { text: 'Sesione me tutor personal', available: true }
      ]
    };

    // Map API data to cards
    this.paymentInfo.forEach(item => {
      const card: Card = {
        id: item.id,
        title: item.name,
        price: item.price / 100,
        priceDisplay: this.getPriceDisplay(item.price / 100, item.type),
        features: [...featureTemplates[item.name]]
      };

      // Mark "Standarde" as the best value
      if (item.name === 'Standarde') {
        card.isBestValue = true;
      }

      if (item.type === 'yearly') {
        this.cards.annual.push(card);
      } else if (item.type === 'monthly') {
        this.cards.monthly.push(card);
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
}
