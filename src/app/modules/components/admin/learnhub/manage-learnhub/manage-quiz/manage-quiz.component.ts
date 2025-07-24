import {Component, OnInit, ViewChild} from '@angular/core';
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
import {QuizzesService} from "../../../../../../api-client";
import {NgToastService} from "ng-angular-popup";
import {ConfirmModalComponent} from "../../../../../shared/components/confirm-modal/confirm-modal.component";
import {MatDialog} from "@angular/material/dialog";
import {QuizModalComponent} from "./quiz-modal/quiz-modal.component";
import {ActivatedRoute, ParamMap} from "@angular/router";
import {MatTooltipModule} from "@angular/material/tooltip";

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
  ],
  templateUrl: './manage-quiz.component.html',
  styleUrl: './manage-quiz.component.scss'
})
export class ManageQuizComponent implements OnInit {
  displayedColumns: string[] = ['question', 'explanation', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  length: number = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pageNumber: number = 0;
  pageSize: number = this.pageSizeOptions[0];

  private searchSubject = new Subject<string>();
  private currentSearchTerm: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  linkId!: string;

  constructor(
    private quizzesService: QuizzesService,
    private toast: NgToastService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private location: Location
  ) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.linkId = params.get('id') as string;
    });
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
        next: (resp) => {
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
      distinctUntilChanged()
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
    console.log(quiz);
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      data: {
        title: 'Fshi Quizin',
        message: 'Jeni i sigurt që dëshironi të fshini këtë quiz?',
        id: quiz.id
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.success) {
        console.log(quiz.id)
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
      width: '900px',
      height: '640px',
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
      width: '900px',
      height: '640px',
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


}
