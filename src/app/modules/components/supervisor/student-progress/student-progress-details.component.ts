import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgToastService } from 'ng-angular-popup';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {SupervisorService} from "../../../../api-client";

interface StudentProgressResponse {
  studentId: string;
  studentName: string;
  overallProgress: number;
  totalLinks: number;
  completedLinks: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  totalPointsEarned: number;
  totalPossiblePoints: number;
  totalTimeSpentMinutes: number;
  firstActivityAt: string | null;
  lastActivityAt: string | null;
  linkProgress: LinkProgress[];
  generatedPassword?: string;
}

interface LinkProgress {
  linkId: string;
  linkTitle: string;
  learnHubId: string;
  learnHubTitle: string;
  progressPercentage: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  pointsEarned: number;
  possiblePoints: number;
  timeSpentMinutes: number;
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
  isCompleted: boolean;
}

@Component({
  selector: 'app-student-progress-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './student-progress-details.component.html',
  styleUrl: './student-progress-details.component.scss'
})
export class StudentProgressDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  studentId: string | null = null;
  progressDetails: StudentProgressResponse | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private supervisorService: SupervisorService,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('studentId');
    if (this.studentId) {
      this.loadStudentProgressDetails();
    } else {
      this.error = 'ID-ja e studentit nuk u gjet';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.location.back();
  }

  private loadStudentProgressDetails(): void {
    if (!this.studentId) return;

    this.isLoading = true;
    this.error = null;

    this.supervisorService.apiSupervisorStudentsStudentIdProgressDetailGet(this.studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: StudentProgressResponse) => {
          this.progressDetails = response;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading student progress details:', error);
          this.error = error?.error?.message || 'Ndodhi një gabim gjatë ngarkimit të detajeve të progresit';
          this.toast.danger(this.error || 'Ndodhi një gabim', 'Gabim', 3000);
          this.isLoading = false;
        }
      });
  }

  formatTime(minutes: number): string {
    if (minutes === 0) return '0 min';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${remainingMinutes} min`;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('sq-AL');
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'primary';
    if (progress >= 60) return 'accent';
    return 'warn';
  }

  refreshData(): void {
    this.loadStudentProgressDetails();
  }

  getProgressPercentage(): number {
    return this.progressDetails?.overallProgress || 0;
  }

  copyPassword(password: string): void {
    navigator.clipboard.writeText(password).then(() => {
      this.toast.success('Fjalëkalimi u kopjua me sukses!', 'Sukses', 2000);
    }).catch(() => {
      this.toast.danger('Gabim gjatë kopjimit të fjalëkalimit', 'Gabim', 2000);
    });
  }
}
