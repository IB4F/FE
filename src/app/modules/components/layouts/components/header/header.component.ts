import {Component, OnInit} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {CommonModule} from "@angular/common";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {TokenStorageService} from "../../../../../services/token-storage.service";
import {UserRole} from "../../../../shared/constant/enums";
import {UserService} from "../../../../../services/user.service";
import {map} from "rxjs";
import {AuthService} from "../../../../../api-client";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    MatButtonModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  isLogged = false;
  userRole: string | null = null;
  user$ = this.userService.user$;
  initials$ = this.user$.pipe(
    map(user => {
      if (!user) return '';
      const firstNameInitial = user.firstName?.[0] || '';
      const lastNameInitial = user.lastName?.[0] || '';
      return `${firstNameInitial}${lastNameInitial}`.toUpperCase();
    })
  );
  constructor(
    private _tokenStorageService: TokenStorageService,
    private _authService: AuthService,
    private router: Router,
    private userService: UserService,
  ) {
  }

  ngOnInit(): void {
    this._tokenStorageService.isLoggedIn$.subscribe(loggedIn => {
      this.isLogged = loggedIn;
      if (loggedIn) {
        this.userRole = this._tokenStorageService.getRole();
      } else {
        this.userRole = null;
      }
    });
  }

  logout() {
    this._authService.logoutPost().subscribe();
    this._tokenStorageService.clearTokens();
    this.userService.clearUserData();
    this.router.navigate(['']);
  }

  showDashboard(): boolean {
    return this.userRole === UserRole.STUDENT;
  }

  showPanel(): boolean {
    return this.userRole === UserRole.ADMIN;
  }
}
