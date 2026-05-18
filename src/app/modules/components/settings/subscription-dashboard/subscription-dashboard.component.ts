import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Subscription as SubscriptionModel, SubscriptionPackage, BillingInterval } from '../../../../api-client';
import { SubscriptionService, SubscriptionPackageService } from '../../../../api-client';
import { SubscriptionManagementService } from '../../../../services/subscription.service';
import { TokenStorageService } from '../../../../services/token-storage.service';
import { NgToastService } from 'ng-angular-popup';
import { SubscriptionErrorHandlerService } from '../../../../services/subscription-error-handler.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

export type SubView = 'overview' | 'change-plan' | 'billing' | 'cancel';

interface PaymentItem {
  id: string;
  planName: string;
  planTag: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending';
  date: string;
  periodStart: string;
  periodEnd: string;
}

@Component({
  selector: 'app-subscription-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
  templateUrl: './subscription-dashboard.component.html',
  styleUrl: './subscription-dashboard.component.scss'
})
export class SubscriptionDashboardComponent implements OnInit, OnDestroy {
  subscription: SubscriptionModel | null = null;
  loading = true;
  private sub: Subscription | null = null;

  // View state
  currentView: SubView = 'overview';

  // Change plan
  private allPlans: SubscriptionPackage[] = [];
  plansLoading = false;
  billingPeriod: 'monthly' | 'annual' = 'monthly';
  selectedPlanId = '';

  get filteredPlans(): SubscriptionPackage[] {
    // billingInterval 3 = monthly, 4 = yearly
    const target = this.billingPeriod === 'monthly' ? BillingInterval.NUMBER_3 : BillingInterval.NUMBER_4;
    return this.allPlans.filter(p => p.billingInterval === target);
  }

  // Billing history
  paymentHistory: PaymentItem[] = [];
  billingLoading = false;

  // Cancel
  cancelReason = '';
  cancelReasons = [
    'Arsyeja e largimit (opsionale)',
    'Shumë e shtrenjtë',
    'Nuk e përdor mjaftueshëm',
    'Mungojnë veçori',
    'Gjeta një shërbim më të mirë',
    'Tjetër',
  ];

  constructor(
    private subscriptionMgmt: SubscriptionManagementService,
    private subscriptionApi: SubscriptionService,
    private packageApi: SubscriptionPackageService,
    private tokenStorage: TokenStorageService,
    private toast: NgToastService,
    private errorHandler: SubscriptionErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadSubscription();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private loadSubscription(): void {
    this.loading = true;
    this.sub = this.subscriptionMgmt.getActiveSubscription().subscribe({
      next: (s) => { this.subscription = s; this.loading = false; },
      error: (err) => {
        this.subscription = null;
        this.loading = false;
        this.errorHandler.handleSubscriptionError(err, 'load');
      }
    });
  }

  setView(v: SubView): void {
    this.currentView = v;
    if (v === 'change-plan' && this.allPlans.length === 0) this.loadPlans();
    if (v === 'billing' && this.paymentHistory.length === 0) this.loadBillingHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setBillingPeriod(period: 'monthly' | 'annual'): void {
    if (this.billingPeriod === period) return;
    const currentSelected = this.allPlans.find(p => p.id === this.selectedPlanId);
    this.billingPeriod = period;
    // Try to keep same tier selected in new period
    const target = period === 'monthly' ? BillingInterval.NUMBER_3 : BillingInterval.NUMBER_4;
    if (currentSelected?.tier != null) {
      const match = this.allPlans.find(p => p.tier === currentSelected.tier && p.billingInterval === target && !this.isCurrentPlan(p));
      this.selectedPlanId = match?.id || '';
    } else {
      this.selectedPlanId = '';
    }
    if (!this.selectedPlanId) {
      const first = this.filteredPlans.find(p => !this.isCurrentPlan(p));
      this.selectedPlanId = first?.id || '';
    }
  }

  private loadPlans(): void {
    const userType = this.tokenStorage.getRole() || 'Student';
    // Init billing period to match current subscription interval
    const iv = this.subscription?.interval as any;
    // billingInterval 4 = yearly, 3 = monthly
    if (iv === 4 || iv === 'yearly' || iv === 'annual') {
      this.billingPeriod = 'annual';
    } else {
      this.billingPeriod = 'monthly';
    }
    this.plansLoading = true;
    this.packageApi.apiSubscriptionPackageUserTypeUserTypeGet(userType).subscribe({
      next: (pkgs: any[]) => {
        this.allPlans = pkgs || [];
        if (!this.selectedPlanId) {
          const first = this.filteredPlans.find(p => !this.isCurrentPlan(p));
          this.selectedPlanId = first?.id || '';
        }
        this.plansLoading = false;
      },
      error: () => { this.plansLoading = false; }
    });
  }

  private loadBillingHistory(): void {
    const userId = this.tokenStorage.getUserId();
    if (!userId) return;
    this.billingLoading = true;
    this.subscriptionApi.apiSubscriptionUserUserIdPaymentHistoryGet(userId).subscribe({
      next: (payments: any[]) => {
        this.paymentHistory = (payments || []).map(p => ({
          id: p.id || '',
          planName: p.planName || p.subscriptionPackage?.name || 'N/A',
          planTag: this.subscriptionMgmt.getBillingIntervalText(p.interval ?? 2),
          amount: (p.amount || 0) / 100,
          currency: p.currency || 'EUR',
          status: (p.status === 'Paid' || p.status === 1 || p.status === 'paid') ? 'paid' : 'pending',
          date: p.paidAt ? this.subscriptionMgmt.formatDate(p.paidAt) : 'N/A',
          periodStart: p.periodStart ? this.subscriptionMgmt.formatDate(p.periodStart) : 'N/A',
          periodEnd: p.periodEnd ? this.subscriptionMgmt.formatDate(p.periodEnd) : 'N/A',
        } as PaymentItem));
        this.billingLoading = false;
      },
      error: () => { this.billingLoading = false; }
    });
  }

  // ---- Plan helpers ----
  // Prices come in cents; returns euros for display.
  // Monthly packages: monthlyPrice / 100.
  // Yearly packages: per-month equivalent (yearlyPrice / 12 / 100).
  getPlanPrice(plan: SubscriptionPackage): number {
    if (plan.billingInterval === BillingInterval.NUMBER_4) {
      return Math.round((plan.yearlyPrice ?? 0) / 12) / 100;
    }
    return (plan.monthlyPrice ?? plan.yearlyPrice ?? plan.basePrice ?? 0) / 100;
  }

  getPlanYearlyTotal(plan: SubscriptionPackage): number {
    return (plan.yearlyPrice ?? 0) / 100;
  }

  isCurrentPlan(plan: SubscriptionPackage): boolean {
    return plan.id === this.subscription?.subscriptionPackageId;
  }

  isSelectedPlan(plan: SubscriptionPackage): boolean {
    return plan.id === this.selectedPlanId && !this.isCurrentPlan(plan);
  }

  selectPlan(plan: SubscriptionPackage): void {
    if (!this.isCurrentPlan(plan)) this.selectedPlanId = plan.id || '';
  }

  getSelectedPlan(): SubscriptionPackage | undefined {
    return this.allPlans.find(p => p.id === this.selectedPlanId);
  }

  get perLabel(): string {
    return this.billingPeriod === 'monthly' ? '/ muaj' : '/ muaj · faturuar vjetore';
  }

  confirmPlan(): void {
    if (!this.subscription?.id || !this.selectedPlanId) return;
    const selectedPlan = this.getSelectedPlan();
    const interval: BillingInterval = selectedPlan?.billingInterval ??
      (this.billingPeriod === 'monthly' ? BillingInterval.NUMBER_2 : BillingInterval.NUMBER_3);
    this.subscriptionMgmt.changePlan(this.subscription.id, this.selectedPlanId, interval).subscribe({
      next: () => {
        this.toast.success('Plani u ndryshua me sukses.', 'SUKSES', 4000);
        this.loadSubscription();
        this.setView('overview');
      },
      error: (err) => { this.errorHandler.handleSubscriptionError(err, 'changePlan'); }
    });
  }

  // ---- Billing stats ----
  get totalPaid(): number {
    return this.paymentHistory.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  }
  get successfulCount(): number { return this.paymentHistory.filter(p => p.status === 'paid').length; }
  get pendingCount(): number { return this.paymentHistory.filter(p => p.status === 'pending').length; }

  // ---- Cancel ----
  confirmCancel(): void {
    if (!this.subscription?.id) return;
    this.subscriptionMgmt.cancelSubscription(
      this.subscription.id,
      this.cancelReason || 'Kërkesë nga përdoruesi',
      false
    ).subscribe({
      next: () => {
        this.toast.success('Abonimi u ç\'regjistrua. Do të ruani qasjen deri në fund të periudhës.', 'SUKSES', 5000);
        this.loadSubscription();
        this.setView('overview');
      },
      error: (err) => { this.errorHandler.handleSubscriptionError(err, 'unsubscribe'); }
    });
  }

  // ---- Overview helpers ----
  getPlanName(): string {
    return this.subscription?.subscriptionPackage?.name || 'Plan i panjohur';
  }

  getStatusText(): string {
    return this.subscriptionMgmt.getSubscriptionStatusText(this.subscription?.status || 0);
  }

  getBillingIntervalText(): string {
    if (!this.subscription) return '';
    const iv = this.subscription.interval as any;
    let n = 2;
    if (typeof iv === 'string') {
      const m: Record<string, number> = { day: 0, daily: 0, week: 1, weekly: 1, month: 2, monthly: 2, year: 3, yearly: 3, annual: 3 };
      n = m[iv.toLowerCase()] ?? 2;
    } else if (typeof iv === 'number') { n = iv; }
    return this.subscriptionMgmt.getBillingIntervalText(n);
  }

  getFormattedAmount(): string {
    if (!this.subscription) return '';
    return this.subscriptionMgmt.formatCurrency(this.subscription.amount || 0, this.subscription.currency || 'EUR');
  }

  getFormattedDate(d: string | null | undefined): string {
    return d ? this.subscriptionMgmt.formatDate(d) : 'N/A';
  }

  isActive(): boolean {
    return this.subscription ? this.subscriptionMgmt.isSubscriptionActive(this.subscription) : false;
  }

  canUnsubscribe(): boolean {
    return this.subscription ? this.subscriptionMgmt.isSubscriptionActive(this.subscription) : false;
  }

  getDaysUsed(): number {
    if (!this.subscription?.currentPeriodStart) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(this.subscription.currentPeriodStart).getTime()) / 86400000));
  }

  getDaysLeft(): number {
    if (!this.subscription?.currentPeriodEnd) return 0;
    return Math.max(0, Math.ceil((new Date(this.subscription.currentPeriodEnd).getTime() - Date.now()) / 86400000));
  }

  getDaysTotal(): number {
    if (!this.subscription?.currentPeriodStart) return 1;
    const s = new Date(this.subscription.currentPeriodStart).getTime();
    const e = this.subscription.currentPeriodEnd ? new Date(this.subscription.currentPeriodEnd).getTime() : s + 30 * 86400000;
    return Math.max(1, Math.floor((e - s) / 86400000));
  }

  getProgressPercent(): number {
    return Math.min(100, Math.round((this.getDaysUsed() / this.getDaysTotal()) * 100));
  }
}
