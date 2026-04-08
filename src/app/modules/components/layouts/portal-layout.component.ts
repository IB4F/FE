import {Component, HostListener, inject, OnInit} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {HeaderComponent} from "./components/header/header.component";
import {FooterComponent} from "./components/footer/footer.component";
import {MatSidenavModule} from "@angular/material/sidenav";
import {SidebarComponent} from "../admin/sidebar/sidebar.component";
import {UserRole} from "../../shared/constant/enums";
import {TokenStorageService} from "../../../services/token-storage.service";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatTooltipModule} from "@angular/material/tooltip";

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    MatSidenavModule,
    SidebarComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './portal-layout.component.html',
  styleUrl: './portal-layout.component.scss'
})
export class PortalLayoutComponent implements OnInit {
  private tokenStorageService = inject(TokenStorageService);
  isSideNavOpen = true;
  isHovered = false;
  sidenavMode: 'side' | 'over' = 'side';

  ngOnInit(): void {
    this.updateSidenavState(window.innerWidth);
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number): void {
    this.updateSidenavState(width);
  }

  private updateSidenavState(width: number): void {
    if (width < 768) {
      this.sidenavMode = 'over';
      this.isSideNavOpen = false;
    } else {
      this.sidenavMode = 'side';
      this.isSideNavOpen = true;
    }
  }

  showSideNav(): boolean {
    return this.tokenStorageService.getRole() === UserRole.ADMIN;
  }

  toggleSideNav(): void {
    this.isSideNavOpen = !this.isSideNavOpen;
  }

  onSidenavHover(): void {
    if (!this.isSideNavOpen) {
      this.isSideNavOpen = true;
    }
    this.isHovered = true;
  }

  onSidenavLeave(): void {
    this.isHovered = false;
  }
}