import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {MembershipStudentService} from "../../../../services/membership-student.service";
import {SubscriptionPackageService, FamilyPricingResponseDTO} from "../../../../api-client";
import {BillingInterval} from "../../constant/enums";
import {TranslatePipe} from '../../../../pipes/translate.pipe';

interface Card {
  id: string;
  title: string;
  description: string;
  features: string[];
  price: number;
  priceDisplay: string;
  isBestValue?: boolean;
  maxUsers?: number;
}

type BillingCycle = 'annual' | 'monthly';

const FEATURES_MAP: Record<'basic' | 'standard' | 'premium', string[]> = {
  basic: [
    'Mësime themelore të drejtës rrugore',
    'Provime praktike bazë',
    'Materiale mësimore',
    'Akses në komunitet'
  ],
  standard: [
    'Të gjitha nga paketa Bazë',
    'Provime simulative të avancuara',
    'Materiale shtesë HD',
    'Mbështetje me email',
    'Bazë e të dhënave të pyetjeve'
  ],
  premium: [
    'Të gjitha nga paketa Standarde',
    'Mësime HD të pakufizuara',
    'Mbështetje 24/7',
    'Sesione me tutor personal',
    'Materiale ekskluzive'
  ]
};

function resolveFeatures(name: string): string[] {
  const n = name.toLowerCase();
  if (n.includes('premium')) return FEATURES_MAP.premium;
  if (n.includes('standard') || n.includes('standarde')) return FEATURES_MAP.standard;
  return FEATURES_MAP.basic;
}

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './packages.component.html',
  styleUrl: './packages.component.scss'
})
export class PackagesComponent implements OnChanges {
  @Input() userType!: string;
  @Input() familyPricingData: FamilyPricingResponseDTO[] = [];
  @Input() excludeCurrentPlan: boolean = false;
  @Input() currentPlanId?: string;

  cards: Record<BillingCycle, Card[]> = { annual: [], monthly: [] };
  selectedCard: Card | null = null;
  packegeForm!: FormGroup;
  paymentInfo: any[] = [];

  constructor(
    private fb: FormBuilder,
    private membershipStudentService: MembershipStudentService,
    private subscriptionPackageService: SubscriptionPackageService
  ) {}

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
    return this.cards[this.packegeForm.value.billingCycle as BillingCycle];
  }

  get isAnnual(): boolean {
    return this.packegeForm.value.billingCycle === 'annual';
  }

  selectCard(card: Card) {
    this.selectedCard = card;
    this.membershipStudentService.setSelectedPackage(card);
  }

  setBillingCycle(cycle: BillingCycle) {
    this.packegeForm.patchValue({ billingCycle: cycle });
    this.selectedCard = null;
    this.membershipStudentService.setSelectedPackage(null);
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
    this.cards = { annual: [], monthly: [] };

    const descriptions: Record<string, string> = {
      "Bazë": "Paketa ideale për fillestarët. Përfshin mësime themelore të drejtës rrugore, provime praktike dhe materiale mësimore bazë për të kaluar provimin me sukses.",
      "Standarde": "Paketa më e zgjedhur nga studentët. Oferon mësime të detajuara, provime simulative, materiale shtesë, mbështetje me email dhe akses në bazën e të dhënave të pyetjeve.",
      "Premium": "Paketa më e plotë për studentët ambiciozë. Përfshin të gjitha mësimet HD, provime të pakufizuara, mbështetje 24/7, sesione me tutorë personal dhe materiale ekskluzive.",
      "Student Basic": "Paketa ideale për fillestarët. Përfshin mësime themelore të drejtës rrugore, provime praktike dhe materiale mësimore bazë për të kaluar provimin me sukses.",
      "Student Standard": "Paketa më e zgjedhur nga studentët. Oferon mësime të detajuara, provime simulative, materiale shtesë, mbështetje me email dhe akses në bazën e të dhënave të pyetjeve.",
      "Student Premium": "Paketa më e plotë për studentët ambiciozë. Përfshin të gjitha mësimet HD, provime të pakufizuara, mbështetje 24/7, sesione me tutorë personal dhe materiale ekskluzive.",
    };

    this.paymentInfo.forEach(item => {
      if (this.excludeCurrentPlan && item.id === this.currentPlanId) return;

      const packageName = item.name || '';
      let description = descriptions[packageName];
      if (!description) {
        const n = packageName.toLowerCase();
        if (n.includes('basic') || n.includes('bazë')) description = descriptions["Bazë"];
        else if (n.includes('standard') || n.includes('standarde')) description = descriptions["Standarde"];
        else if (n.includes('premium')) description = descriptions["Premium"];
        else description = "Paketa mësimore me përmbajtje cilësore dhe mbështetje të dedikuar.";
      }

      const features = resolveFeatures(packageName);
      if (item.maxUsers && item.maxUsers > 1) {
        features.push(`Deri në ${item.maxUsers} anëtarë`);
      }

      const monthlyCard: Card = {
        id: item.id, title: item.name || '', description, features,
        price: (item.monthlyPrice || 0) / 100,
        priceDisplay: this.getPriceDisplay((item.monthlyPrice || 0) / 100, 'monthly'),
        maxUsers: item.maxUsers
      };
      const yearlyCard: Card = {
        id: item.id, title: item.name || '', description, features,
        price: (item.yearlyPrice || 0) / 100,
        priceDisplay: this.getPriceDisplay((item.yearlyPrice || 0) / 100, 'yearly'),
        maxUsers: item.maxUsers
      };

      if (item.name?.includes('Standard')) {
        monthlyCard.isBestValue = true;
        yearlyCard.isBestValue = true;
      }

      const bi = item.billingInterval;
      if (bi === BillingInterval.Month || bi === 'MONTHLY' || bi === 3) {
        this.cards.monthly.push(monthlyCard);
      } else if (bi === BillingInterval.Year || bi === 'YEARLY' || bi === 4) {
        this.cards.annual.push(yearlyCard);
      } else {
        this.cards.monthly.push(monthlyCard);
        this.cards.annual.push(yearlyCard);
      }
    });

    const order = ["Bazë", "Standarde", "Premium"];
    const sortFn = (a: Card, b: Card) => order.indexOf(a.title) - order.indexOf(b.title);
    this.cards.annual.sort(sortFn);
    this.cards.monthly.sort(sortFn);
  }

  private getPriceDisplay(price: number, type: string): string {
    return type === 'yearly' ? `${price} €/vit` : `${price} €/muaj`;
  }

  private mapFamilyPricingToCards() {
    this.cards = { annual: [], monthly: [] };

    const descriptions: Record<string, string> = {
      "Bazë": "Paketa familjare bazë. Përfshin mësime themelore të drejtës rrugore për të gjithë anëtarët e familjes, provime praktike dhe materiale mësimore bazë.",
      "Standarde": "Paketa familjare më e zgjedhur. Oferon mësime të detajuara për të gjithë anëtarët, provime simulative dhe mbështetje me email.",
      "Premium": "Paketa familjare më e plotë. Përfshin të gjitha mësimet HD, provime të pakufizuara, mbështetje 24/7 dhe sesione me tutorë personal.",
    };

    this.familyPricingData.forEach(pricing => {
      const packageName = pricing.name || '';
      let description = descriptions[packageName];
      if (!description) {
        const n = packageName.toLowerCase();
        if (n.includes('basic') || n.includes('bazë')) description = descriptions["Bazë"];
        else if (n.includes('standard') || n.includes('standarde')) description = descriptions["Standarde"];
        else if (n.includes('premium')) description = descriptions["Premium"];
        else description = "Paketa familjare me përmbajtje cilësore.";
      }

      const features = resolveFeatures(packageName);
      if (pricing.maxMembers && pricing.maxMembers > 1) {
        features.push(`Deri në ${pricing.maxMembers} anëtarë`);
      }

      const card: Card = {
        id: pricing.packageId || '', title: packageName, description, features,
        price: (pricing.totalPrice || 0) / 100,
        priceDisplay: pricing.totalPriceFormatted || `${(pricing.totalPrice || 0) / 100} €`,
        maxUsers: pricing.maxMembers
      };

      if (pricing.name?.includes('Standard')) card.isBestValue = true;

      const bi = pricing.billingInterval;
      if (bi === BillingInterval.Month) this.cards.monthly.push(card);
      else if (bi === BillingInterval.Year) this.cards.annual.push(card);
      else { this.cards.monthly.push(card); this.cards.annual.push({...card}); }
    });

    const order = ["Bazë", "Standarde", "Premium"];
    const sortFn = (a: Card, b: Card) => order.indexOf(a.title) - order.indexOf(b.title);
    this.cards.annual.sort(sortFn);
    this.cards.monthly.sort(sortFn);
  }
}