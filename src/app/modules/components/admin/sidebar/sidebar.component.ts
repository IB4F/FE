import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../../services/theme.service';
import { TokenStorageService } from '../../../../services/token-storage.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  @Output() collapsedChange = new EventEmitter<boolean>();

  themeService = inject(ThemeService);
  private tokenStorage = inject(TokenStorageService);
  private router = inject(Router);

  collapsed = true;
  userEmail = '';
  userInitials = 'AD';

  navItems: NavItem[] = [
    {
      path: '/admin/panel',
      label: 'Paneli',
      icon: 'M3 12L12 4l9 8M5 10v10h14V10'
    },
    {
      path: '/admin/users',
      label: 'Përdoruesit',
      icon: 'M16 11a4 4 0 10-8 0 4 4 0 008 0zM3 21a9 9 0 0118 0'
    },
    {
      path: '/admin/learnhub',
      label: 'LearnHub',
      icon: 'M4 6h16M4 12h16M4 18h10'
    }
  ];

  ngOnInit(): void {
    const email = this.tokenStorage.getUserEmail();
    if (email) {
      this.userEmail = email;
      this.userInitials = email.slice(0, 2).toUpperCase();
    }
    // Desktop: start collapsed (hover to expand). Mobile: always expanded.
    this.collapsed = window.innerWidth >= 768;
    this.collapsedChange.emit(this.collapsed);
  }

  onMouseEnter(): void {
    if (window.innerWidth < 768) return;
    this.collapsed = false;
    this.collapsedChange.emit(false);
  }

  onMouseLeave(): void {
    if (window.innerWidth < 768) return;
    this.collapsed = true;
    this.collapsedChange.emit(true);
  }

  logout(): void {
    this.tokenStorage.clearTokens();
    this.router.navigate(['/hyr']);
  }
}
