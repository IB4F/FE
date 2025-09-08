import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { SubscriptionService, Subscription, CancelSubscriptionDTO, ChangePlanDTO, BillingInterval } from '../api-client';
import { UserService } from './user.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionManagementService {
  private currentSubscriptionSubject = new BehaviorSubject<Subscription | null>(null);
  public currentSubscription$ = this.currentSubscriptionSubject.asObservable();

  constructor(
    private subscriptionService: SubscriptionService,
    private userService: UserService,
    private tokenStorageService: TokenStorageService
  ) {}

  /**
   * Get user's active subscription
   */
  getActiveSubscription(): Observable<Subscription> {
    const userId = this.tokenStorageService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.subscriptionService.apiSubscriptionUserUserIdActiveGet(userId);
  }

  /**
   * Get all user subscriptions
   */
  getAllUserSubscriptions(): Observable<Subscription[]> {
    const userId = this.tokenStorageService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.subscriptionService.apiSubscriptionUserUserIdAllGet(userId);
  }

  /**
   * Get subscription by ID
   */
  getSubscriptionById(subscriptionId: string): Observable<Subscription> {
    return this.subscriptionService.apiSubscriptionIdGet(subscriptionId);
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(subscriptionId: string, reason: string, immediately: boolean = false): Observable<any> {
    const cancelDTO: CancelSubscriptionDTO = {
      reason: reason,
      immediately: immediately,
      feedback: null
    };

    return this.subscriptionService.apiSubscriptionIdCancelPost(subscriptionId, cancelDTO);
  }

  /**
   * Change subscription plan
   */
  changePlan(subscriptionId: string, newPlanId: string, billingInterval: BillingInterval, prorate: boolean = true): Observable<any> {
    const changePlanDTO: ChangePlanDTO = {
      newPlanId: newPlanId,
      billingInterval: billingInterval,
      prorate: prorate,
      reason: 'User requested plan change'
    };

    return this.subscriptionService.apiSubscriptionIdChangePlanPost(subscriptionId, changePlanDTO);
  }

  /**
   * Pause subscription
   */
  pauseSubscription(subscriptionId: string): Observable<any> {
    return this.subscriptionService.apiSubscriptionIdPausePost(subscriptionId);
  }

  /**
   * Resume subscription
   */
  resumeSubscription(subscriptionId: string): Observable<any> {
    return this.subscriptionService.apiSubscriptionIdResumePost(subscriptionId);
  }

  /**
   * Load and cache current subscription
   */
  loadCurrentSubscription(): void {
    this.getActiveSubscription().subscribe({
      next: (subscription) => {
        this.currentSubscriptionSubject.next(subscription);
      },
      error: (error) => {
        console.error('Failed to load subscription:', error);
        this.currentSubscriptionSubject.next(null);
      }
    });
  }

  /**
   * Clear subscription cache
   */
  clearSubscriptionCache(): void {
    this.currentSubscriptionSubject.next(null);
  }

  /**
   * Get subscription status text
   */
  getSubscriptionStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Aktiv',
      1: 'Pauzuar',
      2: 'Anuluar',
      3: 'Skaduar',
      4: 'Në provë',
      5: 'Përpunim',
      6: 'Gabim',
      7: 'I papaguar'
    };
    return statusMap[status] || 'E panjohur';
  }

  /**
   * Get billing interval text
   */
  getBillingIntervalText(interval: number): string {
    const intervalMap: { [key: number]: string } = {
      0: 'Ditore',
      1: 'Javore',
      2: 'Mujore',
      3: 'Vjetore'
    };
    return intervalMap[interval] || 'E panjohur';
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency: currency
    }).format(amount / 100); // Assuming amount is in cents
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(subscription: Subscription): boolean {
    return subscription.status === 0; // Assuming 0 is active status
  }

  /**
   * Check if subscription is in trial
   */
  isSubscriptionInTrial(subscription: Subscription): boolean {
    return subscription.status === 4; // Assuming 4 is trial status
  }

  /**
   * Check if subscription can be cancelled
   */
  canCancelSubscription(subscription: Subscription): boolean {
    return this.isSubscriptionActive(subscription) || this.isSubscriptionInTrial(subscription);
  }

  /**
   * Check if subscription can be paused
   */
  canPauseSubscription(subscription: Subscription): boolean {
    return this.isSubscriptionActive(subscription);
  }

  /**
   * Check if subscription can be resumed
   */
  canResumeSubscription(subscription: Subscription): boolean {
    return subscription.status === 1; // Assuming 1 is paused status
  }
}
