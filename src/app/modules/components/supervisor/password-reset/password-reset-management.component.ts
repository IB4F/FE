import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgToastService } from 'ng-angular-popup';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupervisorService } from '../../../../api-client/api/supervisor.service';
import {TranslatePipe} from '../../../../pipes/translate.pipe';

interface PasswordResetRequest {
  studentId: string;
  studentEmail: string;
  studentName: string;
  reason: string;
}

interface ApprovalResult {
  studentName: string;
  studentEmail: string;
  newPassword: string;
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
    MatTooltipModule,
    MatSnackBarModule,
    TranslatePipe],
  templateUrl: './password-reset-management.component.html',
  styleUrl: './password-reset-management.component.scss'
})
export class PasswordResetManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  pendingRequests: PasswordResetRequest[] = [];
  isLoading = false;
  error: string | null = null;
  isProcessingRequest = false;
  approvalResult: ApprovalResult | null = null;

  constructor(
    private supervisorService: SupervisorService,
    private toast: NgToastService,
    private router: Router,
    private location: Location,
    private snackBar: MatSnackBar
  ) {}

  private readonly SESSION_KEY = 'supervisor_approval_result';

  ngOnInit(): void {
    const saved = sessionStorage.getItem(this.SESSION_KEY);
    if (saved) {
      this.approvalResult = JSON.parse(saved);
    }
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
        next: (response: ApprovalResult) => {
          this.approvalResult = response;
          sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(response));
          this.isProcessingRequest = false;
        },
        error: (error) => {
          console.error('Error approving request:', error);
          this.toast.danger(error?.error?.message || 'Ndodhi një gabim gjatë pranimit të kërkesës', 'Gabim', 3000);
          this.isProcessingRequest = false;
        }
      });
  }

  rejectRequest(request: PasswordResetRequest): void {
    this.isProcessingRequest = true;

    this.supervisorService.apiSupervisorStudentsStudentIdPasswordResetPost(request.studentId, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Kërkesa u refuzua', 'Sukses', 3000);
          this.isProcessingRequest = false;
          this.loadPendingRequests();
        },
        error: (error) => {
          console.error('Error rejecting request:', error);
          this.toast.danger(error?.error?.message || 'Ndodhi një gabim gjatë refuzimit të kërkesës', 'Gabim', 3000);
          this.isProcessingRequest = false;
        }
      });
  }

  copyPassword(): void {
    if (!this.approvalResult?.newPassword) return;
    navigator.clipboard.writeText(this.approvalResult.newPassword).then(() => {
      this.snackBar.open('Fjalëkalimi u kopjua', 'Mbyll', { duration: 2000, horizontalPosition: 'center', verticalPosition: 'top' });
    });
  }

  dismissApprovalResult(): void {
    this.approvalResult = null;
    sessionStorage.removeItem(this.SESSION_KEY);
    this.loadPendingRequests();
  }
}
