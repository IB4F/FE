import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubscriptionService } from '../../../../api-client';
import { SubscriptionManagementService } from '../../../../services/subscription.service';
import { TokenStorageService } from '../../../../services/token-storage.service';
import { NgToastService } from 'ng-angular-popup';
import { SubscriptionErrorHandlerService } from '../../../../services/subscription-error-handler.service';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

export interface BillingHistoryDialogData {
  subscriptionId?: string;
  userId?: string;
}

interface PaymentHistoryItem {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  planName: string;
  subscriptionStatus: string;
  interval: string;
  stripeInvoiceId: string | null;
  stripePaymentIntentId: string | null;
  formattedAmount: string;
  formattedPaidAt: string;
  formattedPeriodStart: string;
  formattedPeriodEnd: string;
  statusColor: string;
  statusIcon: string;
}

@Component({
  selector: 'app-billing-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    TranslatePipe
  ],
  template: `
    <div class="billing-history-dialog">
      <div class="dialog-header">
        <mat-icon class="history-icon">receipt</mat-icon>
        <h2>{{ 'billingHistory.title' | translate }}</h2>
      </div>

      <div class="dialog-content">
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>{{ 'billingHistory.loading' | translate }}</p>
        </div>

        <!-- Payment History -->
        <div *ngIf="!loading && paymentHistory.length > 0" class="payment-history">
          <!-- Summary Card -->
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-content">
                <div class="summary-item">
                  <mat-icon class="summary-icon">payment</mat-icon>
                  <div class="summary-details">
                    <span class="summary-label">{{ 'billingHistory.summary.totalPayments' | translate }}</span>
                    <span class="summary-value">{{ getTotalPayments() }}</span>
                  </div>
                </div>
                <div class="summary-item">
                  <mat-icon class="summary-icon">check_circle</mat-icon>
                  <div class="summary-details">
                    <span class="summary-label">{{ 'billingHistory.summary.successful' | translate }}</span>
                    <span class="summary-value">{{ getSuccessfulPayments() }}</span>
                  </div>
                </div>
                <div class="summary-item">
                  <mat-icon class="summary-icon">pending</mat-icon>
                  <div class="summary-details">
                    <span class="summary-label">{{ 'billingHistory.summary.pending' | translate }}</span>
                    <span class="summary-value">{{ getPendingPayments() }}</span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Payment History Table -->
          <div class="payment-table-container">
            <table mat-table [dataSource]="paymentHistory" class="payment-table">
              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>{{ 'billingHistory.table.status' | translate }}</th>
                <td mat-cell *matCellDef="let payment">
                  <mat-chip
                    [style.background-color]="payment.statusColor"
                    [style.color]="getContrastColor(payment.statusColor)"
                    class="status-chip">
                    <mat-icon class="chip-icon">{{ payment.statusIcon }}</mat-icon>
                    {{ payment.status }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Plan Name Column -->
              <ng-container matColumnDef="planName">
                <th mat-header-cell *matHeaderCellDef>{{ 'billingHistory.table.plan' | translate }}</th>
                <td mat-cell *matCellDef="let payment">
                  <div class="plan-info">
                    <span class="plan-name">{{ payment.planName }}</span>
                    <span class="plan-interval">{{ payment.interval }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>{{ 'billingHistory.table.amount' | translate }}</th>
                <td mat-cell *matCellDef="let payment">
                  <span class="amount">{{ payment.formattedAmount }}</span>
                </td>
              </ng-container>

              <!-- Period Column -->
              <ng-container matColumnDef="period">
                <th mat-header-cell *matHeaderCellDef>{{ 'billingHistory.table.period' | translate }}</th>
                <td mat-cell *matCellDef="let payment">
                  <div class="period-info">
                    <span class="period-start">{{ payment.formattedPeriodStart }}</span>
                    <mat-icon class="period-separator">arrow_forward</mat-icon>
                    <span class="period-end">{{ payment.formattedPeriodEnd }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Paid Date Column -->
              <ng-container matColumnDef="paidAt">
                <th mat-header-cell *matHeaderCellDef>{{ 'billingHistory.table.paidAt' | translate }}</th>
                <td mat-cell *matCellDef="let payment">
                  <div class="paid-date">
                    <mat-icon class="date-icon">event</mat-icon>
                    <span>{{ payment.formattedPaidAt }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>{{ 'billingHistory.table.actions' | translate }}</th>
                <td mat-cell *matCellDef="let payment">
                  <button
                    mat-icon-button
                    [matTooltip]="'billingHistory.tooltip.viewDetails' | translate"
                    (click)="viewPaymentDetails(payment)"
                    class="action-button">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    [matTooltip]="'billingHistory.tooltip.download' | translate"
                    (click)="downloadInvoice(payment)"
                    class="action-button"
                    *ngIf="payment.status === 'Succeeded'">
                    <mat-icon>download</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                  [class.selected-row]="selectedPayment?.id === row.id"></tr>
            </table>
          </div>

          <!-- Payment Detail Panel -->
          <div *ngIf="selectedPayment" class="payment-detail-panel">
            <div class="detail-panel-header">
              <h4>
                <mat-icon>info</mat-icon>
                {{ 'billingHistory.detail.title' | translate }}
              </h4>
              <button mat-icon-button (click)="selectedPayment = null" class="close-detail-btn">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="detail-panel-grid">
              <div class="detail-item">
                <label>{{ 'billingHistory.detail.plan' | translate }}</label>
                <span>{{ selectedPayment.planName }}</span>
              </div>
              <div class="detail-item">
                <label>{{ 'billingHistory.detail.interval' | translate }}</label>
                <span>{{ selectedPayment.interval }}</span>
              </div>
              <div class="detail-item">
                <label>{{ 'billingHistory.detail.amount' | translate }}</label>
                <span class="amount-highlight">{{ selectedPayment.formattedAmount }}</span>
              </div>
              <div class="detail-item">
                <label>{{ 'billingHistory.detail.status' | translate }}</label>
                <span [style.color]="selectedPayment.statusColor" class="status-text">
                  <mat-icon style="font-size:14px; vertical-align: middle; width:14px; height:14px;">{{ selectedPayment.statusIcon }}</mat-icon>
                  {{ selectedPayment.status }}
                </span>
              </div>
              <div class="detail-item">
                <label>{{ 'billingHistory.detail.paidAt' | translate }}</label>
                <span>{{ selectedPayment.formattedPaidAt }}</span>
              </div>
              <div class="detail-item">
                <label>{{ 'billingHistory.detail.subscriptionStatus' | translate }}</label>
                <span>{{ selectedPayment.subscriptionStatus || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>{{ 'billingHistory.detail.periodStart' | translate }}</label>
                <span>{{ selectedPayment.formattedPeriodStart }}</span>
              </div>
              <div class="detail-item">
                <label>{{ 'billingHistory.detail.periodEnd' | translate }}</label>
                <span>{{ selectedPayment.formattedPeriodEnd }}</span>
              </div>
              <!-- Admin-only technical details -->
              <ng-container *ngIf="isAdmin">
                <div class="detail-item full-width">
                  <label>{{ 'billingHistory.detail.paymentId' | translate }}</label>
                  <span class="mono">{{ selectedPayment.id }}</span>
                </div>
                <div class="detail-item full-width">
                  <label>{{ 'billingHistory.detail.subscriptionId' | translate }}</label>
                  <span class="mono">{{ selectedPayment.subscriptionId }}</span>
                </div>
                <div *ngIf="selectedPayment.stripeInvoiceId" class="detail-item full-width">
                  <label>{{ 'billingHistory.detail.invoiceId' | translate }}</label>
                  <span class="mono">{{ selectedPayment.stripeInvoiceId }}</span>
                </div>
                <div *ngIf="selectedPayment.stripePaymentIntentId" class="detail-item full-width">
                  <label>{{ 'billingHistory.detail.paymentIntentId' | translate }}</label>
                  <span class="mono">{{ selectedPayment.stripePaymentIntentId }}</span>
                </div>
              </ng-container>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && paymentHistory.length === 0" class="empty-state">
          <mat-icon class="empty-icon">receipt_long</mat-icon>
          <h3>{{ 'billingHistory.empty.title' | translate }}</h3>
          <p>{{ 'billingHistory.empty.subtitle' | translate }}</p>
          <button mat-button (click)="loadPaymentHistory()" class="retry-button">
            <mat-icon>refresh</mat-icon>
            {{ 'billingHistory.empty.refresh' | translate }}
          </button>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="error-state">
          <mat-icon class="error-icon">error</mat-icon>
          <h3>{{ 'billingHistory.error.title' | translate }}</h3>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="loadPaymentHistory()" class="retry-button">
            <mat-icon>refresh</mat-icon>
            {{ 'billingHistory.error.retry' | translate }}
          </button>
        </div>
      </div>

      <div class="dialog-actions">
        <button
          mat-button
          (click)="onClose()"
          class="close-button">
          {{ 'billingHistory.close' | translate }}
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="exportToPDF()"
          [disabled]="paymentHistory.length === 0"
          class="export-button">
          <mat-icon>picture_as_pdf</mat-icon>
          {{ 'billingHistory.export' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .billing-history-dialog {
      padding: 0;
      max-width: 900px;
      max-height: 80vh;
      overflow-y: auto;
      
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px 24px 16px 24px;
        border-bottom: 1px solid #e0e0e0;
        
        .history-icon {
          color: #2196f3;
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
        
        h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
        }
      }
      
      .dialog-content {
        padding: 24px;
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 0;
          
          p {
            margin: 0;
            color: #666;
          }
        }
        
        .payment-history {
          .summary-card {
            margin-bottom: 24px;
            
            .summary-content {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 24px;
              
              .summary-item {
                display: flex;
                align-items: center;
                gap: 12px;
                
                .summary-icon {
                  color: #2196f3;
                  font-size: 24px;
                  width: 24px;
                  height: 24px;
                }
                
                .summary-details {
                  display: flex;
                  flex-direction: column;
                  
                  .summary-label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 2px;
                  }
                  
                  .summary-value {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #333;
                  }
                }
              }
            }
          }
          
          .payment-table-container {
            overflow-x: auto;
            
            .payment-table {
              width: 100%;
              
              .status-chip {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 0.8rem;
                font-weight: 500;
                
                .chip-icon {
                  font-size: 14px;
                  width: 14px;
                  height: 14px;
                }
              }
              
              .plan-info {
                display: flex;
                flex-direction: column;
                
                .plan-name {
                  font-weight: 500;
                  color: #333;
                }
                
                .plan-interval {
                  font-size: 0.8rem;
                  color: #666;
                }
              }
              
              .amount {
                font-weight: 600;
                color: #333;
                font-size: 1.1rem;
              }
              
              .period-info {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
                
                .period-start, .period-end {
                  color: #333;
                }
                
                .period-separator {
                  font-size: 16px;
                  width: 16px;
                  height: 16px;
                  color: #666;
                }
              }
              
              .paid-date {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.9rem;
                color: #333;
                
                .date-icon {
                  font-size: 16px;
                  width: 16px;
                  height: 16px;
                  color: #666;
                }
              }
              
              .action-button {
                margin: 0 4px;

                mat-icon {
                  font-size: 18px;
                  width: 18px;
                  height: 18px;
                }
              }
            }
          }

          .selected-row {
            background-color: #f0f8fc;
          }

          .payment-detail-panel {
            margin-top: 16px;
            border: 1px solid #2196f3;
            border-radius: 8px;
            background: #f8fcff;
            overflow: hidden;

            .detail-panel-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px 16px;
              background: #e3f2fd;
              border-bottom: 1px solid #bbdefb;

              h4 {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0;
                font-size: 1rem;
                color: #1565c0;

                mat-icon {
                  font-size: 18px;
                  width: 18px;
                  height: 18px;
                }
              }

              .close-detail-btn {
                width: 32px;
                height: 32px;
                line-height: 32px;
                color: #666;

                mat-icon {
                  font-size: 18px;
                  width: 18px;
                  height: 18px;
                }
              }
            }

            .detail-panel-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
              gap: 0;

              .detail-item {
                padding: 10px 16px;
                border-bottom: 1px solid #e3f2fd;
                border-right: 1px solid #e3f2fd;

                &.full-width {
                  grid-column: 1 / -1;
                }

                label {
                  display: block;
                  font-size: 0.75rem;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  color: #999;
                  margin-bottom: 4px;
                }

                span {
                  font-size: 0.9rem;
                  color: #333;
                  font-weight: 500;

                  &.mono {
                    font-family: monospace;
                    font-size: 0.8rem;
                    color: #555;
                    word-break: break-all;
                  }

                  &.amount-highlight {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #259ccb;
                  }

                  &.status-text {
                    font-weight: 600;
                  }
                }
              }
            }
          }
        }
        
        .empty-state, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 20px;
          text-align: center;
          
          .empty-icon, .error-icon {
            font-size: 64px;
            width: 64px;
            height: 64px;
            color: #ccc;
          }
          
          .error-icon {
            color: #f44336;
          }
          
          h3 {
            margin: 0;
            color: #333;
            font-size: 1.2rem;
          }
          
          p {
            margin: 0;
            color: #666;
            max-width: 400px;
          }
          
          .retry-button {
            display: flex;
            align-items: center;
            gap: 8px;
            
            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
        }
      }
      
      .dialog-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px 24px 24px;
        border-top: 1px solid #e0e0e0;
        
        .close-button {
          color: #666;
        }
        
        .export-button {
          display: flex;
          align-items: center;
          gap: 8px;
          
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }
    }
    
    @media (max-width: 768px) {
      .billing-history-dialog {
        width: 95vw !important;
        max-width: 95vw !important;
        margin: 10px !important;
        
        .dialog-content {
          .payment-history {
            .summary-card {
              .summary-content {
                grid-template-columns: 1fr;
                gap: 16px;
              }
            }
          }
        }
      }
    }

    @media (max-width: 600px) {
      .billing-history-dialog {
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        max-height: 100vh !important;
        
        .dialog-header {
          padding: 16px;
          
          h2 {
            font-size: 1.3rem;
          }
        }
        
        .dialog-content {
          padding: 16px;
          
          .payment-history {
            .summary-card {
              .summary-content {
                gap: 12px;
              }
            }
          }
        }
        
        .dialog-actions {
          padding: 16px;
          flex-direction: column;
          gap: 12px;
          
          button {
            width: 100%;
          }
        }
      }
    }

    @media (max-width: 480px) {
      .billing-history-dialog {
        .dialog-header {
          padding: 12px;
          
          h2 {
            font-size: 1.2rem;
          }
        }
        
        .dialog-content {
          padding: 12px;
          
          .payment-history {
            .summary-card {
              .summary-content {
                gap: 10px;
              }
            }
          }
        }
        
        .dialog-actions {
          padding: 12px;
        }
      }
    }
  `]
})
export class BillingHistoryDialogComponent implements OnInit, OnDestroy {
  paymentHistory: PaymentHistoryItem[] = [];
  loading = true;
  error: string | null = null;
  displayedColumns: string[] = ['status', 'planName', 'amount', 'period', 'paidAt', 'actions'];
  selectedPayment: PaymentHistoryItem | null = null;
  isAdmin = false;
  private subscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<BillingHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BillingHistoryDialogData,
    private subscriptionService: SubscriptionService,
    private subscriptionManagementService: SubscriptionManagementService,
    private tokenStorage: TokenStorageService,
    private toast: NgToastService,
    private errorHandler: SubscriptionErrorHandlerService
  ) {
    this.isAdmin = this.tokenStorage.getRole() === 'Admin';
  }

  ngOnInit(): void {
    this.loadPaymentHistory();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }


  loadPaymentHistory(): void {
    this.loading = true;
    this.error = null;

    // Determine which endpoint to use based on available data
    let paymentHistoryRequest;
    
    if (this.data.userId) {
      paymentHistoryRequest = this.subscriptionService.apiSubscriptionUserUserIdPaymentHistoryGet(this.data.userId);
    } else {
      this.error = 'Nuk ka të dhëna të mjaftueshme për të ngarkuar historinë e faturimit.';
      this.loading = false;
      return;
    }

    this.subscription.add(
      paymentHistoryRequest.subscribe({
        next: (payments: any[]) => {
          this.paymentHistory = payments.map(payment => this.mapPaymentToHistoryItem(payment));
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load payment history:', error);
          this.error = 'Dështoi të ngarkohej historia e faturimit.';
          this.loading = false;
          this.errorHandler.handleSubscriptionError(error, 'load payment history');
        }
      })
    );
  }

  private formatInterval(interval: string | null | undefined): string {
    switch (interval?.toLowerCase()) {
      case 'day':   return 'Ditore';
      case 'week':  return 'Javore';
      case 'month': return 'Mujore';
      case 'year':  return 'Vjetore';
      default:      return interval || 'N/A';
    }
  }

  private mapPaymentToHistoryItem(payment: any): PaymentHistoryItem {
    const statusInfo = this.getStatusInfo(payment.status);
    
    return {
      id: payment.id,
      subscriptionId: payment.subscriptionId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paidAt: payment.paidAt,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
      planName: payment.planName,
      subscriptionStatus: payment.subscriptionStatus,
      interval: this.formatInterval(payment.interval),
      stripeInvoiceId: payment.stripeInvoiceId || null,
      stripePaymentIntentId: payment.stripePaymentIntentId || null,
      formattedAmount: this.subscriptionManagementService.formatCurrency(payment.amount, payment.currency),
      formattedPaidAt: this.subscriptionManagementService.formatDate(payment.paidAt),
      formattedPeriodStart: this.subscriptionManagementService.formatDate(payment.periodStart),
      formattedPeriodEnd: this.subscriptionManagementService.formatDate(payment.periodEnd),
      statusColor: statusInfo.color,
      statusIcon: statusInfo.icon
    };
  }

  private getStatusInfo(status: string): { color: string; icon: string } {
    switch (status?.toLowerCase()) {
      case 'succeeded':
      case 'paid':
      case 'completed':
        return { color: '#4caf50', icon: 'check_circle' };
      case 'pending':
      case 'processing':
        return { color: '#ff9800', icon: 'pending' };
      case 'failed':
      case 'declined':
      case 'cancelled':
        return { color: '#f44336', icon: 'error' };
      case 'refunded':
        return { color: '#9c27b0', icon: 'undo' };
      default:
        return { color: '#666', icon: 'help' };
    }
  }

  getContrastColor(backgroundColor: string): string {
    // Simple contrast calculation - return white for dark colors, black for light colors
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128 ? '#000' : '#fff';
  }

  getTotalPayments(): string {
    const total = this.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    return this.subscriptionManagementService.formatCurrency(total, 'EUR');
  }

  getSuccessfulPayments(): number {
    return this.paymentHistory.filter(payment => 
      payment.status?.toLowerCase() === 'succeeded' || 
      payment.status?.toLowerCase() === 'paid'
    ).length;
  }

  getPendingPayments(): number {
    return this.paymentHistory.filter(payment => 
      payment.status?.toLowerCase() === 'pending' || 
      payment.status?.toLowerCase() === 'processing'
    ).length;
  }

  viewPaymentDetails(payment: PaymentHistoryItem): void {
    this.selectedPayment = this.selectedPayment?.id === payment.id ? null : payment;
  }

  downloadInvoice(payment: PaymentHistoryItem): void {
    const html = this.buildInvoiceHTML(payment);
    const win = window.open('', '_blank');
    if (!win) {
      this.toast.danger('Nuk mund të hapej dritarja e printimit. Kontrolloni bllokuesin e dritareve.', 'GABIM', 3000);
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  exportToPDF(): void {
    const html = this.buildHistoryReportHTML();
    const win = window.open('', '_blank');
    if (!win) {
      this.toast.danger('Nuk mund të hapej dritarja e printimit. Kontrolloni bllokuesin e dritareve.', 'GABIM', 3000);
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  private buildInvoiceHTML(payment: PaymentHistoryItem): string {
    const adminSection = this.isAdmin ? `
    <div class="section admin-section">
      <h3>Referenca Teknike (Admin)</h3>
      <div class="row"><span class="label">ID e Pagesës</span><span class="value stripe-ref">${payment.id}</span></div>
      <div class="row"><span class="label">ID e Abonimit</span><span class="value stripe-ref">${payment.subscriptionId}</span></div>
      ${payment.stripeInvoiceId ? `<div class="row"><span class="label">ID e Faturës (Stripe)</span><span class="value stripe-ref">${payment.stripeInvoiceId}</span></div>` : ''}
      ${payment.stripePaymentIntentId ? `<div class="row"><span class="label">ID e Pagesës (Stripe)</span><span class="value stripe-ref">${payment.stripePaymentIntentId}</span></div>` : ''}
    </div>` : '';

    return `<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="UTF-8">
  <title>Faturë - ${payment.planName} - ${payment.formattedPaidAt}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #333; padding: 40px; max-width: 800px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #259ccb; padding-bottom: 20px; }
    .company-name { font-size: 24px; font-weight: 700; color: #259ccb; }
    .invoice-title { font-size: 18px; font-weight: 600; text-align: right; }
    .invoice-date { font-size: 13px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 28px; }
    .section h3 { font-size: 13px; text-transform: uppercase; color: #999; letter-spacing: 0.05em; margin-bottom: 10px; }
    .admin-section h3 { color: #e65100; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .row .label { color: #666; }
    .row .value { font-weight: 500; }
    .total-row { display: flex; justify-content: space-between; padding: 16px; background: #f0f8fc; border-radius: 8px; margin-top: 16px; }
    .total-row .label { font-size: 16px; font-weight: 600; }
    .total-row .value { font-size: 20px; font-weight: 700; color: #259ccb; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #e8f5e9; color: #2e7d32; }
    .stripe-ref { font-size: 11px; color: #aaa; font-family: monospace; }
    .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">Brain Gain Albania</div>
    </div>
    <div>
      <div class="invoice-title">FATURË</div>
      <div class="invoice-date">${payment.formattedPaidAt}</div>
    </div>
  </div>

  <div class="section">
    <h3>Detajet e Abonimit</h3>
    <div class="row"><span class="label">Plani</span><span class="value">${payment.planName || 'N/A'}</span></div>
    <div class="row"><span class="label">Intervali i Faturimit</span><span class="value">${payment.interval || 'N/A'}</span></div>
    <div class="row"><span class="label">Statusi i Abonimit</span><span class="value">${payment.subscriptionStatus || 'N/A'}</span></div>
  </div>

  <div class="section">
    <h3>Periudha e Shërbimit</h3>
    <div class="row"><span class="label">Fillimi i Periudhës</span><span class="value">${payment.formattedPeriodStart}</span></div>
    <div class="row"><span class="label">Fundi i Periudhës</span><span class="value">${payment.formattedPeriodEnd}</span></div>
  </div>

  <div class="section">
    <h3>Pagesa</h3>
    <div class="row"><span class="label">Statusi</span><span class="value"><span class="status-badge">${payment.status}</span></span></div>
    <div class="row"><span class="label">Data e Pagesës</span><span class="value">${payment.formattedPaidAt}</span></div>
  </div>

  ${adminSection}

  <div class="total-row">
    <span class="label">Totali i Paguar</span>
    <span class="value">${payment.formattedAmount}</span>
  </div>

  <div class="footer">
    Brain Gain Albania &bull; Faturë e gjeneruar automatikisht &bull; ${new Date().toLocaleDateString('sq-AL')}
  </div>
</body>
</html>`;
  }

  private buildHistoryReportHTML(): string {
    const rows = this.paymentHistory.map(p => `
      <tr>
        <td>${p.formattedPaidAt}</td>
        <td>${p.planName || 'N/A'}</td>
        <td>${p.interval || 'N/A'}</td>
        <td>${p.status}</td>
        <td style="text-align:right; font-weight:600;">${p.formattedAmount}</td>
        <td>${p.formattedPeriodStart} → ${p.formattedPeriodEnd}</td>
        ${this.isAdmin ? `<td style="font-family:monospace; font-size:11px; color:#aaa;">${p.stripeInvoiceId || '-'}</td>` : ''}
      </tr>`).join('');

    const total = this.paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
    const formattedTotal = this.subscriptionManagementService.formatCurrency(total, 'EUR');
    const colspan = this.isAdmin ? 5 : 4;

    return `<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="UTF-8">
  <title>Historia e Faturimit - Brain Gain Albania</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #333; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #259ccb; padding-bottom: 16px; }
    .company-name { font-size: 22px; font-weight: 700; color: #259ccb; }
    .report-title { font-size: 16px; font-weight: 600; text-align: right; }
    .report-date { font-size: 12px; color: #666; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #259ccb; color: white; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) { background: #f9f9f9; }
    .total-row td { font-weight: 700; background: #f0f8fc; border-top: 2px solid #259ccb; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">Brain Gain Albania</div>
    <div>
      <div class="report-title">Historia e Faturimit</div>
      <div class="report-date">Gjeneruar: ${new Date().toLocaleDateString('sq-AL')}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Data e Pagesës</th>
        <th>Plani</th>
        <th>Intervali</th>
        <th>Statusi</th>
        <th style="text-align:right;">Shuma</th>
        <th>Periudha</th>
        ${this.isAdmin ? '<th>ID Faturës (Stripe)</th>' : ''}
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="${colspan}">Totali</td>
        <td style="text-align:right;">${formattedTotal}</td>
        <td></td>
        ${this.isAdmin ? '<td></td>' : ''}
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Brain Gain Albania &bull; Raport i gjeneruar automatikisht &bull; ${new Date().toLocaleDateString('sq-AL')}
  </div>
</body>
</html>`;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
