import {Component, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from "@angular/common";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule, MatIconButton} from "@angular/material/button";
import {MatPaginator, MatPaginatorModule, PageEvent} from "@angular/material/paginator";
import {MatSort, MatSortModule} from "@angular/material/sort";
import {MatMenuModule, MatMenuTrigger} from "@angular/material/menu";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {LearnHubsService} from "../../../../api-client";
import {debounceTime, distinctUntilChanged, Subject} from "rxjs";
import {NgToastService} from "ng-angular-popup";
import {Router} from "@angular/router";

@Component({
  selector: 'app-learnhub',
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
    MatButtonModule
  ],
  templateUrl: './learnhub.component.html',
  styleUrl: './learnhub.component.scss'
})
export class LearnhubComponent implements OnInit {
  displayedColumns: string[] = ['title', 'description', 'klasa', 'lenda', 'links', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  length: number = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pageNumber: number = 0;
  pageSize: number = this.pageSizeOptions[0];

  private searchSubject = new Subject<string>();
  private currentSearchTerm: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _learnHubsService: LearnHubsService,
    private toast: NgToastService,
    public router: Router,
  ) {
  }

  ngOnInit() {
    this.getLearnHublist();
    this.setupSearchDebounce();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.currentSearchTerm = searchTerm;
      this.pageNumber = 0;
      this.getLearnHublist();
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim();
    this.searchSubject.next(filterValue);
  }

  getLearnHublist() {
    const paginationRequest = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: this.currentSearchTerm || null
    };

    this._learnHubsService.apiLearnHubsGetPaginatedLearnhubsPost(paginationRequest).subscribe({
      next: (resp) => {
        this.dataSource.data = resp.items;
        this.length = resp.totalCount ?? 0;
      },
      error: (error) => {
        this.toast.danger(error?.error?.message, 'GABIM', 3000);
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.pageNumber = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getLearnHublist();
  }

  goToAddLearnHub() {
    this.router.navigate(['/admin/learnhub/manage']);
  }

  onEdit(learnHub: any) {
    this.router.navigate(['/admin/learnhub/manage', learnHub.id]);
  }

  onDelete(learnHub: any) {
    this._learnHubsService.apiLearnHubsDeleteLearnhubDelete(learnHub.id).subscribe(
      {
        next: (resp) => {
          this.toast.success(resp?.message, 'SUCCESS', 3000);
          this.getLearnHublist();
        },
        error: (error) => {
          this.toast.danger(error?.error?.message, 'GABIM', 3000);
        }
      }
    )
  }
}
