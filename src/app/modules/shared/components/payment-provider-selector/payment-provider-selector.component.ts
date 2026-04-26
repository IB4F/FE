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
}

@Component({
  selector: 'app-payment-provider-selector',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './payment-provider-selector.component.html',
  styleUrl: './payment-provider-selector.component.scss'
})
export class PaymentProviderSelectorComponent implements OnInit {
  @Input() selectedProvider: string = 'Novalnet';
  @Output() providerChange = new EventEmitter<string>();

  cardProviders: ProviderOption[] = [
    {
      value: 'Stripe',
      shortLabel: 'Stripe',
      sublabel: 'Visa / Mastercard (ndërkombëtare)',
      icon: 'credit_card'
    },
    {
      value: 'Novalnet',
      shortLabel: 'Novalnet',
      sublabel: 'Visa / Mastercard / Maestro',
      icon: 'credit_card',
      recommended: true
    },
    {
      value: 'Paddle',
      shortLabel: 'Paddle',
      sublabel: 'Checkout ndërkombëtar',
      icon: 'language'
    }
  ];

  bankProviders: ProviderOption[] = [
    {
      value: 'BKT',
      shortLabel: 'BKT',
      sublabel: 'Bankë Kombëtare Tregtare',
      icon: 'account_balance'
    },
    {
      value: 'Raiffeisen',
      shortLabel: 'Raiffeisen',
      sublabel: 'Raiffeisen Bank Albania',
      icon: 'account_balance'
    }
  ];

  ngOnInit(): void {
    this.providerChange.emit(this.selectedProvider);
  }

  select(provider: string): void {
    this.selectedProvider = provider;
    this.providerChange.emit(provider);
  }
}