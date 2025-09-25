import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tier-icon',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './tier-icon.component.html',
  styleUrl: './tier-icon.component.scss'
})
export class TierIconComponent {
  @Input() tier: string | null = null;

  getTierIcon(tier: string | null): string {
    if (!tier) return '';
    
    switch (tier.toLowerCase()) {
      case 'basic':
        return 'star';
      case 'standard':
        return 'star_half';
      case 'premium':
        return 'star';
      default:
        return 'star';
    }
  }

  getTierClass(tier: string | null): string {
    if (!tier) return '';
    
    switch (tier.toLowerCase()) {
      case 'basic':
        return 'tier-basic';
      case 'standard':
        return 'tier-standard';
      case 'premium':
        return 'tier-premium';
      default:
        return 'tier-basic';
    }
  }

  getTierText(tier: string | null): string {
    if (!tier) return '';
    
    switch (tier.toLowerCase()) {
      case 'basic':
        return 'Basic';
      case 'standard':
        return 'Standard';
      case 'premium':
        return 'Premium';
      default:
        return tier;
    }
  }
}
