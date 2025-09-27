import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface UnsubscribeDialogData {
  subscriptionName: string;
  subscriptionId: string;
  endDate?: string;
}

@Component({
  selector: 'app-unsubscribe-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="unsubscribe-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2>Konfirmo Ç'regjistrimin</h2>
      </div>
      
      <div class="dialog-content">
        <p class="warning-text">
          A jeni të sigurt që dëshironi të ç'regjistroheni nga <strong>{{ data.subscriptionName }}</strong>?
        </p>
        
        <div class="warning-details">
          <div class="warning-item">
            <mat-icon>info</mat-icon>
            <span>Do të ruani qasjen deri në <strong>{{ getFormattedEndDate() }}</strong></span>
          </div>
          <div class="warning-item">
            <mat-icon>info</mat-icon>
            <span>Nuk do të paguani më për këtë abonim pas kësaj date</span>
          </div>
          <div class="warning-item">
            <mat-icon>info</mat-icon>
            <span>Mund të regjistroheni përsëri në çdo kohë</span>
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
          color="warn" 
          (click)="onConfirm()"
          class="confirm-button">
          <mat-icon>exit_to_app</mat-icon>
          Ç'regjistrohu
        </button>
      </div>
    </div>
  `,
  styles: [`
    .unsubscribe-dialog {
      padding: 0;
      
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px 24px 16px 24px;
        border-bottom: 1px solid #e0e0e0;
        
        .warning-icon {
          color: #f44336;
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
        
        .warning-text {
          font-size: 1.1rem;
          color: #333;
          margin-bottom: 20px;
          line-height: 1.5;
          
          strong {
            color: #f44336;
          }
        }
        
        .warning-details {
          background-color: #fff3e0;
          border: 1px solid #ffcc02;
          border-radius: 8px;
          padding: 16px;
          
          .warning-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 0.95rem;
            color: #666;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
              color: #f57c00;
            }
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
          background-color: #f44336;
          color: white;
          
          &:hover {
            background-color: #d32f2f;
          }
          
          mat-icon {
            margin-right: 8px;
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }
    }

    // Responsive Design
    @media (max-width: 768px) {
      .unsubscribe-dialog {
        width: 95vw !important;
        max-width: 95vw !important;
        margin: 10px !important;
      }
    }

    @media (max-width: 600px) {
      .unsubscribe-dialog {
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
          
          .warning-text {
            font-size: 0.95rem;
          }
          
          .warning-details {
            .warning-item {
              span {
                font-size: 0.9rem;
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
      .unsubscribe-dialog {
        .dialog-header {
          padding: 12px;
          
          h2 {
            font-size: 1.2rem;
          }
        }
        
        .dialog-content {
          padding: 12px;
          
          .warning-text {
            font-size: 0.9rem;
          }
          
          .warning-details {
            .warning-item {
              span {
                font-size: 0.85rem;
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
export class UnsubscribeConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<UnsubscribeConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnsubscribeDialogData
  ) {}

  getFormattedEndDate(): string {
    if (!this.data.endDate) {
      return 'fund të periudhës së faturimit';
    }
    
    try {
      const date = new Date(this.data.endDate);
      return date.toLocaleDateString('sq-AL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'fund të periudhës së faturimit';
    }
  }

  onCancel(): void {
    this.dialogRef.close('cancel');
  }

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }
}
