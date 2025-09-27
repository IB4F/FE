import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {MatRadioModule} from "@angular/material/radio";
import {CommonModule} from "@angular/common";
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {MembershipStudentService} from "../../../../services/membership-student.service";
import {SubscriptionPackageService, FamilyPricingResponseDTO} from "../../../../api-client";
import {BillingInterval} from "../../constant/enums";

interface Card {
  id: string;
  title: string;
  description: string;
  price: number;
  priceDisplay: string;
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
  @Input() excludeCurrentPlan: boolean = false;
  @Input() currentPlanId?: string;

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

  onSwitchChange(event: any) {
    const isAnnual = event.target.checked;
    const billingCycle = isAnnual ? 'annual' : 'monthly';
    this.packegeForm.patchValue({ billingCycle });
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
    // Clear existing cards
    this.cards = {annual: [], monthly: []};

    // Define unique descriptions for each package type in Albanian
    const descriptions: Record<string, string> = {
      // Exact matches
      "Bazë": "Paketa ideale për fillestarët. Përfshin mësime themelore të drejtës rrugore, provime praktike dhe materiale mësimore bazë për të kaluar provimin me sukses.",
      "Standarde": "Paketa më e zgjedhur nga studentët. Oferon mësime të detajuara, provime simulative, materiale shtesë, mbështetje me email dhe akses në bazën e të dhënave të pyetjeve.",
      "Premium": "Paketa më e plotë për studentët ambiciozë. Përfshin të gjitha mësimet HD, provime të pakufizuara, mbështetje 24/7, sesione me tutorë personal dhe materiale ekskluzive.",
      
      // Common API variations
      "Student Basic": "Paketa ideale për fillestarët. Përfshin mësime themelore të drejtës rrugore, provime praktike dhe materiale mësimore bazë për të kaluar provimin me sukses.",
      "Student Standard": "Paketa më e zgjedhur nga studentët. Oferon mësime të detajuara, provime simulative, materiale shtesë, mbështetje me email dhe akses në bazën e të dhënave të pyetjeve.",
      "Student Premium": "Paketa më e plotë për studentët ambiciozë. Përfshin të gjitha mësimet HD, provime të pakufizuara, mbështetje 24/7, sesione me tutorë personal dhe materiale ekskluzive.",
      "Student Basic Yearly": "Paketa ideale për fillestarët. Përfshin mësime themelore të drejtës rrugore, provime praktike dhe materiale mësimore bazë për të kaluar provimin me sukses.",
      "Student Standard Yearly": "Paketa më e zgjedhur nga studentët. Oferon mësime të detajuara, provime simulative, materiale shtesë, mbështetje me email dhe akses në bazën e të dhënave të pyetjeve.",
      "Student Premium Yearly": "Paketa më e plotë për studentët ambiciozë. Përfshin të gjitha mësimet HD, provime të pakufizuara, mbështetje 24/7, sesione me tutorë personal dhe materiale ekskluzive.",
      "Student Basic Monthly": "Paketa ideale për fillestarët. Përfshin mësime themelore të drejtës rrugore, provime praktike dhe materiale mësimore bazë për të kaluar provimin me sukses.",
      "Student Standard Monthly": "Paketa më e zgjedhur nga studentët. Oferon mësime të detajuara, provime simulative, materiale shtesë, mbështetje me email dhe akses në bazën e të dhënave të pyetjeve.",
      "Student Premium Monthly": "Paketa më e plotë për studentët ambiciozë. Përfshin të gjitha mësimet HD, provime të pakufizuara, mbështetje 24/7, sesione me tutorë personal dhe materiale ekskluzive."
    };

    // Map API data to cards
    this.paymentInfo.forEach(item => {
      // Skip current plan if excludeCurrentPlan is true
      if (this.excludeCurrentPlan && item.id === this.currentPlanId) {
        return;
      }

      // Get description for this package, with fallback to default description
      const packageName = item.name || '';
      
      // Try to match package name with different possible formats
      let description = descriptions[packageName];
      
      // If exact match not found, try partial matching
      if (!description) {
        if (packageName.toLowerCase().includes('basic') || packageName.toLowerCase().includes('bazë')) {
          description = descriptions["Bazë"];
        } else if (packageName.toLowerCase().includes('standard') || packageName.toLowerCase().includes('standarde')) {
          description = descriptions["Standarde"];
        } else if (packageName.toLowerCase().includes('premium')) {
          description = descriptions["Premium"];
        }
      }
      
      // Final fallback
      if (!description) {
        description = "Paketa mësimore me përmbajtje cilësore dhe mbështetje të dedikuar për studentët.";
      }

      // Create cards for both monthly and yearly billing intervals
      const monthlyCard: Card = {
        id: item.id,
        title: item.name || '',
        description: description,
        price: (item.monthlyPrice || 0) / 100,
        priceDisplay: this.getPriceDisplay((item.monthlyPrice || 0) / 100, 'monthly'),
        maxUsers: item.maxUsers
      };

      const yearlyCard: Card = {
        id: item.id,
        title: item.name || '',
        description: description,
        price: (item.yearlyPrice || 0) / 100,
        priceDisplay: this.getPriceDisplay((item.yearlyPrice || 0) / 100, 'yearly'),
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

    // Define unique descriptions for each family package type in Albanian
    const descriptions: Record<string, string> = {
      // Exact matches
      "Bazë": "Paketa familjare bazë për fillestarët. Përfshin mësime themelore të drejtës rrugore për të gjithë anëtarët e familjes, provime praktike dhe materiale mësimore bazë.",
      "Standarde": "Paketa familjare më e zgjedhur. Oferon mësime të detajuara për të gjithë anëtarët, provime simulative, materiale shtesë, mbështetje me email dhe akses në bazën e pyetjeve.",
      "Premium": "Paketa familjare më e plotë. Përfshin të gjitha mësimet HD për të gjithë anëtarët, provime të pakufizuara, mbështetje 24/7, sesione me tutorë personal dhe materiale ekskluzive familjare.",
      
      // Family package variations
      "Family Basic": "Paketa familjare bazë për fillestarët. Përfshin mësime themelore të drejtës rrugore për të gjithë anëtarët e familjes, provime praktike dhe materiale mësimore bazë.",
      "Family Standard": "Paketa familjare më e zgjedhur. Oferon mësime të detajuara për të gjithë anëtarët, provime simulative, materiale shtesë, mbështetje me email dhe akses në bazën e pyetjeve.",
      "Family Premium": "Paketa familjare më e plotë. Përfshin të gjitha mësimet HD për të gjithë anëtarët, provime të pakufizuara, mbështetje 24/7, sesione me tutorë personal dhe materiale ekskluzive familjare."
    };

    // Map family pricing data to cards
    this.familyPricingData.forEach(pricing => {
      const packageName = pricing.name || '';
      
      // Try to match package name with different possible formats
      let description = descriptions[packageName];
      
      // If exact match not found, try partial matching
      if (!description) {
        if (packageName.toLowerCase().includes('basic') || packageName.toLowerCase().includes('bazë')) {
          description = descriptions["Bazë"];
        } else if (packageName.toLowerCase().includes('standard') || packageName.toLowerCase().includes('standarde')) {
          description = descriptions["Standarde"];
        } else if (packageName.toLowerCase().includes('premium')) {
          description = descriptions["Premium"];
        }
      }
      
      // Final fallback
      if (!description) {
        description = "Paketa familjare me përmbajtje cilësore dhe mbështetje të dedikuar për të gjithë anëtarët.";
      }

      // Create cards for both monthly and yearly billing intervals
      const monthlyCard: Card = {
        id: pricing.packageId || '',
        title: pricing.name || '',
        description: description,
        price: (pricing.totalPrice || 0) / 100,
        priceDisplay: pricing.totalPriceFormatted || `${(pricing.totalPrice || 0) / 100} €/muaj`,
        maxUsers: pricing.maxMembers
      };

      const yearlyCard: Card = {
        id: pricing.packageId || '',
        title: pricing.name || '',
        description: description,
        price: (pricing.totalPrice || 0) / 100,
        priceDisplay: pricing.totalPriceFormatted || `${(pricing.totalPrice || 0) / 100} €/vit`,
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
