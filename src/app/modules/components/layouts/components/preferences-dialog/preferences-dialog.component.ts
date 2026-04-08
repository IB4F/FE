import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { DyslexicFontService } from '../../../../../services/dyslexic-font.service';
import { TranslationService, Language } from '../../../../../services/translation.service';

@Component({
  selector: 'app-preferences-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './preferences-dialog.component.html',
  styleUrl: './preferences-dialog.component.scss'
})
export class PreferencesDialogComponent {
  isDyslexicFontEnabled$ = this.dyslexicFontService.isEnabled$;
  selectedLanguage: Language = this.translationService.getCurrentLanguage();

  private destroyRef = inject(DestroyRef);

  // Translations
  get title(): string {
    return this.translationService.translate('preferences.title');
  }

  get description(): string {
    return this.translationService.translate('preferences.description');
  }

  get dyslexicFontTitle(): string {
    return this.translationService.translate('preferences.dyslexicFont.title');
  }

  get dyslexicFontSubtitle(): string {
    return this.translationService.translate('preferences.dyslexicFont.subtitle');
  }

  get dyslexicFontInfoTitle(): string {
    return this.translationService.translate('preferences.dyslexicFont.info.title');
  }

  get dyslexicFontInfoDescription(): string {
    return this.translationService.translate('preferences.dyslexicFont.info.description');
  }

  get languageLabel(): string {
    return this.translationService.translate('preferences.language.label');
  }

  get languageSubtitle(): string {
    return this.translationService.translate('preferences.language.subtitle');
  }

  get closeButton(): string {
    return this.translationService.translate('preferences.close');
  }

  get availableLanguages() {
    return this.translationService.availableLanguages;
  }

  constructor(
    private dyslexicFontService: DyslexicFontService,
    private translationService: TranslationService,
    private dialogRef: MatDialogRef<PreferencesDialogComponent>
  ) {
    this.translationService.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(lang => {
        console.log('[PreferencesDialog] currentLanguage$ emitted:', lang);
        this.selectedLanguage = lang;
      });
  }

  toggleDyslexicFont(): void {
    this.dyslexicFontService.toggle();
  }

  onLanguageChange(language: Language): void {
    console.log('[PreferencesDialog] onLanguageChange called:', language);
    this.translationService.setLanguage(language);
  }

  close(): void {
    this.dialogRef.close();
  }
}


