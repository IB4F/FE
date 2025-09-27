import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription as SubscriptionModel, BillingInterval } from '../../../../api-client';
import { SubscriptionManagementService } from '../../../../services/subscription.service';
import { NgToastService } from 'ng-angular-popup';
import { SubscriptionErrorHandlerService } from '../../../../services/subscription-error-handler.service';
import { PackagesComponent } from '../../../shared/components/packages/packages.component';
import { Subscription } from 'rxjs';

export interface PlanChangeDialogData {
  currentSubscription: SubscriptionModel;
}

interface PlanOption {
  id: string;
  title: string;
  description: string;
  price: number;
  priceDisplay: string;
  isBestValue?: boolean;
  maxUsers?: number;
  isCurrentPlan?: boolean;
}

@Component({
  selector: 'app-plan-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PackagesComponent
  ],
  template: `
    <div class="plan-change-dialog">
      <div class="dialog-header">
        <mat-icon class="change-icon">swap_horiz</mat-icon>
        <h2>Ndrysho Planin</h2>
      </div>
      
      <div class="dialog-content">
        <!-- Current Plan Info -->
        <mat-card class="current-plan-card">
          <mat-card-content>
            <div class="current-plan-info">
              <mat-icon class="current-icon">check_circle</mat-icon>
              <div class="plan-details">
                <h3>Plani Aktual</h3>
                <p class="plan-name">{{ data.currentSubscription.subscriptionPackage?.name }}</p>
                <p class="plan-price">{{ getCurrentPlanPrice() }}</p>
                <p class="plan-interval">{{ getCurrentBillingInterval() }}</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Package Selection using existing component -->
        <div class="package-selection">
          <h3>Zgjidhni Planin e Ri</h3>
          <app-packages 
            #packagesComponent
            [userType]="getUserType()"
            [excludeCurrentPlan]="true"
            [currentPlanId]="data.currentSubscription.subscriptionPackageId">
          </app-packages>
        </div>

        <!-- Pro-ration Info -->
        <div class="pro-ration-info" *ngIf="hasSelectedPlan() && !isSamePlan()">
          <mat-icon>info</mat-icon>
          <div class="pro-ration-content">
            <h4>Informacion për Faturimin</h4>
            <p>
              Do të paguani një shumë pro-rata për ndryshimin e planit. 
              Krediti për periudhën e mbetur të planit aktual do të aplikohet automatikisht.
            </p>
          </div>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button 
          mat-stroked-button 
          (click)="onCancel()"
          class="cancel-button">
          Anulo
        </button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onConfirm()"
          [disabled]="!hasSelectedPlan() || isSamePlan() || processing"
          class="confirm-button">
          <mat-spinner *ngIf="processing" diameter="20" class="button-spinner"></mat-spinner>
          <mat-icon *ngIf="!processing">swap_horiz</mat-icon>
          {{ processing ? 'Duke ndryshuar...' : 'Ndrysho Planin' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .plan-change-dialog {
      padding: 0;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px 24px 16px 24px;
        border-bottom: 1px solid #e0e0e0;
        
        .change-icon {
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
        
        .current-plan-card {
          margin-bottom: 24px;
          border-left: 4px solid #4caf50;
          
          .current-plan-info {
            display: flex;
            align-items: center;
            gap: 16px;
            
            .current-icon {
              color: #4caf50;
              font-size: 32px;
              width: 32px;
              height: 32px;
            }
            
            .plan-details {
              h3 {
                margin: 0 0 4px 0;
                color: #333;
                font-size: 1.1rem;
              }
              
              .plan-name {
                margin: 0 0 4px 0;
                font-weight: 600;
                color: #4caf50;
              }
              
              .plan-price {
                margin: 0 0 4px 0;
                font-size: 1.2rem;
                font-weight: 600;
                color: #333;
              }
              
              .plan-interval {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
              }
            }
          }
        }
        
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
        
        .plan-selection {
          h3 {
            margin: 0 0 16px 0;
            color: #333;
            font-size: 1.2rem;
          }
          
          .billing-interval-section {
            margin-bottom: 24px;
            
            h4 {
              margin: 0 0 12px 0;
              color: #333;
              font-size: 1rem;
            }
            
            .billing-options {
              display: flex;
              gap: 16px;
              
              .billing-option {
                flex: 1;
                
                .billing-option-content {
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                  
                  .billing-label {
                    font-weight: 500;
                    color: #333;
                  }
                  
                  .billing-discount {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.85rem;
                    color: #4caf50;
                    
                    mat-icon {
                      font-size: 16px;
                      width: 16px;
                      height: 16px;
                    }
                  }
                }
              }
            }
          }
          
          .plan-options {
            h4 {
              margin: 0 0 16px 0;
              color: #333;
              font-size: 1rem;
            }
            
            .plans-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 16px;
              
              .plan-card {
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                
                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                
                &.selected {
                  border-color: #2196f3;
                  box-shadow: 0 0 0 1px #2196f3;
                }
                
                &.current-plan {
                  border-color: #4caf50;
                  background-color: #f8fff8;
                }
                
                &.recommended {
                  border-color: #ff9800;
                  background-color: #fff8f0;
                }
                
                .plan-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 12px;
                  
                  .plan-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    
                    h4 {
                      margin: 0;
                      font-size: 1.1rem;
                      color: #333;
                    }
                    
                    .current-badge {
                      color: #4caf50;
                      font-size: 20px;
                      width: 20px;
                      height: 20px;
                    }
                    
                    .recommended-badge {
                      color: #ff9800;
                      font-size: 20px;
                      width: 20px;
                      height: 20px;
                    }
                  }
                }
                
                .plan-description {
                  margin: 0 0 16px 0;
                  color: #666;
                  font-size: 0.9rem;
                  line-height: 1.4;
                }
                
                .plan-pricing {
                  .price-display {
                    margin-bottom: 8px;
                    
                    .price-amount {
                      font-size: 1.3rem;
                      font-weight: 600;
                      color: #333;
                    }
                    
                    .price-interval {
                      color: #666;
                      font-size: 0.9rem;
                    }
                  }
                  
                  .price-comparison {
                    .current-plan-text {
                      font-size: 0.8rem;
                      color: #4caf50;
                      font-weight: 500;
                    }
                  }
                }
              }
            }
          }
          
          .pro-ration-info {
            display: flex;
            gap: 12px;
            padding: 16px;
            background-color: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 8px;
            margin-top: 24px;
            
            mat-icon {
              color: #2196f3;
              font-size: 24px;
              width: 24px;
              height: 24px;
              flex-shrink: 0;
            }
            
            .pro-ration-content {
              h4 {
                margin: 0 0 8px 0;
                color: #333;
                font-size: 1rem;
              }
              
              p {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
                line-height: 1.4;
              }
            }
          }
        }
        
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 0;
          
          .error-icon {
            color: #f44336;
            font-size: 48px;
            width: 48px;
            height: 48px;
          }
          
          p {
            margin: 0;
            color: #666;
            text-align: center;
          }
        }
      }
      
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px 24px 24px;
        border-top: 1px solid #e0e0e0;
        
        .cancel-button {
          color: #666;
          border-color: #ccc;
        }
        
        .confirm-button {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .button-spinner {
            margin: 0;
          }
          
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }
    }
    
    @media (max-width: 768px) {
      .plan-change-dialog {
        width: 95vw !important;
        max-width: 95vw !important;
        margin: 10px !important;
        
        .dialog-content {
          .plan-selection {
            .plans-grid {
              grid-template-columns: 1fr;
            }
          }
        }
      }
    }

    @media (max-width: 600px) {
      .plan-change-dialog {
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
          
          .current-plan-card {
            margin-bottom: 16px;
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
      .plan-change-dialog {
        .dialog-header {
          padding: 12px;
          
          h2 {
            font-size: 1.2rem;
          }
        }
        
        .dialog-content {
          padding: 12px;
        }
        
        .dialog-actions {
          padding: 12px;
        }
      }
    }
  `]
})
export class PlanChangeDialogComponent implements OnInit {
  @ViewChild('packagesComponent') packagesComponent!: PackagesComponent;
  processing = false;
  private subscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<PlanChangeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlanChangeDialogData,
    private subscriptionManagementService: SubscriptionManagementService,
    private toast: NgToastService,
    private errorHandler: SubscriptionErrorHandlerService
  ) {}

  ngOnInit(): void {
    // No initialization needed as PackagesComponent handles its own loading
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getUserType(): string {
    // Determine user type from current subscription
    const registrationType = this.data.currentSubscription.registrationType;
    return registrationType || 'Student';
  }

  getCurrentPlanPrice(): string {
    const currentPlan = this.data.currentSubscription.subscriptionPackage;
    const amount = this.data.currentSubscription.amount || 0;
    const currency = this.data.currentSubscription.currency || 'EUR';
    return this.subscriptionManagementService.formatCurrency(amount, currency);
  }

  getCurrentBillingInterval(): string {
    const interval = this.data.currentSubscription.interval;
    if (typeof interval === 'number') {
      return this.subscriptionManagementService.getBillingIntervalText(interval);
    }
    return interval || 'Mujore';
  }

  hasSelectedPlan(): boolean {
    return this.packagesComponent && !!this.packagesComponent.selectedCard;
  }

  getSelectedPlan(): any {
    return this.packagesComponent?.selectedCard;
  }

  getSelectedBillingInterval(): string {
    const billingCycle = this.packagesComponent?.packegeForm?.value?.billingCycle;
    return billingCycle === 'monthly' ? 'muaj' : 'vit';
  }

  isSamePlan(): boolean {
    const selectedPlan = this.getSelectedPlan();
    if (!selectedPlan) return false;
    
    const currentPlanId = this.data.currentSubscription.subscriptionPackageId;
    const currentBillingInterval = this.data.currentSubscription.interval;
    const selectedBillingInterval = this.getSelectedBillingInterval() === 'muaj' ? 2 : 3;
    
    return selectedPlan.id === currentPlanId && currentBillingInterval === selectedBillingInterval;
  }


  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (!this.hasSelectedPlan() || this.isSamePlan()) {
      return;
    }

    const selectedPlan = this.getSelectedPlan();
    
    if (!selectedPlan) {
      this.toast.danger('Plani i zgjedhur nuk është valid.', 'GABIM', 3000);
      return;
    }

    this.processing = true;
    
    const billingInterval = this.getSelectedBillingInterval() === 'muaj' ? BillingInterval.NUMBER_2 : BillingInterval.NUMBER_3;
    
    this.subscription.add(
      this.subscriptionManagementService.changePlan(
        this.data.currentSubscription.id!,
        selectedPlan.id,
        billingInterval,
        true
      ).subscribe({
        next: () => {
          this.processing = false;
          this.toast.success('Plani u ndryshua me sukses!', 'SUKSES', 3000);
          this.dialogRef.close({
            success: true,
            newPlan: selectedPlan,
            billingInterval: billingInterval
          });
        },
        error: (error) => {
          console.error('Failed to change plan:', error);
          this.processing = false;
          this.errorHandler.handleSubscriptionError(error, 'change plan');
        }
      })
    );
  }
}
