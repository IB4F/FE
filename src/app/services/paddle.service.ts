import { Injectable } from '@angular/core';
import { environment } from '@env';

declare const Paddle: any;

@Injectable({ providedIn: 'root' })
export class PaddleService {
  private initialized = false;
  private loading: Promise<void> | null = null;

  private load(): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = new Promise((resolve, reject) => {
      if (typeof Paddle !== 'undefined') {
        this.init();
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.onload = () => { this.init(); resolve(); };
      script.onerror = () => reject(new Error('Failed to load Paddle.js'));
      document.head.appendChild(script);
    });
    return this.loading;
  }

  private init(): void {
    if (this.initialized) return;
    if (environment.paddleSandbox) {
      Paddle.Environment.set('sandbox');
    }
    Paddle.Initialize({ token: environment.paddleClientKey });
    this.initialized = true;
  }

  async openCheckout(transactionId: string, successUrl?: string): Promise<void> {
    await this.load();
    Paddle.Checkout.open({
      transactionId,
      settings: {
        successUrl: successUrl ?? `${window.location.origin}/success`,
      }
    });
  }
}