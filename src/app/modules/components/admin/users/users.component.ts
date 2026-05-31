import {Component, DestroyRef, HostListener, inject, OnInit} from '@angular/core';
import {AdminUserDetailsDTO, AdminUserService} from "../../../../api-client";
import {CommonModule} from "@angular/common";
import {NgToastService} from "ng-angular-popup";
import {MatTableDataSource} from "@angular/material/table";
import {debounceTime, distinctUntilChanged, Subject} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmModalComponent} from "../../../shared/components/confirm-modal/confirm-modal.component";

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  dataSource = new MatTableDataSource<any>([]);
  length: number = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pageNumber: number = 0;
  pageSize: number = this.pageSizeOptions[0];
  openMenuId: string | null = null;
  Math = Math;

  private searchSubject = new Subject<string>();
  private currentSearchTerm: string = '';
  private destroyRef = inject(DestroyRef);

  constructor(
    private _adminUserService: AdminUserService,
    private toast: NgToastService,
    public router: Router,
    private dialog: MatDialog
  ) {}

  @HostListener('document:click')
  closeMenu(): void { this.openMenuId = null; }

  toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  prevPage(): void {
    if (this.pageNumber > 0) { this.pageNumber--; this.getUserslist(); }
  }

  nextPage(): void {
    if ((this.pageNumber + 1) * this.pageSize < this.length) { this.pageNumber++; this.getUserslist(); }
  }

  onPageSizeChange(event: Event): void {
    this.pageSize = parseInt((event.target as HTMLSelectElement).value, 10);
    this.pageNumber = 0;
    this.getUserslist();
  }

  ngOnInit() {
    this.getUserslist();
    this.setupSearchDebounce();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
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

  getInitials(user: any): string {
    const f = (user.firstName ?? '').charAt(0).toUpperCase();
    const l = (user.lastName ?? '').charAt(0).toUpperCase();
    return f + l || '?';
  }

  getRoleBadgeClass(role: string): string {
    switch ((role ?? '').toLowerCase()) {
      case 'admin':       return 'bg-badge--navy';
      case 'supervisor':  return 'bg-badge--histori';
      case 'student':     return 'bg-badge--fizike';
      default:            return 'bg-badge--standard';
    }
  }

  onEdit(user: AdminUserDetailsDTO) {
    this.router.navigate(['/admin/users/manageUser', user.id]);
  }

  onDelete(user: AdminUserDetailsDTO) {
    const ref = this.dialog.open(ConfirmModalComponent, {
      panelClass: 'bg-confirm-panel',
      width: '420px',
      maxWidth: '95vw',
      data: {
        title: 'Fshi Përdoruesin',
        message: `Jeni i sigurt që dëshironi të fshini "${(user as any).firstName} ${(user as any).lastName}"? Ky veprim nuk mund të kthehet mbrapsht.`
      }
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (!result?.success) return;
      this.deleteUser(user.id);
    });
  }

  deleteUser(userId: any) {
    this._adminUserService.apiAdminUsersIdDelete(userId).subscribe({
      next: (resp) => {
        this.toast.success(resp?.message, 'SUKSES', 3000);
        this.getUserslist();
      },
      error: (error) => {
        this.toast.danger(error?.error?.message, 'GABIM', 3000);
      }
    });
  }
}
