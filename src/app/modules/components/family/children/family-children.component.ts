import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgToastService } from 'ng-angular-popup';

import { FamilyService } from '../../../../api-client/api/family.service';
import { DetailsService } from '../../../../api-client/api/details.service';
import { ChildSummaryDto } from '../../../../api-client/model/childSummaryDto';
import { ChildCreatedDto } from '../../../../api-client/model/childCreatedDto';
import { Class } from '../../../../api-client/model/class';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-family-children',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './family-children.component.html',
  styleUrl: './family-children.component.scss'
})
export class FamilyChildrenComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  activeChildren: ChildSummaryDto[] = [];
  inactiveChildren: ChildSummaryDto[] = [];
  classes: Class[] = [];
  isLoading = true;
  isSubmitting = false;
  showInactive = false;

  showAddForm = false;
  addForm!: FormGroup;

  editingChildId: string | null = null;
  editForm!: FormGroup;

  newlyCreatedChild: ChildCreatedDto | null = null;
  copiedField: string | null = null;

  resettingChildId: string | null = null;
  resetResult: { childId: string; password: string } | null = null;

  private readonly STORAGE_KEY = 'family_new_child_credentials';
  private readonly RESET_STORAGE_KEY = 'family_reset_password';

  reactivatingChildId: string | null = null;

  constructor(
    private familyService: FamilyService,
    private detailsService: DetailsService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.loadClasses();
    this.loadChildren();
    this.restoreCredentials();
  }

  private restoreCredentials(): void {
    const stored = sessionStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try { this.newlyCreatedChild = JSON.parse(stored); }
      catch { sessionStorage.removeItem(this.STORAGE_KEY); }
    }

    const storedReset = sessionStorage.getItem(this.RESET_STORAGE_KEY);
    if (storedReset) {
      try { this.resetResult = JSON.parse(storedReset); }
      catch { sessionStorage.removeItem(this.RESET_STORAGE_KEY); }
    }
  }

  private buildForms(): void {
    this.addForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      currentClass: ['', Validators.required]
    });
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      currentClass: ['', Validators.required]
    });
  }

  private loadClasses(): void {
    this.detailsService.apiDetailsGetClassGet().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (classes) => this.classes = classes,
      error: () => this.toast.danger('Nuk u ngarkuan klasat.', 'GABIM', 3000)
    });
  }

  loadChildren(): void {
    this.isLoading = true;
    this.familyService.apiFamilyChildrenGet().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        const all = res.children ?? [];
        this.activeChildren = all.filter(c => c.isActive);
        this.inactiveChildren = all.filter(c => !c.isActive);
        this.isLoading = false;
      },
      error: () => {
        this.toast.danger('Nuk u ngarkuan fëmijët.', 'GABIM', 3000);
        this.isLoading = false;
      }
    });
  }

  getClassName(classId: string | null | undefined): string {
    if (!classId) return '—';
    const found = this.classes.find(c => c.id === classId || c.name === classId);
    return found?.name ?? classId;
  }

  // Add child
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    this.newlyCreatedChild = null;
    if (!this.showAddForm) this.addForm.reset();
  }

  submitAdd(): void {
    if (this.addForm.invalid) return;
    this.isSubmitting = true;
    this.familyService.apiFamilyChildrenPost(this.addForm.value).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (child) => {
        this.newlyCreatedChild = child;
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(child));
        this.addForm.reset();
        this.showAddForm = false;
        this.loadChildren();
        this.isSubmitting = false;
        this.toast.success('Fëmija u shtua me sukses.', 'SUKSES', 3000);
      },
      error: (err) => {
        this.toast.danger(err?.error?.message ?? 'Ndodhi një gabim.', 'GABIM', 3000);
        this.isSubmitting = false;
      }
    });
  }

  // Edit child
  startEdit(child: ChildSummaryDto): void {
    this.editingChildId = child.id ?? null;
    this.editForm.patchValue({
      firstName: child.firstName,
      lastName: child.lastName,
      currentClass: child.currentClass
    });
  }

  cancelEdit(): void {
    this.editingChildId = null;
    this.editForm.reset();
  }

  submitEdit(childId: string): void {
    if (this.editForm.invalid) return;
    this.isSubmitting = true;
    this.familyService.apiFamilyChildrenIdPatch(childId, this.editForm.value).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadChildren();
        this.cancelEdit();
        this.isSubmitting = false;
        this.toast.success('Të dhënat u përditësuan.', 'SUKSES', 3000);
      },
      error: () => {
        this.toast.danger('Ndodhi një gabim gjatë përditësimit.', 'GABIM', 3000);
        this.isSubmitting = false;
      }
    });
  }

  // Password reset
  resetPassword(child: ChildSummaryDto): void {
    if (!child.id) return;
    this.resettingChildId = child.id;
    this.resetResult = null;
    this.familyService.apiFamilyChildrenIdPasswordResetPost(child.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.resetResult = { childId: child.id!, password: res.newPassword ?? '' };
        sessionStorage.setItem(this.RESET_STORAGE_KEY, JSON.stringify(this.resetResult));
        this.resettingChildId = null;
        this.toast.success('Fjalëkalimi u rivendos. Kontrolloni emailin tuaj.', 'SUKSES', 4000);
      },
      error: () => {
        this.resettingChildId = null;
        this.toast.danger('Ndodhi një gabim gjatë rivendosjes.', 'GABIM', 3000);
      }
    });
  }

  dismissNewChild(): void {
    this.newlyCreatedChild = null;
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  copyToClipboard(text: string, field: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedField = field;
      setTimeout(() => this.copiedField = null, 2000);
    });
  }

  clearResetResult(): void {
    this.resetResult = null;
    sessionStorage.removeItem(this.RESET_STORAGE_KEY);
  }

  // Delete child
  deleteChild(child: ChildSummaryDto): void {
    const ref = this.dialog.open(ConfirmModalComponent, {
      data: {
        title: 'Fshi fëmijën',
        message: `Jeni i sigurt që doni të fshini llogarinë e ${child.firstName} ${child.lastName}? Nëse ka të dhëna historike, llogaria do të çaktivizohet.`,
        id: child.id
      }
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (!result?.success || !child.id) return;
      this.familyService.apiFamilyChildrenIdDelete(child.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.loadChildren();
          this.toast.success('Fëmija u fshi me sukses.', 'SUKSES', 3000);
        },
        error: () => this.toast.danger('Ndodhi një gabim.', 'GABIM', 3000)
      });
    });
  }

  // Reactivate child
  reactivateChild(child: ChildSummaryDto): void {
    if (!child.id) return;
    this.reactivatingChildId = child.id;
    this.familyService.apiFamilyChildrenIdReactivatePost(child.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadChildren();
        this.reactivatingChildId = null;
        this.toast.success(`${child.firstName} u riaktivizua me sukses.`, 'SUKSES', 3000);
      },
      error: (err) => {
        this.reactivatingChildId = null;
        this.toast.danger(err?.error?.message ?? 'Ndodhi një gabim gjatë riaktivizimit.', 'GABIM', 3000);
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/family/dashboard']);
  }
}
