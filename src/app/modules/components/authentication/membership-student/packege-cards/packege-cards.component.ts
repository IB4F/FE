import { Component, OnInit } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatRadioModule } from "@angular/material/radio";
import {MembershipStudentService} from "../../../../../services/membership-student.service";

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
  stripePriceId?: string;
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
    annual: [
      {
        id: 'prod_annual_basic',
        title: 'Paketa Bazë',
        price: 200,
        priceDisplay: '200 €/year',
        stripePriceId: 'price_annual_basic',
        features: [
          { text: '3 HD video lessons', available: true },
          { text: '1 Official exam', available: true },
          { text: 'Practice quizzes', available: false },
          { text: 'Email support', available: false }
        ]
      },
      {
        id: 'prod_annual_standard',
        title: 'Paketa Standarde',
        price: 400,
        priceDisplay: '400 €/year',
        stripePriceId: 'price_annual_standard',
        features: [
          { text: '10 HD video lessons', available: true },
          { text: '3 Official exams', available: true },
          { text: 'Practice quizzes', available: true },
          { text: 'Priority email support', available: true }
        ]
      },
      {
        id: 'prod_annual_premium',
        title: 'Paketa Premium',
        price: 600,
        priceDisplay: '600 €/year',
        stripePriceId: 'price_annual_premium',
        features: [
          { text: 'Unlimited HD video lessons', available: true },
          { text: '5 Official exams', available: true },
          { text: 'Practice quizzes', available: true },
          { text: '24/7 Priority support', available: true },
          { text: 'Personal tutor sessions', available: true }
        ]
      }
    ],
    monthly: [
      {
        id: 'prod_monthly_basic',
        title: 'Paketa Bazë',
        price: 20,
        priceDisplay: '20 €/month',
        stripePriceId: 'price_monthly_basic',
        features: [
          { text: '3 HD video lessons', available: true },
          { text: '1 Official exam', available: true },
          { text: 'Practice quizzes', available: false },
          { text: 'Email support', available: false }
        ]
      },
      {
        id: 'prod_monthly_standard',
        title: 'Paketa Standarde',
        price: 40,
        priceDisplay: '40 €/month',
        stripePriceId: 'price_monthly_standard',
        features: [
          { text: '10 HD video lessons', available: true },
          { text: '3 Official exams', available: true },
          { text: 'Practice quizzes', available: true },
          { text: 'Priority email support', available: true }
        ]
      },
      {
        id: 'prod_monthly_premium',
        title: 'Paketa Premium',
        price: 60,
        priceDisplay: '60 €/month',
        stripePriceId: 'price_monthly_premium',
        features: [
          { text: 'Unlimited HD video lessons', available: true },
          { text: '5 Official exams', available: true },
          { text: 'Practice quizzes', available: true },
          { text: '24/7 Priority support', available: true },
          { text: 'Personal tutor sessions', available: true }
        ]
      }
    ]
  };

  selectedCard: Card | null = null;
  packegeForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private membershipStudentService: MembershipStudentService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
  }

  initForm() {
    this.packegeForm = this.fb.group({
      billingCycle: ['annual' as BillingCycle]
    });
  }

  setupFormListeners() {
    // Aggiorna il form state quando cambia la selezione
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
}
