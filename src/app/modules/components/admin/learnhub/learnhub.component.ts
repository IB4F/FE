import {Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from "@angular/common";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule, MatIconButton} from "@angular/material/button";
import {MatPaginator, MatPaginatorModule, PageEvent} from "@angular/material/paginator";
import {MatSort, MatSortModule} from "@angular/material/sort";
import {MatMenuModule, MatMenuTrigger} from "@angular/material/menu";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {Class, DetailsService, LearnHubsService, Subjects} from "../../../../api-client";
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from "rxjs";
import {NgToastService} from "ng-angular-popup";
import {Router} from "@angular/router";
import {TokenStorageService} from "../../../../services/token-storage.service";

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
export class LearnhubComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = ['title', 'description', 'klasa', 'lenda', 'links', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  length: number = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pageNumber: number = 0;
  pageSize: number = this.pageSizeOptions[0];

  // Subject per gestire la cancellazione delle subscription
  private destroy$ = new Subject<void>();

  // Flag per controllare se il componente è ancora attivo
  private isComponentActive = true;

  private searchSubject = new Subject<string>();
  private currentSearchTerm: string = '';

  classesList: Class[] = [];
  subjectList: Subjects[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _learnHubsService: LearnHubsService,
    private toast: NgToastService,
    public router: Router,
    private _detailsService: DetailsService,
    private tokenStorageService: TokenStorageService,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit() {
    this.loadCombos();
    this.getLearnHublist();
    this.setupSearchDebounce();

    // Ascolta i cambiamenti dello stato di autenticazione
    this.tokenStorageService.isLoggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLoggedIn: boolean) => {
        if (!isLoggedIn) {
          this.handleLogout();
        }
      });

    // Aggiungi listener per eventi di navigazione e chiusura pagina
    window.addEventListener('beforeunload', this.handleLogout.bind(this));
    window.addEventListener('unload', this.handleLogout.bind(this));
  }

  ngAfterViewInit() {
    // Il sort sarà connesso dopo che i dati vengono caricati
    // perché la tabella è dentro un *ngIf
  }
  
  private connectSort() {
    // Metodo helper per connettere il sort quando la tabella è renderizzata
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  ngOnDestroy(): void {
    // Cancella tutte le subscription quando il componente viene distrutto
    this.isComponentActive = false;
    this.destroy$.next();
    this.destroy$.complete();

    // Rimuovi i listener degli eventi
    window.removeEventListener('beforeunload', this.handleLogout.bind(this));
    window.removeEventListener('unload', this.handleLogout.bind(this));
  }

  private loadCombos() {
    this.getClassesList();
    this.getSubjectsList();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      if (!this.isComponentActive) return;
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
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    const paginationRequest = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: this.currentSearchTerm || null
    };

    this._learnHubsService.apiLearnHubsGetPaginatedLearnhubsPost(paginationRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if (!this.isComponentActive) return;
          this.dataSource.data = resp.items;
          this.length = resp.totalCount ?? 0;
          // Forza il change detection e poi connetti il sort
          this.cdr.detectChanges();
          setTimeout(() => this.connectSort(), 0);
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          this.toast.danger(error?.error?.message, 'GABIM', 3000);
        }
      });
  }

  private getClassesList() {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this._detailsService.apiDetailsGetClassGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (!this.isComponentActive) return;
        this.classesList = res;
      })
  }

  private getSubjectsList() {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this._detailsService.apiDetailsGetSubjectsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (!this.isComponentActive) return;
        this.subjectList = res;
      })
  }

  getClassName(id: any): string {
    const foundClass = this.classesList.find(c => c.id === id);
    return foundClass?.name ?? String(id);
  }

  getSubjectName(id: any): string {
    const foundSubject = this.subjectList.find(s => s.id === id);
    return foundSubject?.name ?? String(id);
  }

  onPageChange(event: PageEvent) {
    this.pageNumber = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getLearnHublist();
  }

  goToAddLearnHub() {
    this.router.navigate(['/admin/learnhub/manage']);
  }

  getNoDataMessage(): string {
    if (this.currentSearchTerm && this.currentSearchTerm.trim() !== '') {
      return `Nuk u gjetën rezultate për kërkimin "${this.currentSearchTerm}". Provoni të ndryshoni termat e kërkimit.`;
    }
    return 'Nuk ka LearnHubs të disponueshëm. Mund të shtoni të reja duke përdorur butonin "Shto LearnHub".';
  }

  onEdit(learnHub: any) {
    this.router.navigate(['/admin/learnhub/manage', learnHub.id]);
  }

  onDelete(learnHub: any) {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this._learnHubsService.apiLearnHubsDeleteLearnhubDelete(learnHub.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if (!this.isComponentActive) return;
          this.toast.success(resp?.message, 'SUCCESS', 3000);
          this.getLearnHublist();
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          console.log(error)
          this.toast.danger(error?.error?.message, 'GABIM', 3000);
        }
      })
  }

  // Metodo per fermare tutte le chiamate API
  stopAllApiCalls(): void {
    this.isComponentActive = false;
    this.destroy$.next();
  }

  // Metodo per gestire il logout - può essere chiamato da eventi esterni
  handleLogout(): void {
    this.stopAllApiCalls();
  }
}
