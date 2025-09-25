import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface UnsubscribeDialogData {
  subscriptionName: string;
  subscriptionId: string;
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
            <span>Qasja juaj do të ndalojë menjëherë</span>
          </div>
          <div class="warning-item">
            <mat-icon>info</mat-icon>
            <span>Nuk do të mund të rifitoni qasjen pa regjistruar përsëri</span>
          </div>
          <div class="warning-item">
            <mat-icon>info</mat-icon>
            <span>Kjo veprim nuk mund të anulohet</span>
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
  `]
})
export class UnsubscribeConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<UnsubscribeConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnsubscribeDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close('cancel');
  }

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }
}
