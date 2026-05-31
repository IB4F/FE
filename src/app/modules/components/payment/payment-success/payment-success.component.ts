import { Component, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Router, RouterLink, ActivatedRoute } from "@angular/router";
import { take } from 'rxjs';
import {TranslatePipe} from '../../../../pipes/translate.pipe';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ,
    TranslatePipe],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss'
})
export class PaymentSuccessComponent implements OnInit {
  redirectCountdown = 3;
  private countdownInterval: any;
  sessionId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check for session_id from Stripe
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      this.sessionId = params['session_id'] || null;
    });

    this.startCountdown();
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.redirectCountdown--;
      if (this.redirectCountdown <= 0) {
        clearInterval(this.countdownInterval);
        this.router.navigate(['/hyr'], { 
          queryParams: { message: 'registration-success' } 
        });
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/hyr'], { 
      queryParams: { message: 'registration-success' } 
    });
  }
}
