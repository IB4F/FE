import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgToastService } from 'ng-angular-popup';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TokenStorageService } from '../../../../services/token-storage.service';
import {
  AdminAnalyticsDTO, AdminDashboardService, AdminStatsDTO, GeographicStatsDTO,
  LearnHubPerformanceDTO, LearnHubStatsDTO,
  MonthlyRevenueDTO,
  QuizPerformanceDTO, QuizStatsDTO, RecentActivityDTO,
  SubscriptionStatsDTO,
  SupervisorApplicationDTO, SupervisorApprovalDTO, SupervisorService,
  UserGrowthDTO,
  UserRegistrationStatsDTO
} from 'src/app/api-client';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.scss'
})
export class PanelComponent implements OnInit, OnDestroy {

  // Subject per gestire la cancellazione delle subscription
  private destroy$ = new Subject<void>();

  // Flag per controllare se il componente è ancora attivo
  private isComponentActive = true;

  // Esporre Math per il template
  Math = Math;

  // Dati per le statistiche principali
  stats: AdminStatsDTO = {
    activeLearnHubs: 0,
    totalRegisteredUsers: 0,
    completedQuizzes: 0,
    activeAdministrators: 0
  };

  // Dati per le attività recenti
  recentActivities: RecentActivityDTO[] = [];

  // Të dhëna për analizat e detajuara
  analytics: AdminAnalyticsDTO = {};

  // Të dhëna për shpërndarjen gjeografike
  geographicStats: GeographicStatsDTO[] = [];

  // Të dhëna për statistikat e LearnHubs
  learnHubStats: LearnHubStatsDTO[] = [];

  // Të dhëna për të ardhurat mujore
  monthlyRevenue: MonthlyRevenueDTO[] = [];

  // Të dhëna për kuize më të vështirë
  challengingQuizzes: QuizPerformanceDTO[] = [];

  // Të dhëna për LearnHubs më të suksesshëm
  topPerformingLearnHubs: LearnHubPerformanceDTO[] = [];

  // Të dhëna për rritjen e përdoruesve
  userGrowth: UserGrowthDTO[] = [];

  // Të dhëna për statistikat e Kuizeve
  quizStats: QuizStatsDTO[] = [];

  // Të dhëna për statistikat e abonimeve
  subscriptionStats: SubscriptionStatsDTO[] = [];

  // Të dhëna për statistikat e regjistrimeve
  registrationStats: UserRegistrationStatsDTO[] = [];

  // Të dhëna për shëndetin e sistemit
  systemHealth: { [key: string]: any } = {};

  // Të dhëna për aplikimet e supervisorit
  supervisorApplications: SupervisorApplicationDTO[] = [];
  isLoadingSupervisorApplications = true;

  // Gjendjet e ngarkimit
  isLoadingStats = true;
  isLoadingActivities = true;
  isLoadingAnalytics = true;
  isLoadingGeographic = true;
  isLoadingLearnHubStats = true;
  isLoadingRevenue = true;
  isLoadingChallengingQuizzes = true;
  isLoadingTopLearnHubs = true;
  isLoadingUserGrowth = true;
  isLoadingQuizStats = true;
  isLoadingSubscriptionStats = true;
  isLoadingRegistrationStats = true;
  isLoadingSystemHealth = true;

  constructor(
    private adminDashboardService: AdminDashboardService,
    private supervisorService: SupervisorService,
    private toast: NgToastService,
    private router: Router,
    private tokenStorageService: TokenStorageService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();

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

  ngOnDestroy(): void {
    // Cancella tutte le subscription quando il componente viene distrutto
    this.isComponentActive = false;
    this.destroy$.next();
    this.destroy$.complete();

    // Rimuovi i listener degli eventi
    window.removeEventListener('beforeunload', this.handleLogout.bind(this));
    window.removeEventListener('unload', this.handleLogout.bind(this));
  }

  loadDashboardData(): void {
    // Verifica se il componente è ancora attivo prima di caricare i dati
    if (!this.isComponentActive) {
      return;
    }

    // Verifica se l'utente è ancora autenticato
    if (!this.tokenStorageService.getAccessToken()) {
      return;
    }

    this.loadStats();
    this.loadRecentActivities();
    this.loadAnalytics();
    this.loadGeographicDistribution();
    this.loadLearnHubStats();
    this.loadMonthlyRevenue();
    this.loadChallengingQuizzes();
    this.loadTopPerformingLearnHubs();
    this.loadUserGrowth();
    this.loadQuizStats();
    this.loadSubscriptionStats();
    this.loadRegistrationStats();
    this.loadSystemHealth();
    this.loadSupervisorApplications();
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

  loadStats(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingStats = true;
    this.adminDashboardService.apiAdminDashboardStatsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AdminStatsDTO) => {
          if (!this.isComponentActive) return;
          this.stats = response;
          this.isLoadingStats = false;
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          console.error('Gabim në ngarkimin e statistikave:', error);
          this.toast.danger('Gabim në ngarkimin e statistikave', 'Gabim', 3000);
          this.isLoadingStats = false;
        }
      });
  }

  loadRecentActivities(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingActivities = true;
    this.adminDashboardService.apiAdminDashboardRecentActivitiesGet(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: RecentActivityDTO[]) => {
          if (!this.isComponentActive) return;
          this.recentActivities = response;
          this.isLoadingActivities = false;
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          console.error('Gabim në ngarkimin e aktiviteteve të fundit:', error);
          this.toast.danger('Gabim në ngarkimin e aktiviteteve të fundit', 'Gabim', 3000);
          this.isLoadingActivities = false;
        }
    });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  // Metoda për të ngarkuar të dhënat nga të gjitha endpoint-et
  loadAnalytics(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingAnalytics = true;
    this.adminDashboardService.apiAdminDashboardAnalyticsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AdminAnalyticsDTO) => {
          if (!this.isComponentActive) return;
          this.analytics = response;
          this.isLoadingAnalytics = false;
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          console.error('Gabim në ngarkimin e analizave:', error);
          this.toast.danger('Gabim në ngarkimin e analizave', 'Gabim', 3000);
          this.isLoadingAnalytics = false;
        }
    });
  }

  loadGeographicDistribution(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingGeographic = true;
    this.adminDashboardService.apiAdminDashboardGeographicDistributionGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: GeographicStatsDTO[]) => {
          if (!this.isComponentActive) return;
          this.geographicStats = response;
          this.isLoadingGeographic = false;
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          console.error('Gabim në ngarkimin e shpërndarjes gjeografike:', error);
          this.toast.danger('Gabim në ngarkimin e shpërndarjes gjeografike', 'Gabim', 3000);
          this.isLoadingGeographic = false;
        }
    });
  }

  loadLearnHubStats(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingLearnHubStats = true;
    this.adminDashboardService.apiAdminDashboardLearnhubStatsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: LearnHubStatsDTO[]) => {
          if (!this.isComponentActive) return;
          this.learnHubStats = response;
          this.isLoadingLearnHubStats = false;
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          console.error('Gabim në ngarkimin e statistikave të LearnHubs:', error);
          this.toast.danger('Gabim në ngarkimin e statistikave të LearnHubs', 'Gabim', 3000);
          this.isLoadingLearnHubStats = false;
        }
    });
  }

  loadMonthlyRevenue(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingRevenue = true;
    this.adminDashboardService.apiAdminDashboardMonthlyRevenueGet(12)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: MonthlyRevenueDTO[]) => {
          if (!this.isComponentActive) return;
          this.monthlyRevenue = response;
          this.isLoadingRevenue = false;
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          console.error('Gabim në ngarkimin e të ardhurave mujore:', error);
          this.toast.danger('Gabim në ngarkimin e të ardhurave mujore', 'Gabim', 3000);
          this.isLoadingRevenue = false;
        }
    });
  }

  loadChallengingQuizzes(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingChallengingQuizzes = true;
    this.adminDashboardService.apiAdminDashboardMostChallengingQuizzesGet(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: QuizPerformanceDTO[]) => {
          if (!this.isComponentActive) return;
          this.challengingQuizzes = response;
          this.isLoadingChallengingQuizzes = false;
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          console.error('Gabim në ngarkimin e kuizeve më të vështirë:', error);
          this.toast.danger('Gabim në ngarkimin e kuizeve më të vështirë', 'Gabim', 3000);
          this.isLoadingChallengingQuizzes = false;
        }
    });
  }

  loadTopPerformingLearnHubs(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingTopLearnHubs = true;
    this.adminDashboardService.apiAdminDashboardTopPerformingLearnhubsGet(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: LearnHubPerformanceDTO[]) => {
          if (!this.isComponentActive) return;
          this.topPerformingLearnHubs = response;
          this.isLoadingTopLearnHubs = false;
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          console.error('Gabim në ngarkimin e LearnHubs më të suksesshëm:', error);
          this.toast.danger('Gabim në ngarkimin e LearnHubs më të suksesshëm', 'Gabim', 3000);
          this.isLoadingTopLearnHubs = false;
        }
    });
  }

  loadUserGrowth(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingUserGrowth = true;
    this.adminDashboardService.apiAdminDashboardUserGrowthGet(30)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: UserGrowthDTO[]) => {
          if (!this.isComponentActive) return;
          this.userGrowth = response;
          this.isLoadingUserGrowth = false;
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          console.error('Gabim në ngarkimin e rritjes së përdoruesve:', error);
          this.toast.danger('Gabim në ngarkimin e rritjes së përdoruesve', 'Gabim', 3000);
          this.isLoadingUserGrowth = false;
        }
    });
  }

  loadQuizStats(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingQuizStats = true;
    this.adminDashboardService.apiAdminDashboardQuizStatsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (response: QuizStatsDTO[]) => {
        if (!this.isComponentActive) return;
        this.quizStats = response;
        this.isLoadingQuizStats = false;
      },
      error: (error) => {
        if (!this.isComponentActive) return;
        console.error('Gabim në ngarkimin e statistikave të Kuizeve:', error);
        this.toast.danger('Gabim në ngarkimin e statistikave të Kuizeve', 'Gabim', 3000);
        this.isLoadingQuizStats = false;
      }
    });
  }

  loadSubscriptionStats(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingSubscriptionStats = true;
    this.adminDashboardService.apiAdminDashboardSubscriptionStatsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (response: SubscriptionStatsDTO[]) => {
        if (!this.isComponentActive) return;
        this.subscriptionStats = response;
        this.isLoadingSubscriptionStats = false;
      },
      error: (error) => {
        if (!this.isComponentActive) return;
        console.error('Gabim në ngarkimin e statistikave të abonimeve:', error);
        this.toast.danger('Gabim në ngarkimin e statistikave të abonimeve', 'Gabim', 3000);
        this.isLoadingSubscriptionStats = false;
      }
    });
  }

  loadRegistrationStats(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingRegistrationStats = true;
    this.adminDashboardService.apiAdminDashboardUserRegistrationStatsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (response: UserRegistrationStatsDTO[]) => {
        if (!this.isComponentActive) return;
        this.registrationStats = response;
        this.isLoadingRegistrationStats = false;
      },
      error: (error) => {
        if (!this.isComponentActive) return;
        console.error('Gabim në ngarkimin e statistikave të regjistrimeve:', error);
        this.toast.danger('Gabim në ngarkimin e statistikave të regjistrimeve', 'Gabim', 3000);
        this.isLoadingRegistrationStats = false;
      }
    });
  }

  loadSystemHealth(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingSystemHealth = true;
    this.adminDashboardService.apiAdminDashboardSystemHealthGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (response: { [key: string]: any }) => {
        if (!this.isComponentActive) return;
        this.systemHealth = response;
        this.isLoadingSystemHealth = false;
      },
      error: (error) => {
        if (!this.isComponentActive) return;
        console.error('Gabim në ngarkimin e shëndetit të sistemit:', error);
        this.toast.danger('Gabim në ngarkimin e shëndetit të sistemit', 'Gabim', 3000);
        this.isLoadingSystemHealth = false;
      }
    });
  }

  getActivityIcon(activityType: string | null | undefined): string {
    if (!activityType) return 'fas fa-circle';

    const iconMap: { [key: string]: string } = {
      'user_registration': 'fas fa-user-plus',
      'user_login': 'fas fa-sign-in-alt',
      'learnhub_created': 'fas fa-plus-circle',
      'learnhub_updated': 'fas fa-edit',
      'quiz_completed': 'fas fa-check-circle',
      'quiz_created': 'fas fa-question-circle',
      'profile_updated': 'fas fa-user-edit',
      'subscription_created': 'fas fa-credit-card',
      'default': 'fas fa-circle'
    };

    return iconMap[activityType.toLowerCase()] || iconMap['default'];
  }

  formatTimestamp(timestamp: string | undefined): string {
    if (!timestamp) return 'Data e panjohur';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Tani';
    if (diffInMinutes < 60) return `${diffInMinutes} minuta më parë`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} orë më parë`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ditë më parë`;

    return date.toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Metoda ndihmëse për të formatuar të dhënat
  formatCurrency(amount: number | undefined): string {
    if (!amount) return '€0';
    return new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatPercentage(value: number | undefined): string {
    if (!value) return '0%';
    return `${Math.round(value * 100)}%`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Data e panjohur';
    const date = new Date(dateString);
    return date.toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getMonthName(month: number | undefined): string {
    if (!month) return 'Muaj i panjohur';
    const months = [
      'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
      'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
    ];
    return months[month - 1] || 'Muaj i panjohur';
  }

  getDifficultyColor(difficulty: number | undefined): string {
    if (!difficulty) return '#ccc';
    if (difficulty <= 2) return '#4CAF50'; // Gjelbër për të lehtë
    if (difficulty <= 4) return '#FF9800'; // Portokalli për mesatar
    return '#F44336'; // Kuq për të vështirë
  }

  getDifficultyText(difficulty: number | undefined): string {
    if (!difficulty) return 'E panjohur';
    if (difficulty <= 2) return 'Lehtë';
    if (difficulty <= 4) return 'Mesatar';
    return 'I vështirë';
  }

  // Metoda për shëndetin e sistemit
  getSystemHealthKeys(): string[] {
    return Object.keys(this.systemHealth);
  }

  getSystemHealthValue(key: string): string {
    const value = this.systemHealth[key];
    if (typeof value === 'boolean') {
      return value ? 'Aktiv' : 'Joaktiv';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      // Check if it's a date string (ISO format or similar)
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (dateRegex.test(value)) {
        return this.formatSystemHealthDate(value);
      }
    }
    return String(value);
  }

  formatSystemHealthDate(dateString: string): string {
    if (!dateString) return 'Data e panjohur';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    // If it's within the last hour, show relative time
    if (diffInMinutes < 60) {
      if (diffInMinutes < 1) return 'Tani';
      return `${diffInMinutes} minuta më parë`;
    }

    // If it's within the last 24 hours, show hours
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} orë më parë`;
    }

    // Otherwise show formatted date
    return date.toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isSystemHealthy(key: string): boolean {
    const value = this.systemHealth[key];
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value > 0;
    }
    if (typeof value === 'string') {
      return value.toLowerCase().includes('ok') ||
             value.toLowerCase().includes('healthy') ||
             value.toLowerCase().includes('aktiv');
    }
    return false;
  }

  // Metodi per la gestione delle applicazioni supervisor
  loadSupervisorApplications(): void {
    if (!this.isComponentActive) return;
    if (!this.tokenStorageService.getAccessToken()) return;

    this.isLoadingSupervisorApplications = true;

    // Chiamata al nuovo endpoint per ottenere le applicazioni pendenti
    this.supervisorService.apiSupervisorApplicationsGet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SupervisorApplicationDTO[]) => {
          if (!this.isComponentActive) return;
          this.supervisorApplications = response;
          this.isLoadingSupervisorApplications = false;
        },
        error: (error) => {
          if (!this.isComponentActive) return;
          console.error('Error loading supervisor applications:', error);
          this.toast.danger(error?.error?.message || 'Ndodhi një gabim gjatë ngarkimit të aplikimeve', 'Gabim', 3000);
          this.supervisorApplications = [];
          this.isLoadingSupervisorApplications = false;
        }
      });
  }

  approveSupervisorApplication(application: any): void {
    // Assuming the backend returns applications with an ID field
    const applicationId = application.supervisorId || application.supervisorId;

    const approvalData: SupervisorApprovalDTO = {
      supervisorId: applicationId,
      isApproved: true
    };

    this.supervisorService.apiSupervisorApprovePost(approvalData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.toast.success('Aplikimi i supervisorit u pranua me sukses', 'Sukses', 3000);
          this.loadSupervisorApplications();
        },
        error: (error) => {
          console.error('Error approving supervisor application:', error);
          this.toast.danger(error?.error?.message || 'Ndodhi një gabim gjatë pranimit të aplikimit', 'Gabim', 3000);
        }
      });
  }

  rejectSupervisorApplication(application: any, rejectionReason: string = 'Refuzuar nga administratori'): void {
    // Assuming the backend returns applications with an ID field
    const applicationId = application.supervisorId || application.supervisorId;

    const approvalData: SupervisorApprovalDTO = {
      supervisorId: applicationId,
      isApproved: false,
      rejectionReason: rejectionReason
    };

    this.supervisorService.apiSupervisorApprovePost(approvalData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.toast.success('Aplikimi i supervisorit u refuzua me sukses', 'Sukses', 3000);
          this.loadSupervisorApplications();
        },
        error: (error) => {
          console.error('Error rejecting supervisor application:', error);
          this.toast.danger(error?.error?.message || 'Ndodhi një gabim gjatë refuzimit të aplikimit', 'Gabim', 3000);
        }
      });
  }
}
