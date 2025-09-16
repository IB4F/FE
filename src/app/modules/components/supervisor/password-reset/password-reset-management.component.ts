import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgToastService } from 'ng-angular-popup';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupervisorService } from '../../../../api-client/api/supervisor.service';

interface PasswordResetRequest {
  studentId: string;
  studentEmail: string;
  studentName: string;
  reason: string;
}

@Component({
  selector: 'app-password-reset-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './password-reset-management.component.html',
  styleUrl: './password-reset-management.component.scss'
})
export class PasswordResetManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  pendingRequests: PasswordResetRequest[] = [];
  isLoading = false;
  error: string | null = null;
  isProcessingRequest = false;

  constructor(
    private supervisorService: SupervisorService,
    private toast: NgToastService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadPendingRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.location.back();
  }

  loadPendingRequests(): void {
    this.isLoading = true;
    this.error = null;
    
    this.supervisorService.apiSupervisorPasswordResetRequestsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PasswordResetRequest[]) => {
          this.pendingRequests = response;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading password reset requests:', error);
          this.error = error?.error?.message || 'Ndodhi një gabim gjatë ngarkimit të kërkesave';
          this.toast.danger(this.error || 'Ndodhi një gabim', 'Gabim', 3000);
          this.isLoading = false;
        }
      });
  }

  approveRequest(request: PasswordResetRequest): void {
    this.isProcessingRequest = true;
    
    this.supervisorService.apiSupervisorStudentsStudentIdPasswordResetPost(request.studentId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.toast.success('Kërkesa u pranua me sukses', 'Sukses', 3000);
          this.isProcessingRequest = false;
          // Redirect to dashboard after successful approval
          this.router.navigate(['/supervizor/dashboard']);
        },
        error: (error) => {
          console.error('Error approving request:', error);
          this.toast.danger(error?.error?.message || 'Ndodhi një gabim gjatë pranimit të kërkesës', 'Gabim', 3000);
          this.isProcessingRequest = false;
        }
      });
  }
}
