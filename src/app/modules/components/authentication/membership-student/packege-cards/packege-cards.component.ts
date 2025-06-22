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

    // Define feature templates for each package type
    const featureTemplates: Record<string, Feature[]> = {
      "Bazë": [
        { text: '3 HD video lessons', available: true },
        { text: '1 Official exam', available: true },
        { text: 'Practice quizzes', available: false },
        { text: 'Email support', available: false }
      ],
      "Standarde": [
        { text: '10 HD video lessons', available: true },
        { text: '3 Official exams', available: true },
        { text: 'Practice quizzes', available: true },
        { text: 'Priority email support', available: true }
      ],
      "Premium": [
        { text: 'Unlimited HD video lessons', available: true },
        { text: '5 Official exams', available: true },
        { text: 'Practice quizzes', available: true },
        { text: '24/7 Priority support', available: true },
        { text: 'Personal tutor sessions', available: true }
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

      if (item.type === 'yearly') {
        this.cards.annual.push(card);
      } else if (item.type === 'monthly') {
        this.cards.monthly.push(card);
      }
    });
  }

  private getPriceDisplay(price: number, type: string): string {
    return type === 'yearly'
      ? `${price} €/year`
      : `${price} €/month`;
  }
}
