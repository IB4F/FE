import { Component, Inject, OnInit } from '@angular/core';
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
import { NgToastService } from 'ng-angular-popup';
import { SubscriptionErrorHandlerService } from '../../../../services/subscription-error-handler.service';
import { Subscription } from 'rxjs';

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
    MatTooltipModule
  ],
  template: `
    <div class="billing-history-dialog">
      <div class="dialog-header">
        <mat-icon class="history-icon">receipt</mat-icon>
        <h2>Historia e Faturimit</h2>
      </div>
      
      <div class="dialog-content">
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Duke ngarkuar historinë e faturimit...</p>
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
                    <span class="summary-label">Total Pagesa</span>
                    <span class="summary-value">{{ getTotalPayments() }}</span>
                  </div>
                </div>
                <div class="summary-item">
                  <mat-icon class="summary-icon">check_circle</mat-icon>
                  <div class="summary-details">
                    <span class="summary-label">Pagesa të Suksesshme</span>
                    <span class="summary-value">{{ getSuccessfulPayments() }}</span>
                  </div>
                </div>
                <div class="summary-item">
                  <mat-icon class="summary-icon">pending</mat-icon>
                  <div class="summary-details">
                    <span class="summary-label">Pagesa në Pritje</span>
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
                <th mat-header-cell *matHeaderCellDef>Statusi</th>
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
                <th mat-header-cell *matHeaderCellDef>Plani</th>
                <td mat-cell *matCellDef="let payment">
                  <div class="plan-info">
                    <span class="plan-name">{{ payment.planName }}</span>
                    <span class="plan-interval">{{ payment.interval }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Shuma</th>
                <td mat-cell *matCellDef="let payment">
                  <span class="amount">{{ payment.formattedAmount }}</span>
                </td>
              </ng-container>

              <!-- Period Column -->
              <ng-container matColumnDef="period">
                <th mat-header-cell *matHeaderCellDef>Periudha</th>
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
                <th mat-header-cell *matHeaderCellDef>Data e Pagesës</th>
                <td mat-cell *matCellDef="let payment">
                  <div class="paid-date">
                    <mat-icon class="date-icon">event</mat-icon>
                    <span>{{ payment.formattedPaidAt }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Veprimet</th>
                <td mat-cell *matCellDef="let payment">
                  <button 
                    mat-icon-button 
                    [matTooltip]="'Shiko detajet e pagesës'"
                    (click)="viewPaymentDetails(payment)"
                    class="action-button">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button 
                    mat-icon-button 
                    [matTooltip]="'Shkarko faturën'"
                    (click)="downloadInvoice(payment)"
                    class="action-button"
                    *ngIf="payment.status === 'Succeeded'">
                    <mat-icon>download</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && paymentHistory.length === 0" class="empty-state">
          <mat-icon class="empty-icon">receipt_long</mat-icon>
          <h3>Nuk ka pagesa të regjistruara</h3>
          <p>Nuk ka pagesa të disponueshme për këtë abonim.</p>
          <button mat-button (click)="loadPaymentHistory()" class="retry-button">
            <mat-icon>refresh</mat-icon>
            Rifresko
          </button>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="error-state">
          <mat-icon class="error-icon">error</mat-icon>
          <h3>Gabim në ngarkimin e historisë</h3>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="loadPaymentHistory()" class="retry-button">
            <mat-icon>refresh</mat-icon>
            Provo përsëri
          </button>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button 
          mat-button 
          (click)="onClose()"
          class="close-button">
          Mbyll
        </button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="exportToPDF()"
          [disabled]="paymentHistory.length === 0"
          class="export-button">
          <mat-icon>picture_as_pdf</mat-icon>
          Eksporto në PDF
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
export class BillingHistoryDialogComponent implements OnInit {
  paymentHistory: PaymentHistoryItem[] = [];
  loading = false;
  error: string | null = null;
  displayedColumns: string[] = ['status', 'planName', 'amount', 'period', 'paidAt', 'actions'];
  private subscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<BillingHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BillingHistoryDialogData,
    private subscriptionService: SubscriptionService,
    private subscriptionManagementService: SubscriptionManagementService,
    private toast: NgToastService,
    private errorHandler: SubscriptionErrorHandlerService
  ) {}

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
    
    if (this.data.subscriptionId) {
      // If we have subscription ID, get payment history for specific subscription
      paymentHistoryRequest = this.subscriptionService.apiSubscriptionUserUserIdPaymentHistoryGet(this.data.subscriptionId);
    } else if (this.data.userId) {
      // If we have user ID, get payment history for user
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
      interval: payment.interval,
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
    // TODO: Implement payment details modal
    this.toast.info('Detajet e pagesës do të jenë të disponueshme së shpejti.', 'INFO', 3000);
  }

  downloadInvoice(payment: PaymentHistoryItem): void {
    // TODO: Implement invoice download
    this.toast.info('Shkarkimi i faturës do të jetë i disponueshëm së shpejti.', 'INFO', 3000);
  }

  exportToPDF(): void {
    // TODO: Implement PDF export
    this.toast.info('Eksportimi në PDF do të jetë i disponueshëm së shpejti.', 'INFO', 3000);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
