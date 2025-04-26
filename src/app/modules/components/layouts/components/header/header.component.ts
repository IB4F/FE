import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../../../../api-client/auth";
import {Router, RouterLink} from "@angular/router";
import {CommonModule} from "@angular/common";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {addQuizSvgComponent} from "../../../../shared/svgs/addQuizSvg/addQuizSvg.component";
import {MatTooltipModule} from "@angular/material/tooltip";
import {TokenStorageService} from "../../../../../services/token-storage.service";

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

  constructor(
    private _tokenStorageService : TokenStorageService,
    private _authService: AuthService,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
  }

  isLogged(): boolean {
    return  !!this._tokenStorageService.getAccessToken();
  }

  logout() {
    this._authService.loginPost();
    this._tokenStorageService.clearTokens();
    this.router.navigate(['']);

  }
}
