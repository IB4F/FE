import { Component, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './payment-cancel.component.html',
  styleUrl: './payment-cancel.component.scss'
})
export class PaymentCancelComponent implements OnInit {
  redirectCountdown = 3;
  private countdownInterval: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.startCountdown();
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.redirectCountdown--;
      if (this.redirectCountdown <= 0) {
        clearInterval(this.countdownInterval);
        this.router.navigate(['/regjistrohu'], { 
          queryParams: { message: 'payment-cancelled' } 
        });
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  goToRegistration(): void {
    this.router.navigate(['/regjistrohu'], { 
      queryParams: { message: 'payment-cancelled' } 
    });
  }
}
