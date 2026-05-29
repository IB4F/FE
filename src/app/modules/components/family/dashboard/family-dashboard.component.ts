import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgToastService } from 'ng-angular-popup';

import { FamilyService } from '../../../../api-client/api/family.service';
import { UserService } from '../../../../services/user.service';
import { ChildSummaryDto } from '../../../../api-client/model/childSummaryDto';
import { User } from '../../../../api-client/model/user';

@Component({
  selector: 'app-family-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './family-dashboard.component.html',
  styleUrl: './family-dashboard.component.scss'
})
export class FamilyDashboardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  currentUser: User | null = null;
  children: ChildSummaryDto[] = [];
  isLoading = true;
  error: string | null = null;

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Mirëmëngjes';
    if (hour < 18) return 'Mirëdita';
    return 'Mirëmbrëma';
  }

  get activeChildren(): number {
    return this.children.filter(c => c.isActive).length;
  }

  get subscriptionExpiry(): string | null {
    return this.currentUser?.subscriptionExpiresAt ?? null;
  }

  constructor(
    private familyService: FamilyService,
    private userService: UserService,
    private router: Router,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.loadUserData().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadChildren();
      },
      error: () => {
        this.error = 'Ndodhi një gabim gjatë ngarkimit të të dhënave.';
        this.isLoading = false;
      }
    });
  }

  private loadChildren(): void {
    this.familyService.apiFamilyChildrenGet().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.children = (res.children ?? []).filter(c => c.isActive);
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Ndodhi një gabim gjatë ngarkimit të fëmijëve.';
        this.isLoading = false;
      }
    });
  }

  goToChildren(): void {
    this.router.navigate(['/family/children']);
  }

  getLastLoginLabel(lastLogin: string | null | undefined): string {
    if (!lastLogin) return 'Asnjëherë';
    const diff = Date.now() - new Date(lastLogin).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return 'Sot';
    if (hours < 24) return `${hours}h më parë`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Dje';
    return `${days} ditë më parë`;
  }
}
