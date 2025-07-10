import {Component, OnInit, ViewChild} from '@angular/core';
import {AdminUserDetailsDTO, AdminUserService} from "../../../../api-client";
import {CommonModule} from "@angular/common";
import {NgToastService} from "ng-angular-popup";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatPaginator, MatPaginatorModule, PageEvent} from "@angular/material/paginator";
import {MatSort, MatSortModule} from "@angular/material/sort";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule, MatMenuTrigger} from "@angular/material/menu";
import {MatIconButton} from "@angular/material/button";
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {debounceTime, distinctUntilChanged, Subject} from 'rxjs';
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmModalComponent} from "../../../shared/components/confirm-modal/confirm-modal.component";

@Component({
  selector: 'app-users',
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
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  displayedColumns: string[] = ['email', 'firstName', 'lastName', 'role', 'school', 'city', 'actions'];
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
    private _adminUserService: AdminUserService,
    private toast: NgToastService,
    public router: Router,
    private dialog: MatDialog
  ) {
  }

  ngOnInit() {
    this.getUserslist();
    this.setupSearchDebounce();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.currentSearchTerm = searchTerm;
      this.pageNumber = 0;
      this.getUserslist();
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim();
    this.searchSubject.next(filterValue);
  }

  getUserslist() {
    const paginationRequest = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: this.currentSearchTerm || null
    };

    this._adminUserService.apiAdminUsersPaginatedPost(paginationRequest).subscribe({
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
    this.getUserslist();
  }

  onEdit(user: AdminUserDetailsDTO) {
    this.router.navigate(['/admin/users/manageUser', user.id]);
  }

  onDelete(user: AdminUserDetailsDTO) {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      data: {
        title: 'Fshi Përdoruesin',
        message: 'Jeni i sigurt që dëshironi të fshini këtë përdorues?',
        id: user.id
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.success) {
        this.deleteUser(user.id);
      }
    })
  }

  deleteUser(userId: any) {
    this._adminUserService.apiAdminUsersIdDelete(userId).subscribe({
      next: (resp) => {
        this.toast.success(resp?.message, 'SUCCESS', 3000);
        this.getUserslist();
      },
      error: (error) => {
        this.toast.danger(error?.error?.message, 'GABIM', 3000);
      }
    });
  }
}
