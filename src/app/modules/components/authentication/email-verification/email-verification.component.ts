import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../../../api-client";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './email-verification.component.html',
  styleUrl: './email-verification.component.scss'
})
export class EmailVerificationComponent implements OnInit {

  message: string = '';
  isSuccess: boolean = false;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private _authService: AuthService,
  ) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.verifyToken(token);
      } else {
        this.message = 'Token mancante.';
        this.isLoading = false;
      }
    });
  }

  verifyToken(token: string) {
    this._authService.verifyEmailGet(token)
      .subscribe({
        next: () => {
          this.isSuccess = true;
          this.message = 'Email verificata con successo!';
          this.isLoading = false;
          setTimeout(() => this.router.navigate(['/hyr']), 3000);
        },
        error: () => {
          this.message = 'Token non valido o scaduto.';
          this.isLoading = false;
        }
      });
  }

}
