import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {RouterLink} from "@angular/router";
import {TranslatePipe} from "../../../../pipes/translate.pipe";
import {Subject, takeUntil} from "rxjs";
import {UserService} from "../../../../services/user.service";
import {DashboardDTO, DashboardService, LearnHubProgressDTO, UserConceptMasteryDTO, WeeklyActivityDayDTO} from "../../../../api-client";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  user$ = this.userService.user$;
  name!: string;

  dashboardData: DashboardDTO | null = null;
  loading = false;
  error: string | null = null;

  /* Ring constants */
  readonly heroRingSize = 140;
  readonly heroRingStroke = 10;
  readonly goalRingSize = 84;
  readonly goalRingStroke = 9;

  /* Weekday labels */
  readonly weekLetters = ['H', 'M', 'M', 'E', 'P', 'S', 'D'];

  constructor(
    private userService: UserService,
    private dashboardService: DashboardService,
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /* ── Data helpers ── */

  get latestLearnHub(): LearnHubProgressDTO | null {
    const hubs = this.dashboardData?.latestLearnHubs || [];
    return hubs.find(h => (h.progressPercentage || 0) < 100) ?? null;
  }

  get allLearnHubsComplete(): boolean {
    const hubs = this.dashboardData?.latestLearnHubs || [];
    return hubs.length > 0 && hubs.every(h => (h.progressPercentage || 0) >= 100);
  }

  get upNextLearnHubs(): LearnHubProgressDTO[] {
    return (this.dashboardData?.latestLearnHubs || [])
      .filter(h => (h.progressPercentage || 0) < 100)
      .slice(0, 3);
  }

  get weakConcepts(): UserConceptMasteryDTO[] {
    return (this.dashboardData?.conceptMastery || [])
      .filter(c => (c.masteryLevel || 0) < 85)
      .slice(0, 5);
  }

  get pendingReviews(): number {
    return this.dashboardData?.pendingReviews || 0;
  }

  getMasteryColor(level: number): string {
    if (level >= 70) return '#22c55e';
    if (level >= 40) return '#f59e0b';
    return '#ef4444';
  }

  get today(): string {
    const d = new Date();
    const days   = ['E diel', 'E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë'];
    const months = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
                    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /* ── Hero ring ── */

  get heroRingR(): number { return (this.heroRingSize - this.heroRingStroke) / 2; }
  get heroRingC(): number { return 2 * Math.PI * this.heroRingR; }

  get heroRingPct(): number {
    if (this.latestLearnHub) return this.latestLearnHub.progressPercentage ?? 0;
    if (this.allLearnHubsComplete) return this.dashboardData?.stats?.totalProgress ?? 100;
    return 0;
  }

  get heroRingOffset(): number {
    return this.heroRingC * (1 - this.heroRingPct / 100);
  }

  /* ── Daily goal ring ── */

  get goalRingR(): number { return (this.goalRingSize - this.goalRingStroke) / 2; }
  get goalRingC(): number { return 2 * Math.PI * this.goalRingR; }

  get goalDone(): number { return this.dashboardData?.stats?.todayExercisesCompleted ?? 0; }
  get goalTotal(): number { return this.dashboardData?.stats?.dailyGoal ?? 5; }

  get goalRingOffset(): number {
    const pct = this.goalTotal > 0 ? this.goalDone / this.goalTotal : 0;
    return this.goalRingC * (1 - Math.min(pct, 1));
  }

  get goalComplete(): boolean { return this.goalDone >= this.goalTotal; }

  /* ── Weekly activity ── */

  get weeklyActivity(): WeeklyActivityDayDTO[] {
    return this.dashboardData?.weeklyActivity || [];
  }

  get weeklyMax(): number {
    const vals = this.weeklyActivity.map(d => d.exercisesCompleted ?? 0);
    return Math.max(...vals, 1);
  }

  weeklyBarHeight(day: WeeklyActivityDayDTO): number {
    return Math.round(((day.exercisesCompleted ?? 0) / this.weeklyMax) * 100);
  }

  get weeklyHasData(): boolean {
    return this.weeklyActivity.some(d => (d.exercisesCompleted ?? 0) > 0);
  }

  get weeklyTotalExercises(): number {
    return this.weeklyActivity.reduce((s, d) => s + (d.exercisesCompleted ?? 0), 0);
  }

  /* ── Accuracy ── */

  get averageAccuracy(): string {
    const acc = this.dashboardData?.stats?.averageAccuracy;
    return acc != null ? `${acc}%` : '—';
  }

  /* ── LearnHub card ring (size 72 stroke 6) ── */

  getLearnHubRingC(): number {
    const r = (72 - 6) / 2;
    return 2 * Math.PI * r;
  }

  getLearnHubRingOffset(pct: number): number {
    const r = (72 - 6) / 2;
    const c = 2 * Math.PI * r;
    return c * (1 - (pct || 0) / 100);
  }

  getLearnHubRingR(): number {
    return (72 - 6) / 2;
  }

  /* ── Status helpers ── */

  learnHubIsComplete(pct?: number): boolean {
    return (pct ?? 0) >= 100;
  }

  /* ── Load methods ── */

  loadUserData() {
    this.user$.pipe(takeUntil(this.unsubscribe$)).subscribe(user => {
      if (user?.firstName) {
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
        error: (err) => {
          console.error('Error loading dashboard data:', err);
          this.error = 'Gabim gjatë ngarkimit të të dhënave.';
          this.loading = false;
        }
      });
  }
}
