import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type PaymentProvider = 'Stripe' | 'Novalnet' | 'Paddle' | 'BKT' | 'Raiffeisen';

interface ProviderOption {
  value: string;
  shortLabel: string;
  sublabel: string;
  icon: string;
  recommended?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-payment-provider-selector',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './payment-provider-selector.component.html',
  styleUrl: './payment-provider-selector.component.scss'
})
export class PaymentProviderSelectorComponent implements OnInit {
  @Input() selectedProvider: string = 'Paddle';
  @Output() providerChange = new EventEmitter<string>();

  cardProviders: ProviderOption[] = [
    {
      value: 'Paddle',
      shortLabel: 'Paddle',
      sublabel: 'Checkout ndërkombëtar',
      icon: 'language',
      recommended: true
    },
    {
      value: 'Novalnet',
      shortLabel: 'Novalnet',
      sublabel: 'Visa / Mastercard / Maestro',
      icon: 'credit_card',
      disabled: true
    }
  ];

  bankProviders: ProviderOption[] = [
    {
      value: 'BKT',
      shortLabel: 'BKT',
      sublabel: 'Bankë Kombëtare Tregtare',
      icon: 'account_balance',
      disabled: true
    },
    {
      value: 'Raiffeisen',
      shortLabel: 'Raiffeisen',
      sublabel: 'Raiffeisen Bank Albania',
      icon: 'account_balance',
      disabled: true
    }
  ];

  ngOnInit(): void {
    this.providerChange.emit(this.selectedProvider);
  }

  select(provider: ProviderOption): void {
    if (provider.disabled) return;
    this.selectedProvider = provider.value;
    this.providerChange.emit(provider.value);
  }
}
