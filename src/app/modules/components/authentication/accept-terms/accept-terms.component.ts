import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgToastService } from 'ng-angular-popup';
import { TokenStorageService } from '../../../../services/token-storage.service';
import { environment } from '@env';

@Component({
  selector: 'app-accept-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accept-terms.component.html',
  styleUrl: './accept-terms.component.scss'
})
export class AcceptTermsComponent {
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toast: NgToastService,
    private tokenStorage: TokenStorageService
  ) {}

  accept() {
    this.loading = true;
    this.http.post(`${environment.apiUrl}/api/Auth/accept-terms`, {}).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.toast.danger(err?.error?.message || 'Ndodhi një gabim', 'GABIM', 4000);
      }
    });
  }

  logout() {
    this.tokenStorage.clearTokens();
    this.router.navigate(['/hyr']);
  }
}
