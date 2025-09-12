import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {RouterLink} from "@angular/router";
import {Subject, takeUntil} from "rxjs";
import {UserService} from "../../../../services/user.service";
import {DashboardDTO, DashboardService} from "../../../../api-client";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  user$ = this.userService.user$;
  name!: string;

  // Dashboard data
  dashboardData: DashboardDTO | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private dashboardService: DashboardService,
  ) {
  }

  ngOnInit() {
    this.loadUserData();
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  loadUserData() {
    this.user$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(user => {
      if (user && user.firstName) {
        this.name = user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1);
      } else {
        this.name = '';
      }
    });
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    this.dashboardService.apiDashboardStudentGet()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (data: DashboardDTO) => {
          this.dashboardData = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          this.error = 'Errore nel caricamento dei dati della dashboard';
          this.loading = false;
        }
      });
  }

}
