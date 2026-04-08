import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation.service';

/**
 * Impure pipe: re-evaluated on every change-detection cycle.
 * Zone.js ensures CD runs after language JSON loads or after user changes language.
 *
 * Usage in templates: {{ 'key' | translate }}
 *          bindings: [attr]="'key' | translate"
 */
@Pipe({ name: 'translate', pure: false, standalone: true })
export class TranslatePipe implements PipeTransform {
  constructor(private translationService: TranslationService) {}

  transform(key: string): string {
    return this.translationService.translate(key);
  }
}