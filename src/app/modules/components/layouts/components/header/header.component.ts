import {Component, OnInit} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {CommonModule} from "@angular/common";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {addQuizSvgComponent} from "../../../../shared/svgs/addQuizSvg/addQuizSvg.component";
import {MatTooltipModule} from "@angular/material/tooltip";
import {TokenStorageService} from "../../../../../services/token-storage.service";
import {AuthService} from "../../../../../api-client";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    addQuizSvgComponent,
    MatTooltipModule,
    RouterLink
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  isLogged = false;

  constructor(
    private _tokenStorageService: TokenStorageService,
    private _authService: AuthService,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this._tokenStorageService.isLoggedIn$.subscribe(loggedIn => {
      this.isLogged = loggedIn;
    });
  }

  logout() {
    this._authService.logoutPost().subscribe();
    this._tokenStorageService.clearTokens();
    this.router.navigate(['']);

  }
}
