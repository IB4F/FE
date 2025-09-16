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
import { Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SupervisorService } from '../../../../api-client/api/supervisor.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

interface SupervisorDashboardData {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  pendingPasswordResetRequests: number;
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
    MatInputModule
  ],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrl: './supervisor-dashboard.component.scss'
})
export class SupervisorDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private currentSearchTerm: string = '';
  
  dashboardData: SupervisorDashboardData | null = null;
  isLoading = true;
  error: string | null = null;
  
  displayedColumns: string[] = ['name', 'email', 'class', 'progress', 'status', 'actions'];
  
  // Pagination properties
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
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
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

  private applyFilterToDataSource(): void {
    if (!this.dashboardData?.students) return;
    
    let filteredData = this.dashboardData.students;
    
    if (this.currentSearchTerm && this.currentSearchTerm.trim() !== '') {
      const searchTerm = this.currentSearchTerm.toLowerCase();
      filteredData = this.dashboardData.students.filter(student => 
        student.firstName.toLowerCase().includes(searchTerm) ||
        student.lastName.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.currentClass.toLowerCase().includes(searchTerm) ||
        student.school.toLowerCase().includes(searchTerm)
      );
    }
    
    this.dataSource.data = filteredData;
    this.length = filteredData.length;
    this.pageNumber = 0; // Reset to first page when filtering
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
}
