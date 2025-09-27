import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Subscription as SubscriptionModel } from '../../../../api-client';
import { SubscriptionManagementService } from '../../../../services/subscription.service';
import { NgToastService } from 'ng-angular-popup';
import { SubscriptionErrorHandlerService } from '../../../../services/subscription-error-handler.service';
import { UnsubscribeConfirmationDialogComponent } from './unsubscribe-confirmation-dialog.component';
import { PlanChangeDialogComponent } from './plan-change-dialog.component';
import { BillingHistoryDialogComponent } from './billing-history-dialog.component';

@Component({
  selector: 'app-subscription-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './subscription-dashboard.component.html',
  styleUrl: './subscription-dashboard.component.scss'
})
export class SubscriptionDashboardComponent implements OnInit, OnDestroy {
  subscription: SubscriptionModel | null = null;
  loading = true;
  private subscriptionSub: Subscription | null = null;

  constructor(
    private subscriptionService: SubscriptionManagementService,
    private toast: NgToastService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private errorHandler: SubscriptionErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadSubscription();
  }

  ngOnDestroy(): void {
    if (this.subscriptionSub) {
      this.subscriptionSub.unsubscribe();
    }
  }

  private loadSubscription(): void {
    this.loading = true;
    this.subscriptionSub = this.subscriptionService.getActiveSubscription().subscribe({
      next: (subscription) => {
        this.subscription = subscription;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load subscription:', error);
        this.subscription = null;
        this.loading = false;
        this.errorHandler.handleSubscriptionError(error, 'load');
      }
    });
  }


  getPlanName(): string {
    if (!this.subscription) return 'Plan i panjohur';
    return this.subscription.subscriptionPackage?.name || 'Plan i panjohur';
  }

  getStatusText(): string {
    if (!this.subscription) return 'Nuk ka abonim';
    return this.subscriptionService.getSubscriptionStatusText(this.subscription.status || 0);
  }

  getBillingIntervalText(): string {
    if (!this.subscription) return '';

    // Handle both string and number intervals from API
    const subscriptionInterval = this.subscription.interval as any;
    let interval: number = 2; // Default to monthly

    // If interval is a string, convert to number
    if (subscriptionInterval && typeof subscriptionInterval === 'string') {
      switch (subscriptionInterval.toLowerCase()) {
        case 'day':
        case 'daily':
          interval = 0;
          break;
        case 'week':
        case 'weekly':
          interval = 1;
          break;
        case 'month':
        case 'monthly':
          interval = 2;
          break;
        case 'year':
        case 'yearly':
        case 'annual':
          interval = 3;
          break;
        default:
          interval = 2; // Default to monthly
      }
    } else if (typeof subscriptionInterval === 'number') {
      interval = subscriptionInterval;
    }

    return this.subscriptionService.getBillingIntervalText(interval);
  }

  getFormattedAmount(): string {
    if (!this.subscription) return '';

    // The amount from API is in cents (e.g., 10000 = 100.00 EUR)
    const amount = this.subscription.amount || 0;
    const currency = this.subscription.currency || 'EUR';

    return this.subscriptionService.formatCurrency(amount, currency);
  }

  getFormattedDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    return this.subscriptionService.formatDate(dateString);
  }

  isActive(): boolean {
    return this.subscription ? this.subscriptionService.isSubscriptionActive(this.subscription) : false;
  }

  isInTrial(): boolean {
    return this.subscription ? this.subscriptionService.isSubscriptionInTrial(this.subscription) : false;
  }

  canUnsubscribe(): boolean {
    // User can unsubscribe if they have an active subscription
    return this.subscription ? this.subscriptionService.isSubscriptionActive(this.subscription) : false;
  }


  onChangePlan(): void {
    if (!this.subscription) return;

    const dialogRef = this.dialog.open(PlanChangeDialogComponent, {
      width: '600px',
      maxHeight: '80vh',
      data: {
        currentSubscription: this.subscription
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.loadSubscription(); // Reload subscription data
      }
    });
  }

  onViewBillingHistory(): void {
    if (!this.subscription) return;

    const dialogRef = this.dialog.open(BillingHistoryDialogComponent, {
      width: '900px',
      maxHeight: '80vh',
      data: {
        subscriptionId: this.subscription.id,
        userId: this.subscription.userId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // No specific action needed after closing
    });
  }

  onUnsubscribe(): void {
    if (!this.subscription) return;

    const dialogRef = this.dialog.open(UnsubscribeConfirmationDialogComponent, {
      width: '500px',
      data: {
        subscriptionName: this.subscription.subscriptionPackage?.name || 'Plan i panjohur',
        subscriptionId: this.subscription.id,
        endDate: this.subscription.currentPeriodEnd
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.performUnsubscribe();
      }
    });
  }

  private performUnsubscribe(): void {
    if (!this.subscription) return;

    this.subscriptionService.cancelSubscription(
      this.subscription.id!,
      'Përdoruesi kërkoi ç\'regjistrimin e abonimit',
      false // immediately = false - user keeps access until end of period
    ).subscribe({
      next: () => {
        this.toast.success('Abonimi u ç\'regjistrua me sukses. Do të ruani qasjen deri në fund të periudhës së faturimit.', 'SUKSES', 5000);
        this.loadSubscription(); // Reload subscription data
      },
      error: (error) => {
        console.error('Failed to unsubscribe:', error);
        this.errorHandler.handleSubscriptionError(error, 'unsubscribe');
      }
    });
  }
}
