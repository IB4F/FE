import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({ name: 'translate', pure: false, standalone: true })
export class TranslatePipe implements PipeTransform {
  constructor(private svc: TranslationService) {}

  transform(key: string): string {
    return this.svc.translate(key);
  }
}
