import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SupervisorService } from '../../../../api-client/api/supervisor.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import {TranslatePipe} from '../../../../pipes/translate.pipe';

interface SupervisorActivity {
  studentId: string;
  studentName: string;
  type: 'ok' | 'warn' | 'info' | 'default';
  description: string;
  timeAgo: string;
}

interface SupervisorDashboardData {
  totalStudents: number;
  activeStudents: number;
  newStudents: number;
  averageProgress: number;
  pendingPasswordResetRequests: number;
  weeklyProgressTrend: (number | null)[];
  recentActivities: SupervisorActivity[];
  students: SupervisorStudent[];
}

interface SupervisorStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  currentClass: string;
  school: string;
  dateOfBirth: string;
  isActive: boolean;
  progressPercentage: number;
  status: 'aktiv' | 'idle' | 'new';
}

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    TranslatePipe],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrl: './supervisor-dashboard.component.scss'
})
export class SupervisorDashboardComponent implements OnInit, OnDestroy {
  readonly Math = Math;

  get greeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Mirëmëngjes';
    if (h >= 12 && h < 18) return 'Mirëdita';
    return 'Mirëmbrëma';
  }

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private currentSearchTerm: string = '';

  dashboardData: SupervisorDashboardData | null = null;
  isLoading = true;
  error: string | null = null;
  activeFilter: 'all' | 'aktiv' | 'idle' | 'new' = 'all';

  directResetResult: { studentName: string; studentEmail: string; newPassword: string } | null = null;
  lastResetStudentId: string | null = null;
  pendingResetStudent: SupervisorStudent | null = null;
  resettingStudentId: string | null = null;

  private readonly SESSION_KEY = 'supervisor_direct_reset_result';

  displayedColumns: string[] = ['name', 'email', 'class', 'progress', 'status', 'actions'];

  dataSource = new MatTableDataSource<SupervisorStudent>([]);
  length: number = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pageNumber: number = 0;
  pageSize: number = this.pageSizeOptions[0];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private supervisorService: SupervisorService,
    private toast: NgToastService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const saved = sessionStorage.getItem(this.SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.directResetResult = parsed.result;
      this.lastResetStudentId = parsed.studentId ?? null;
    }
    this.loadDashboardData();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;
    
    this.supervisorService.apiSupervisorDashboardGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SupervisorDashboardData) => {
          this.dashboardData = response;
          // Update the dataSource with the students data
          this.dataSource.data = response.students;
          this.length = response.students.length;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading supervisor dashboard:', error);
          this.error = error?.error?.message || 'Ndodhi një gabim gjatë ngarkimit të dashboard-it';
          this.toast.danger(this.error || 'Ndodhi një gabim', 'Gabim', 3000);
          this.isLoading = false;
        }
      });
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  navigateToAddStudent(): void {
    this.router.navigate(['/supervizor/students']);
  }

  navigateToStudents(): void {
    this.router.navigate(['/supervizor/students']);
  }

  navigateToPasswordReset(): void {
    this.router.navigate(['/supervizor/password-reset']);
  }

  requestDirectReset(student: SupervisorStudent): void {
    this.pendingResetStudent = student;
    this.directResetResult = null;
  }

  cancelDirectReset(): void {
    this.pendingResetStudent = null;
  }

  confirmDirectReset(): void {
    if (!this.pendingResetStudent) return;
    const student = this.pendingResetStudent;
    this.resettingStudentId = student.studentId;
    this.pendingResetStudent = null;

    this.supervisorService.apiSupervisorStudentsStudentIdPasswordResetPost(student.studentId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { studentName: string; studentEmail: string; newPassword: string }) => {
          this.directResetResult = response;
          this.lastResetStudentId = student.studentId;
          sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
            result: response,
            studentId: student.studentId
          }));
          this.resettingStudentId = null;
        },
        error: (error: any) => {
          this.toast.danger(error?.error?.message || 'Ndodhi një gabim gjatë rivendosjes së fjalëkalimit', 'Gabim', 3000);
          this.resettingStudentId = null;
        }
      });
  }

  dismissDirectReset(): void {
    this.directResetResult = null;
    this.lastResetStudentId = null;
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  copyDirectResetPassword(): void {
    if (!this.directResetResult?.newPassword) return;
    navigator.clipboard.writeText(this.directResetResult.newPassword).then(() => {
      this.snackBar.open('Fjalëkalimi u kopjua', 'Mbyll', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    });
  }

  viewStudentProgressDetails(student: SupervisorStudent): void {
    this.router.navigate(['/supervizor/students', student.studentId, 'progress']);
  }


  deleteStudent(student: SupervisorStudent): void {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      data: {
        title: 'Fshi Studentin',
        message: `Jeni i sigurt që dëshironi të fshini studentin "${student.firstName} ${student.lastName}"? Ky veprim nuk mund të anulohet.`,
        id: student.studentId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.performDeleteStudent(student.studentId);
      }
    });
  }

  private performDeleteStudent(studentId: string): void {
    this.supervisorService.apiSupervisorStudentsStudentIdDelete(studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Studenti u fshi me sukses!', 'Sukses', 3000);
          this.loadDashboardData(); // Refresh the dashboard data
        },
        error: (error: any) => {
          console.error('Error deleting student:', error);
          this.toast.danger(error?.error?.message || 'Ndodhi një gabim gjatë fshirjes së studentit', 'Gabim', 3000);
        }
      });
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'primary' : 'warn';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Aktiv' : 'Joaktiv';
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'primary';
    if (progress >= 60) return 'accent';
    return 'warn';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Data e panjohur';
    const date = new Date(dateString);
    return date.toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // Pagination and search methods
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.currentSearchTerm = searchTerm;
      this.pageNumber = 0;
      this.applyFilterToDataSource();
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim();
    this.searchSubject.next(filterValue);
  }

  setFilter(filter: 'all' | 'aktiv' | 'idle' | 'new'): void {
    this.activeFilter = filter;
    this.pageNumber = 0;
    this.applyFilterToDataSource();
  }

  private applyFilterToDataSource(): void {
    if (!this.dashboardData?.students) return;

    let filteredData = this.dashboardData.students;

    if (this.activeFilter !== 'all') {
      filteredData = filteredData.filter(s => s.status === this.activeFilter);
    }

    if (this.currentSearchTerm.trim()) {
      const searchTerm = this.currentSearchTerm.toLowerCase();
      filteredData = filteredData.filter(student =>
        student.firstName.toLowerCase().includes(searchTerm) ||
        student.lastName.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.currentClass.toLowerCase().includes(searchTerm) ||
        student.school.toLowerCase().includes(searchTerm)
      );
    }

    this.dataSource.data = filteredData;
    this.length = filteredData.length;
    this.pageNumber = 0;
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getNoDataMessage(): string {
    if (this.currentSearchTerm && this.currentSearchTerm.trim() !== '') {
      return `Nuk u gjetën rezultate për kërkimin "${this.currentSearchTerm}". Provoni të ndryshoni termat e kërkimit.`;
    }
    return 'Nuk ka studentë të regjistruar. Mund të shtoni studentë të rinj duke përdorur butonin "Shto Student të Ri".';
  }

  // ── Display helpers for the redesigned template ──────────────────────────

  /** Returns 0–5 palette index from student full name */
  getAvatarIndex(fullName: string): number {
    let sum = 0;
    for (let i = 0; i < fullName.length; i++) { sum += fullName.charCodeAt(i); }
    return sum % 6;
  }

  /** Hex color based on progress percentage */
  getProgressColorHex(pct: number): string {
    if (pct > 70) return '#16A085';
    if (pct > 40) return '#2BA8DC';
    return '#D97706';
  }

  /** Sparkline polyline points for a 72×24 viewport */
  getSparkPoints(pct: number): string {
    const steps = [0, 10, 22, 16, 32, 40, 55, 65, 72];
    const heights = [20, 18, 14, 16, 10, 7, 5, 4, 4];
    const maxH = 20;
    const scale = Math.max(pct / 100, 0.05);
    return steps.map((x, i) => `${x},${22 - heights[i] * scale}`).join(' ');
  }

  get countAktiv(): number { return this.dashboardData?.students.filter(s => s.status === 'aktiv').length ?? 0; }
  get countIdle(): number  { return this.dashboardData?.students.filter(s => s.status === 'idle').length ?? 0; }
  get countNew(): number   { return this.dashboardData?.students.filter(s => s.status === 'new').length ?? 0; }

  getStatusLabel(status: 'aktiv' | 'idle' | 'new'): string {
    return { aktiv: 'Aktiv', idle: 'Joaktiv', new: 'I ri' }[status];
  }

  /** Generates SVG polyline points from weeklyProgressTrend (7 values) for a W×H viewport */
  getWeeklySparkPoints(trend: (number | null)[], width: number, height: number): string {
    const filled = this.forwardFill(trend);
    const min = Math.min(...filled);
    const max = Math.max(...filled);
    const range = max - min || 1;
    const pad = 4;
    return filled.map((v, i) => {
      const x = (i / (filled.length - 1)) * (width - 2) + 1;
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  getWeeklySparkArea(trend: (number | null)[], width: number, height: number): string {
    const pts = this.getWeeklySparkPoints(trend, width, height);
    const lastX = (width - 1).toFixed(1);
    return `${pts} L${lastX},${height - 1} L1,${height - 1} Z`;
  }

  private forwardFill(values: (number | null)[]): number[] {
    const result: number[] = [];
    let last = 0;
    for (const v of values) {
      last = v !== null && v !== undefined ? v : last;
      result.push(last);
    }
    return result;
  }

  /** Status label with progress logic — kept for backwards compat */
  getStudentStatusText(isActive: boolean, pct: number): string {
    if (pct === 0) return 'I ri';
    if (isActive && pct > 40) return 'Aktiv';
    return 'Joaktiv';
  }
}
