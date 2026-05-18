import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { PreferencesDialogComponent } from '../preferences-dialog/preferences-dialog.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();

  constructor(private dialog: MatDialog) {}

  openPreferences(): void {
    (document.activeElement as HTMLElement)?.blur();
    this.dialog.open(PreferencesDialogComponent, {
      width: '90%',
      maxWidth: '700px',
      disableClose: false,
      panelClass: 'preferences-dialog'
    });
  }
}
