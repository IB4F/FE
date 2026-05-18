import {Component, DestroyRef, HostListener, inject, OnInit, ViewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatButtonModule, MatIconButton} from "@angular/material/button";
import {
  MatTableDataSource,
  MatTableModule
} from "@angular/material/table";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatMenuModule, MatMenuTrigger} from "@angular/material/menu";
import {MatPaginator, MatPaginatorModule, PageEvent} from "@angular/material/paginator";
import {MatSort, MatSortModule} from "@angular/material/sort";
import {CommonModule, Location} from "@angular/common";
import {debounceTime, distinctUntilChanged, Subject} from "rxjs";
import {DetailsService, QuizItemDTO, QuizType, QuizzesService} from "../../../../../../api-client";
import {NgToastService} from "ng-angular-popup";
import {ConfirmModalComponent} from "../../../../../shared/components/confirm-modal/confirm-modal.component";
import {MatDialog} from "@angular/material/dialog";
import {QuizModalComponent} from "./quiz-modal/quiz-modal.component";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {MatTooltipModule} from "@angular/material/tooltip";
import {TranslatePipe} from '../../../../../../pipes/translate.pipe';

@Component({
  selector: 'app-manage-quiz',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatIconButton,
    MatPaginatorModule,
    MatSortModule,
    MatMenuTrigger,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule
  ,
    TranslatePipe],
  templateUrl: './manage-quiz.component.html',
  styleUrl: './manage-quiz.component.scss'
})
export class ManageQuizComponent implements OnInit {
  displayedColumns: string[] = ['question', 'explanation', 'actions'];
  dataSource = new MatTableDataSource<QuizItemDTO>([]);
  length: number = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pageNumber: number = 0;
  pageSize: number = this.pageSizeOptions[0];
  openMenuId: string | null = null;
  Math = Math;
  private filterQuizTypeId: string = '';

  @HostListener('document:click')
  closeMenu(): void { this.openMenuId = null; }

  toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  prevPage(): void {
    if (this.pageNumber > 0) { this.pageNumber--; this.getQuizList(); }
  }

  nextPage(): void {
    if ((this.pageNumber + 1) * this.pageSize < this.length) { this.pageNumber++; this.getQuizList(); }
  }

  onPageSizeChange(event: Event): void {
    this.pageSize = parseInt((event.target as HTMLSelectElement).value, 10);
    this.pageNumber = 0;
    this.getQuizList();
  }

  onQuizTypeFilter(event: Event): void {
    this.filterQuizTypeId = (event.target as HTMLSelectElement).value;
    this.pageNumber = 0;
    this.getQuizList();
  }

  getQuizTypeBadgeClass(id: any): string {
    const name = (this.getQuizTypeName(id) || '').toLowerCase();
    if (name.includes('audio')) return 'bg-badge--audio';
    if (name.includes('imazh') || name.includes('image')) return 'bg-badge--gjuhe';
    return 'bg-badge--multiple';
  }

  private searchSubject = new Subject<string>();
  private currentSearchTerm: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  linkId!: string;
  quizTypes: QuizType[] = [];
  private destroyRef = inject(DestroyRef);

  constructor(
    private quizzesService: QuizzesService,
    private toast: NgToastService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private location: Location,
    public router: Router,
    private _detailsService: DetailsService,
  ) {
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: ParamMap) => {
      this.linkId = params.get('id') as string;
    });
    this.loadCombos();
    this.getQuizList();
    this.setupSearchDebounce();
  }

  getQuizList() {
    const paginationRequest = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: this.currentSearchTerm || null
    };
    this.quizzesService.apiQuizzesGetPaginatedQuizzesPost(this.linkId, paginationRequest).subscribe(
      {
        next: (resp: { items: QuizItemDTO[]; totalCount: number }) => {
          this.dataSource.data = resp.items;
          this.length = resp.totalCount ?? 0;
        },
        error: (error) => {
          this.toast.danger(error?.error?.message, 'GABIM', 3000);
        }
      }
    )
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(searchTerm => {
      this.currentSearchTerm = searchTerm;
      this.pageNumber = 0;
      this.getQuizList();
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim();
    this.searchSubject.next(filterValue);
  }

  onPageChange(event: PageEvent) {
    this.pageNumber = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getQuizList();
  }

  onDelete(quiz: any) {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      panelClass: 'bg-confirm-panel',
      width: '420px',
      maxWidth: '95vw',
      data: {
        title: 'Fshi Kuizin',
        message: 'Jeni i sigurt që dëshironi të fshini këtë kuiz? Ky veprim nuk mund të kthehet mbrapsht.',
        id: quiz.id
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.success) {
        this.deleteQuiz(quiz.id);
      }
    })
  }

  deleteQuiz(quizId: string) {
    this.quizzesService.apiQuizzesDeleteQuizDelete(quizId).subscribe(
      {
        next: (resp) => {
          this.toast.success(resp?.message, 'SUCCESS', 3000);
          this.getQuizList();
        },
        error: (error) => {
          this.toast.danger(error?.error?.message, 'GABIM', 3000);
        }
      }
    )
  }

  addExam(): void {
    const dialogRef = this.dialog.open(QuizModalComponent, {
      width: '95vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      data: {
        linkId: this.linkId
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.getQuizList();
      }
    });
  }

  editExam(exam: any): void {
    const dialogRef = this.dialog.open(QuizModalComponent, {
      width: '95vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      data: {
        exam: exam,
        linkId: this.linkId
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.getQuizList();
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  //manage quizzes

  goToAddQuiz() {
    this.router.navigate(['/admin/learnhub/manage/quiz', this.linkId, 'add-quiz']);
  }

  onEditQuiz(quiz: any) {
    this.router.navigate(['/admin/learnhub/manage/quiz', this.linkId, 'edit-quiz', quiz.id]);
  }

  private loadCombos() {
    this.getQuizTypeList();
  }

  private getQuizTypeList() {
    this._detailsService.apiDetailsGetQuizTypesGet().subscribe({
      next: res => { this.quizTypes = res; },
      error: () => { this.toast.danger('Gabim në ngarkimin e llojeve të kuizeve', 'GABIM', 3000); }
    })
  }

  getQuizTypeName(id: any): string {
    const foundClass = this.quizTypes.find(c => c.id === id);
    return foundClass ? foundClass.name : id;
  }

  stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}
