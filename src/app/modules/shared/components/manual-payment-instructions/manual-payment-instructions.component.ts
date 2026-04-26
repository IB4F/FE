import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgToastService } from 'ng-angular-popup';
import { Router } from '@angular/router';

export interface ManualPaymentDetails {
  bankName: string;
  iban: string;
  accountHolder: string;
  reference: string;
  amountCents: number;
  currency: string;
  instructions: string;
}

@Component({
  selector: 'app-manual-payment-instructions',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './manual-payment-instructions.component.html',
  styleUrl: './manual-payment-instructions.component.scss'
})
export class ManualPaymentInstructionsComponent {
  @Input() details!: ManualPaymentDetails;
  @Input() provider!: string;

  constructor(private toast: NgToastService, private router: Router) {}

  get amountFormatted(): string {
    return `${(this.details.amountCents / 100).toFixed(2)} ${this.details.currency}`;
  }

  copy(text: string, label: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success(`${label} u kopjua!`, 'SUKSES', 2000);
    });
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}