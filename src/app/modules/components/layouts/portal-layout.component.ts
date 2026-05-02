import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, AsyncPipe } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { SidebarComponent } from '../admin/sidebar/sidebar.component';
import { UserRole } from '../../shared/constant/enums';
import { TokenStorageService } from '../../../services/token-storage.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, AsyncPipe, HeaderComponent, FooterComponent, SidebarComponent],
  templateUrl: './portal-layout.component.html',
  styleUrl: './portal-layout.component.scss'
})
export class PortalLayoutComponent implements OnInit {
  private tokenStorageService = inject(TokenStorageService);
  themeService = inject(ThemeService);

  get isDark(): boolean { return this.themeService.isDark; }

  sidebarCollapsed = true;
  isMobileMenuOpen = false;
  isMobile = false;

  ngOnInit(): void {
    this.isMobile = window.innerWidth < 768;
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number): void {
    this.isMobile = width < 768;
    if (!this.isMobile) {
      this.isMobileMenuOpen = false;
    }
  }

  showSideNav(): boolean {
    return this.tokenStorageService.getRole() === UserRole.ADMIN;
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
