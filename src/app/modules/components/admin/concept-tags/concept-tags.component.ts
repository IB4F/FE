import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgToastService } from 'ng-angular-popup';
import { MatDialog } from '@angular/material/dialog';
import { ConceptTagDTO } from '../../../../api-client/model/conceptTagDTO';
import { ConceptTagsService } from '../../../../api-client/api/conceptTags.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-concept-tags',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './concept-tags.component.html',
  styleUrl: './concept-tags.component.scss'
})
export class ConceptTagsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  tags: ConceptTagDTO[] = [];
  isLoading = false;

  newTagName = '';
  isSavingNew = false;

  editingTagId: string | null = null;
  editingTagName = '';
  isSavingEdit = false;

  constructor(
    private conceptTagsService: ConceptTagsService,
    private toast: NgToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.isLoading = true;
    this.conceptTagsService.apiConceptTagsGet()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.tags = res; this.isLoading = false; },
        error: () => { this.toast.danger('Gabim në ngarkimin e etiketave', 'GABIM', 3000); this.isLoading = false; }
      });
  }

  addTag(): void {
    const name = this.newTagName.trim();
    if (!name) return;
    this.isSavingNew = true;
    this.conceptTagsService.apiConceptTagsPost({ name })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Etiketa u shtua me sukses', 'SUKSES', 3000);
          this.newTagName = '';
          this.isSavingNew = false;
          this.loadTags();
        },
        error: err => {
          this.toast.danger(err?.error?.message || 'Gabim gjatë shtimit', 'GABIM', 3000);
          this.isSavingNew = false;
        }
      });
  }

  startEdit(tag: ConceptTagDTO): void {
    this.editingTagId = tag.id ?? null;
    this.editingTagName = tag.name ?? '';
  }

  cancelEdit(): void {
    this.editingTagId = null;
    this.editingTagName = '';
  }

  saveEdit(): void {
    const name = this.editingTagName.trim();
    if (!name || !this.editingTagId) return;
    this.isSavingEdit = true;
    this.conceptTagsService.apiConceptTagsPut(this.editingTagId, { name })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Etiketa u përditësua me sukses', 'SUKSES', 3000);
          this.cancelEdit();
          this.isSavingEdit = false;
          this.loadTags();
        },
        error: err => {
          this.toast.danger(err?.error?.message || 'Gabim gjatë përditësimit', 'GABIM', 3000);
          this.isSavingEdit = false;
        }
      });
  }

  deleteTag(tag: ConceptTagDTO): void {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      data: {
        title: 'Fshi Etiketën',
        message: `A jeni të sigurt që dëshironi të fshini etiketën "${tag.name}"? Etiketa mund të fshihet vetëm nëse nuk është caktuar në asnjë kuiz.`,
        id: tag.id
      }
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result?.success && tag.id) {
        this.conceptTagsService.apiConceptTagsDelete(tag.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toast.success('Etiketa u fshi me sukses', 'SUKSES', 3000);
              this.loadTags();
            },
            error: err => this.toast.danger(err?.error?.message || 'Gabim gjatë fshirjes', 'GABIM', 3000)
          });
      }
    });
  }
}
