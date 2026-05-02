import {
  AfterViewInit, Component, ElementRef, Inject, inject,
  OnDestroy, OnInit, PLATFORM_ID, ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgToastService } from 'ng-angular-popup';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { TokenStorageService } from '../../../../services/token-storage.service';
import { ThemeService } from '../../../../services/theme.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import {
  AdminAnalyticsDTO, AdminDashboardService, AdminStatsDTO,
  LearnHubPerformanceDTO, LearnHubStatsDTO,
  MonthlyRevenueDTO, QuizPerformanceDTO, QuizStatsDTO,
  RecentActivityDTO, SubscriptionStatsDTO, SupervisorApplicationDTO,
  SupervisorApprovalDTO, SupervisorService, SubscriptionService
} from 'src/app/api-client';

Chart.register(...registerables);

const MONTHS_ALB = ['Jan','Shk','Mar','Pri','Maj','Qer','Kor','Gus','Sht','Tet','Nën','Dhj'];

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.scss'
})
export class PanelComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueCanvas') revenueCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas')  donutCanvasRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private isComponentActive = true;
  private revenueChart: Chart | null = null;
  private donutChart: Chart | null = null;
  private isBrowser: boolean;

  themeService = inject(ThemeService);
  private toast = inject(NgToastService);
  private router = inject(Router);
  private tokenStorageService = inject(TokenStorageService);
  private adminDashboardService = inject(AdminDashboardService);
  private supervisorService = inject(SupervisorService);
  private subscriptionService = inject(SubscriptionService);

  Math = Math;

  // ── State ─────────────────────────────────────────────────────────────────
  readonly ranges = ['7d', '30d', '90d'] as const;
  selectedRange: '7d' | '30d' | '90d' = '30d';
  showNotifications = false;
  searchQuery = '';

  // ── Data ──────────────────────────────────────────────────────────────────
  stats: AdminStatsDTO = { activeLearnHubs: 0, totalRegisteredUsers: 0, completedQuizzes: 0, activeAdministrators: 0 };
  recentActivities: RecentActivityDTO[] = [];
  analytics: AdminAnalyticsDTO = {};
  learnHubStats: LearnHubStatsDTO[] = [];
  monthlyRevenue: MonthlyRevenueDTO[] = [];
  challengingQuizzes: QuizPerformanceDTO[] = [];
  topPerformingLearnHubs: LearnHubPerformanceDTO[] = [];
  quizStats: QuizStatsDTO[] = [];
  subscriptionStats: SubscriptionStatsDTO[] = [];
  systemHealth: { [key: string]: any } = {};
  supervisorApplications: SupervisorApplicationDTO[] = [];
  pendingManualPayments: any[] = [];

  // ── Loading flags ─────────────────────────────────────────────────────────
  isLoadingStats = true;
  isLoadingActivities = true;
  isLoadingRevenue = true;
  isLoadingTopLearnHubs = true;
  isLoadingSystemHealth = true;
  isLoadingSupervisorApplications = true;
  isLoadingPendingPayments = false;

  private boundHandleLogout = this.handleLogout.bind(this);

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDashboardData();
    this.tokenStorageService.isLoggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ok: boolean) => { if (!ok) this.handleLogout(); });
    if (this.isBrowser) {
      window.addEventListener('beforeunload', this.boundHandleLogout);
      // Rebuild charts whenever the theme changes so colors stay correct
      this.themeService.isDark$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.monthlyRevenue.length > 0) {
            setTimeout(() => this.buildCharts(), 50);
          }
        });
    }
  }

  ngAfterViewInit(): void {
    // Charts are created once revenue data arrives — see buildCharts()
  }

  ngOnDestroy(): void {
    this.isComponentActive = false;
    this.destroy$.next();
    this.destroy$.complete();
    if (this.isBrowser) {
      window.removeEventListener('beforeunload', this.boundHandleLogout);
    }
    this.revenueChart?.destroy();
    this.donutChart?.destroy();
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  loadDashboardData(): void {
    if (!this.isComponentActive || !this.tokenStorageService.getAccessToken()) return;
    this.loadStats();
    this.loadRecentActivities();
    this.loadMonthlyRevenue();
    this.loadTopPerformingLearnHubs();
    this.loadSystemHealth();
    this.loadSupervisorApplications();
    this.loadPendingManualPayments();
    this.loadAnalytics();
    this.loadLearnHubStats();
    this.loadQuizStats();
    this.loadSubscriptionStats();
  }

  refreshData(): void { this.loadDashboardData(); }

  private guard(): boolean {
    return this.isComponentActive && !!this.tokenStorageService.getAccessToken();
  }

  loadStats(): void {
    if (!this.guard()) return;
    this.isLoadingStats = true;
    this.adminDashboardService.apiAdminDashboardStatsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => { if (!this.isComponentActive) return; this.stats = r; this.isLoadingStats = false; },
        error: () => { this.isLoadingStats = false; }
      });
  }

  loadRecentActivities(): void {
    if (!this.guard()) return;
    this.isLoadingActivities = true;
    this.adminDashboardService.apiAdminDashboardRecentActivitiesGet(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => { if (!this.isComponentActive) return; this.recentActivities = r; this.isLoadingActivities = false; },
        error: () => { this.isLoadingActivities = false; }
      });
  }

  loadMonthlyRevenue(): void {
    if (!this.guard()) return;
    this.isLoadingRevenue = true;
    this.adminDashboardService.apiAdminDashboardMonthlyRevenueGet(12)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          if (!this.isComponentActive) return;
          this.monthlyRevenue = r;
          this.isLoadingRevenue = false;
          setTimeout(() => this.buildCharts(), 120);
        },
        error: () => { this.isLoadingRevenue = false; }
      });
  }

  loadTopPerformingLearnHubs(): void {
    if (!this.guard()) return;
    this.isLoadingTopLearnHubs = true;
    this.adminDashboardService.apiAdminDashboardTopPerformingLearnhubsGet(5)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          if (!this.isComponentActive) return;
          this.topPerformingLearnHubs = r;
          this.isLoadingTopLearnHubs = false;
          setTimeout(() => this.buildDonutChart(), 120);
        },
        error: () => { this.isLoadingTopLearnHubs = false; }
      });
  }

  loadSystemHealth(): void {
    if (!this.guard()) return;
    this.isLoadingSystemHealth = true;
    this.adminDashboardService.apiAdminDashboardSystemHealthGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => { if (!this.isComponentActive) return; this.systemHealth = r; this.isLoadingSystemHealth = false; },
        error: () => { this.isLoadingSystemHealth = false; }
      });
  }

  loadSupervisorApplications(): void {
    if (!this.guard()) return;
    this.isLoadingSupervisorApplications = true;
    this.supervisorService.apiSupervisorApplicationsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => { if (!this.isComponentActive) return; this.supervisorApplications = r; this.isLoadingSupervisorApplications = false; },
        error: () => { this.supervisorApplications = []; this.isLoadingSupervisorApplications = false; }
      });
  }

  loadPendingManualPayments(): void {
    if (!this.guard()) return;
    this.isLoadingPendingPayments = true;
    this.subscriptionService.apiSubscriptionManualPendingGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => { if (!this.isComponentActive) return; this.pendingManualPayments = r || []; this.isLoadingPendingPayments = false; },
        error: () => { this.pendingManualPayments = []; this.isLoadingPendingPayments = false; }
      });
  }

  loadAnalytics(): void {
    if (!this.guard()) return;
    this.adminDashboardService.apiAdminDashboardAnalyticsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: r => { if (this.isComponentActive) this.analytics = r; }, error: () => {} });
  }

  loadLearnHubStats(): void {
    if (!this.guard()) return;
    this.adminDashboardService.apiAdminDashboardLearnhubStatsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: r => { if (this.isComponentActive) this.learnHubStats = r; }, error: () => {} });
  }

  loadQuizStats(): void {
    if (!this.guard()) return;
    this.adminDashboardService.apiAdminDashboardQuizStatsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: r => { if (this.isComponentActive) this.quizStats = r; }, error: () => {} });
  }

  loadSubscriptionStats(): void {
    if (!this.guard()) return;
    this.adminDashboardService.apiAdminDashboardSubscriptionStatsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: r => { if (this.isComponentActive) this.subscriptionStats = r; }, error: () => {} });
  }

  // ── Supervisor actions ────────────────────────────────────────────────────
  approveSupervisorApplication(app: any): void {
    const data: SupervisorApprovalDTO = { supervisorId: app.supervisorId, isApproved: true };
    this.supervisorService.apiSupervisorApprovePost(data).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Aplikimi u pranua me sukses', 'SUKSES', 3000); this.loadSupervisorApplications(); },
      error: e => this.toast.danger(e?.error?.message || 'Gabim', 'GABIM', 3000)
    });
  }

  rejectSupervisorApplication(app: any): void {
    const data: SupervisorApprovalDTO = { supervisorId: app.supervisorId, isApproved: false, rejectionReason: 'Refuzuar nga administratori' };
    this.supervisorService.apiSupervisorApprovePost(data).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Aplikimi u refuzua', 'SUKSES', 3000); this.loadSupervisorApplications(); },
      error: e => this.toast.danger(e?.error?.message || 'Gabim', 'GABIM', 3000)
    });
  }

  confirmManualPayment(ref: string): void {
    this.subscriptionService.apiSubscriptionManualConfirmPost(ref).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Pagesa u konfirmua.', 'SUKSES', 3000); this.loadPendingManualPayments(); },
      error: e => this.toast.danger(e?.error?.message || 'Gabim', 'GABIM', 3000)
    });
  }

  remindManualPayment(ref: string): void {
    this.subscriptionService.apiSubscriptionManualRemindPost(ref).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.toast.success('Email-i u dërgua.', 'SUKSES', 3000),
      error: e => this.toast.danger(e?.error?.message || 'Gabim', 'GABIM', 3000)
    });
  }

  // ── Charts ────────────────────────────────────────────────────────────────
  private buildCharts(): void {
    if (!this.isBrowser) return;
    this.buildRevenueChart();
    this.buildDonutChart();
  }

  private buildRevenueChart(): void {
    if (!this.revenueCanvasRef) return;
    const dark = this.themeService.isDark;
    const accent = '#6366f1';
    const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const labelColor = dark ? '#8a90a3' : '#6b7280';

    const labels = this.monthlyRevenue.map(r => `${MONTHS_ALB[(r.month ?? 1) - 1]} ${r.year}`);
    const data = this.monthlyRevenue.map(r => r.revenue ?? 0);

    this.revenueChart?.destroy();
    this.revenueChart = new Chart(this.revenueCanvasRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: accent,
          borderWidth: 2.5,
          pointBackgroundColor: dark ? '#171a23' : '#ffffff',
          pointBorderColor: accent,
          pointBorderWidth: 2,
          pointRadius: 4,
          tension: 0.35,
          fill: true,
          backgroundColor: (ctx) => {
            const c = ctx.chart.ctx;
            const g = c.createLinearGradient(0, 0, 0, ctx.chart.height);
            g.addColorStop(0, 'rgba(99,102,241,0.25)');
            g.addColorStop(1, 'rgba(99,102,241,0)');
            return g;
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: dark ? '#1c2030' : '#1a1d29',
          titleColor: '#fff', bodyColor: '#fff',
          callbacks: { label: ctx => `€${(ctx.parsed.y ?? 0).toFixed(2)}` }
        }},
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 }, callback: v => `€${v}` }, beginAtZero: true }
        }
      }
    });
  }

  private buildDonutChart(): void {
    if (!this.donutCanvasRef) return;
    const dark = this.themeService.isDark;
    const colors = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

    const top = this.topPerformingLearnHubs.slice(0, 4);
    const labels = top.map(l => l.title ?? 'Tjetër');
    const rawData = top.map(l => l.totalStudents ?? 0);
    const allZero = rawData.every(v => v === 0);
    // When all values are 0 Chart.js renders nothing; use equal placeholder segments
    const chartData = allZero ? rawData.map(() => 1) : rawData;

    this.donutChart?.destroy();
    this.donutChart = new Chart(this.donutCanvasRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: chartData,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: dark ? '#1c2030' : '#1a1d29',
            titleColor: '#fff', bodyColor: '#fff',
            callbacks: {
              label: ctx => `${ctx.label}: ${rawData[ctx.dataIndex]} studentë`
            }
          }
        }
      }
    });
  }

  // ── KPI sparklines (pure SVG) ─────────────────────────────────────────────
  getSparklinePath(data: number[], w = 80, h = 28): string {
    const max = Math.max(...data, 1);
    const step = w / Math.max(data.length - 1, 1);
    return data.map((v, i) =>
      `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (v / max) * h * 0.85 - 2).toFixed(1)}`
    ).join(' ');
  }

  getSparklineArea(data: number[], w = 80, h = 28): string {
    const line = this.getSparklinePath(data, w, h);
    return `${line} L${w},${h} L0,${h} Z`;
  }

  get kpis() {
    const pendingCount = this.supervisorApplications.length;
    const paymentCount = this.pendingManualPayments.length;
    return [
      { label: 'Lëndët Aktive',       value: this.stats.activeLearnHubs ?? 0,      trend: [2,2,3,3,2,3,3], color: '#6366f1' },
      { label: 'Kërkesa të Pritshme', value: pendingCount,                          trend: [1,2,1,3,2,3,pendingCount], color: '#f59e0b' },
      { label: 'Pagesa në Pritje',    value: paymentCount,                          trend: [0,0,0,0,0,0,paymentCount], color: '#10b981' },
      { label: 'Administrator Aktivë',value: this.stats.activeAdministrators ?? 0,  trend: [1,1,1,1,1,1,1], color: '#06b6d4' },
    ];
  }

  get totalRevenue(): number {
    return this.monthlyRevenue.reduce((s, r) => s + (r.revenue ?? 0), 0);
  }

  get allLearnHubsEmpty(): boolean {
    return this.topPerformingLearnHubs.length > 0 &&
      this.topPerformingLearnHubs.every(l => (l.totalStudents ?? 0) === 0);
  }

  get donutLegend() {
    const colors = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];
    const top = this.topPerformingLearnHubs.slice(0, 4);
    const total = top.reduce((s, l) => s + (l.totalStudents ?? 0), 0) || 1;
    return top.map((l, i) => ({
      label: l.title ?? 'Tjetër',
      pct: Math.round(((l.totalStudents ?? 0) / total) * 100),
      color: colors[i]
    }));
  }

  get systemHealthKeys(): string[] { return Object.keys(this.systemHealth); }

  isSystemHealthy(key: string): boolean {
    const v = this.systemHealth[key];
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v > 0;
    if (typeof v === 'string') return v.toLowerCase().includes('ok') || v.toLowerCase().includes('healthy');
    return false;
  }

  getSystemHealthValue(key: string): string {
    const v = this.systemHealth[key];
    if (typeof v === 'boolean') return v ? 'Aktiv' : 'Joaktiv';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return this.formatTimestamp(v);
    return String(v);
  }

  getActivityIcon(type: string | null | undefined): string {
    const map: { [k: string]: string } = {
      user_registration: 'fas fa-user-plus', user_login: 'fas fa-sign-in-alt',
      learnhub_created: 'fas fa-plus-circle', learnhub_updated: 'fas fa-edit',
      quiz_completed: 'fas fa-check-circle', quiz_created: 'fas fa-question-circle',
      profile_updated: 'fas fa-user-edit', subscription_created: 'fas fa-credit-card'
    };
    return map[(type ?? '').toLowerCase()] ?? 'fas fa-circle';
  }

  formatTimestamp(ts: string | undefined): string {
    if (!ts) return 'Data e panjohur';
    const d = new Date(ts), now = new Date();
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 1) return 'Tani';
    if (mins < 60) return `${mins} minuta më parë`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} orë më parë`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ditë më parë`;
    return d.toLocaleDateString('sq-AL', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '€0';
    return new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  formatPercentage(value: number | undefined): string {
    if (!value) return '0%';
    return `${Math.round(value * 100)}%`;
  }

  formatDate(ds: string | undefined): string {
    if (!ds) return '—';
    return new Date(ds).toLocaleDateString('sq-AL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  formatAmountCents(cents: number | undefined, currency = 'ALL'): string {
    if (!cents) return `0 ${currency}`;
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }

  stopAllApiCalls(): void { this.isComponentActive = false; this.destroy$.next(); }
  handleLogout(): void { this.stopAllApiCalls(); }
}
