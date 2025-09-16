import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { NgToastService } from 'ng-angular-popup';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {SupervisorService} from "../../../../api-client/api/supervisor.service";
import {CreateStudentBySupervisorDTO} from "../../../../api-client/model/createStudentBySupervisorDTO";
import {DetailsService} from "../../../../api-client/api/details.service";
import {Class} from "../../../../api-client/model/class";
import {UserService} from "../../../../services/user.service";
import {User} from "../../../../api-client";

interface SupervisorStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  generatedEmail: string;
  generatedPassword: string;
  currentClass: string;
  school: string;
  dateOfBirth: string;
  isActive: boolean;
  progressPercentage: number;
}

@Component({
  selector: 'app-students-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './students-management.component.html',
  styleUrl: './students-management.component.scss'
})
export class StudentsManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Create student form
  createStudentForm!: FormGroup;
  isCreatingStudent = false;
  createdStudent: SupervisorStudent | null = null;
  classesList: Class[] = [];
  currentUser: User | null = null;

  constructor(
    private supervisorService: SupervisorService,
    private formBuilder: FormBuilder,
    private toast: NgToastService,
    private router: Router,
    private location: Location,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private detailsService: DetailsService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadClassesList();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser(): void {
    this.userService.loadUserData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User | null) => {
          this.currentUser = user;
          this.initializeCreateStudentForm();
        },
        error: (error) => {
          console.error('Error loading current user:', error);
          this.toast.danger('Ndodhi një gabim gjatë ngarkimit të të dhënave të përdoruesit', 'Gabim', 3000);
        }
      });
  }

  initializeCreateStudentForm(): void {
    const schoolValue = this.currentUser?.school || '';
    
    this.createStudentForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      currentClass: ['', [Validators.required]],
      school: [{ value: schoolValue, disabled: true }, [Validators.required]],
      dateOfBirth: ['', [Validators.required]]
    });
  }

  goBack(): void {
    this.location.back();
  }

  loadClassesList(): void {
    this.detailsService.apiDetailsGetClassGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Class[]) => {
          this.classesList = response;
        },
        error: (error) => {
          console.error('Error loading classes list:', error);
          this.toast.danger('Ndodhi një gabim gjatë ngarkimit të listës së klasave', 'Gabim', 3000);
        }
      });
  }


  createStudent(): void {
    if (this.createStudentForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isCreatingStudent = true;
    
    // Get form values and ensure school is included (even if disabled)
    const formValue = this.createStudentForm.getRawValue();
    const studentData: CreateStudentBySupervisorDTO = {
      ...formValue,
      school: this.currentUser?.school || formValue.school, // Ensure school is from current user
      dateOfBirth: new Date(formValue.dateOfBirth).toISOString()
    };

    this.supervisorService.apiSupervisorStudentsPost(studentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SupervisorStudent) => {
          this.createdStudent = response;
          this.toast.success('Studenti u krijua me sukses!', 'Sukses', 3000);
          this.createStudentForm.reset();
          this.initializeCreateStudentForm(); // Re-initialize to set school again
          this.isCreatingStudent = false;
        },
        error: (error:any) => {
          console.error('Error creating student:', error);
          this.toast.danger(error?.error?.message || 'Ndodhi një gabim gjatë krijimit të studentit', 'Gabim', 3000);
          this.isCreatingStudent = false;
        }
      });
  }

  clearCreatedStudent(): void {
    this.createdStudent = null;
  }

  copyToClipboard(text: string, type: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open(`${type} u kopjua në clipboard`, 'Mbyll', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }).catch(() => {
      this.toast.warning('Nuk mund të kopjohet në clipboard', 'Vërejtje', 2000);
    });
  }

  getClassName(classId: string): string {
    const classObj = this.classesList.find(c => c.id === classId);
    return classObj?.name || classId;
  }


  private markFormGroupTouched(): void {
    Object.keys(this.createStudentForm.controls).forEach(key => {
      const control = this.createStudentForm.get(key);
      control?.markAsTouched();
    });
  }
}
