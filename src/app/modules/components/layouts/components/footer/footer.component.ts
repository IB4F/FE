import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { PreferencesDialogComponent } from '../preferences-dialog/preferences-dialog.component';
import { TranslationService } from '../../../../../services/translation.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  
  get preferencesText(): string {
    return this.translationService.translate('preferences.title');
  }

  constructor(
    private dialog: MatDialog,
    private translationService: TranslationService
  ) {}

  openPreferences(): void {
    this.dialog.open(PreferencesDialogComponent, {
      width: '90%',
      maxWidth: '700px',
      disableClose: false,
      panelClass: 'preferences-dialog'
    });
  }
}
