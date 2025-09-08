import { Injectable } from '@angular/core';
import { NgToastService } from 'ng-angular-popup';

export interface SubscriptionError {
  code?: string;
  message: string;
  details?: any;
  userFriendlyMessage: string;
  action?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionErrorHandlerService {

  constructor(private toast: NgToastService) {}

  /**
   * Handle registration errors with user-friendly messages
   */
  handleRegistrationError(error: any): void {
    const subscriptionError = this.parseRegistrationError(error);
    this.showErrorToast(subscriptionError);
  }

  /**
   * Handle subscription management errors
   */
  handleSubscriptionError(error: any, operation: string): void {
    const subscriptionError = this.parseSubscriptionError(error, operation);
    this.showErrorToast(subscriptionError);
  }

  /**
   * Handle payment errors
   */
  handlePaymentError(error: any): void {
    const subscriptionError = this.parsePaymentError(error);
    this.showErrorToast(subscriptionError);
  }

  /**
   * Parse registration errors
   */
  private parseRegistrationError(error: any): SubscriptionError {
    const message = error?.error?.message?.toLowerCase() || '';
    const code = error?.error?.code || error?.status;

    // Email already exists
    if (message.includes('email already exists') || message.includes('email tashmë ekziston')) {
      return {
        code: 'EMAIL_EXISTS',
        message: error?.error?.message || 'Email already exists',
        userFriendlyMessage: 'Ky email është tashmë i regjistruar. Ju lutemi përdorni një email tjetër ose provoni të hyni.',
        action: 'Ju mund të hyni në llogarinë tuaj ekzistuese ose të përdorni një email tjetër.'
      };
    }

    // Password complexity
    if (message.includes('password') && (message.includes('complexity') || message.includes('requirements'))) {
      return {
        code: 'PASSWORD_COMPLEXITY',
        message: error?.error?.message || 'Password does not meet requirements',
        userFriendlyMessage: 'Fjalëkalimi duhet të përmbajë shkronja të mëdha, të vogla, numra dhe karaktere speciale (8+ karaktere).',
        action: 'Ju lutemi shkruani një fjalëkalim më të fortë.'
      };
    }

    // Class not found
    if (message.includes('class not found') || message.includes('klasa nuk u gjet')) {
      return {
        code: 'CLASS_NOT_FOUND',
        message: error?.error?.message || 'Class not found',
        userFriendlyMessage: 'Ju lutemi zgjidhni një klasë të vlefshme nga lista.',
        action: 'Kontrolloni që keni zgjedhur një klasë të vlefshme.'
      };
    }

    // Plan not found
    if (message.includes('plan not found') || message.includes('paketa nuk u gjet')) {
      return {
        code: 'PLAN_NOT_FOUND',
        message: error?.error?.message || 'Plan not found',
        userFriendlyMessage: 'Ju lutemi zgjidhni një paketë të vlefshme regjistrimi.',
        action: 'Kontrolloni që keni zgjedhur një paketë të vlefshme.'
      };
    }

    // Invalid email format
    if (message.includes('invalid email') || message.includes('email i pavlefshëm')) {
      return {
        code: 'INVALID_EMAIL',
        message: error?.error?.message || 'Invalid email format',
        userFriendlyMessage: 'Ju lutemi shkruani një adresë email të vlefshme.',
        action: 'Kontrolloni formatin e email-it tuaj.'
      };
    }

    // Family members validation
    if (message.includes('family members') || message.includes('anëtarët e familjes')) {
      return {
        code: 'FAMILY_MEMBERS_INVALID',
        message: error?.error?.message || 'Family members validation failed',
        userFriendlyMessage: 'Ju lutemi plotësoni të dhënat për të gjithë anëtarët e familjes.',
        action: 'Kontrolloni që të gjitha fushat për anëtarët e familjes janë plotësuar.'
      };
    }

    // Stripe session creation failed
    if (message.includes('stripe session') || message.includes('payment system')) {
      return {
        code: 'STRIPE_SESSION_FAILED',
        message: error?.error?.message || 'Payment system error',
        userFriendlyMessage: 'Sistemi i pagesave është përkohësisht i padisponueshëm. Ju lutemi provoni përsëri më vonë.',
        action: 'Ju lutemi provoni përsëri pas disa minutash.'
      };
    }

    // Network errors
    if (code === 0 || code === 500 || code === 502 || code === 503 || code === 504) {
      return {
        code: 'NETWORK_ERROR',
        message: error?.error?.message || 'Network error',
        userFriendlyMessage: 'Ka një problem me lidhjen. Ju lutemi kontrolloni internetin tuaj dhe provoni përsëri.',
        action: 'Kontrolloni lidhjen tuaj me internetin.'
      };
    }

    // Generic error
    return {
      code: 'GENERIC_ERROR',
      message: error?.error?.message || 'An error occurred',
      userFriendlyMessage: 'Ndodhi një gabim gjatë regjistrimit. Ju lutemi provoni përsëri.',
      action: 'Nëse problemi vazhdon, ju lutemi kontaktoni mbështetjen.'
    };
  }

  /**
   * Parse subscription management errors
   */
  private parseSubscriptionError(error: any, operation: string): SubscriptionError {
    const message = error?.error?.message?.toLowerCase() || '';
    const code = error?.error?.code || error?.status;

    // Subscription not found
    if (message.includes('subscription not found') || message.includes('abonimi nuk u gjet')) {
      return {
        code: 'SUBSCRIPTION_NOT_FOUND',
        message: error?.error?.message || 'Subscription not found',
        userFriendlyMessage: 'Abonimi nuk u gjet. Ju lutemi rifreskoni faqen dhe provoni përsëri.',
        action: 'Rifreskoni faqen ose hyni përsëri në llogarinë tuaj.'
      };
    }

    // Already cancelled
    if (message.includes('already cancelled') || message.includes('tashmë anuluar')) {
      return {
        code: 'ALREADY_CANCELLED',
        message: error?.error?.message || 'Subscription already cancelled',
        userFriendlyMessage: 'Abonimi është tashmë anuluar.',
        action: 'Nuk mund të kryeni këtë veprim në një abonim të anuluar.'
      };
    }

    // Already paused
    if (message.includes('already paused') || message.includes('tashmë pauzuar')) {
      return {
        code: 'ALREADY_PAUSED',
        message: error?.error?.message || 'Subscription already paused',
        userFriendlyMessage: 'Abonimi është tashmë pauzuar.',
        action: 'Nuk mund të pauzoni një abonim që është tashmë pauzuar.'
      };
    }

    // Plan change not allowed
    if (message.includes('plan change not allowed') || message.includes('ndryshimi i planit nuk lejohet')) {
      return {
        code: 'PLAN_CHANGE_NOT_ALLOWED',
        message: error?.error?.message || 'Plan change not allowed',
        userFriendlyMessage: 'Ndryshimi i planit nuk lejohet në këtë moment.',
        action: 'Kontaktoni mbështetjen për ndihmë me ndryshimin e planit.'
      };
    }

    // Generic subscription error
    return {
      code: 'SUBSCRIPTION_ERROR',
      message: error?.error?.message || `Failed to ${operation}`,
      userFriendlyMessage: `Dështoi të ${this.getOperationText(operation)}. Ju lutemi provoni përsëri.`,
      action: 'Nëse problemi vazhdon, ju lutemi kontaktoni mbështetjen.'
    };
  }

  /**
   * Parse payment errors
   */
  private parsePaymentError(error: any): SubscriptionError {
    const message = error?.error?.message?.toLowerCase() || '';
    const code = error?.error?.code || error?.status;

    // Payment failed
    if (message.includes('payment failed') || message.includes('pagesa dështoi')) {
      return {
        code: 'PAYMENT_FAILED',
        message: error?.error?.message || 'Payment failed',
        userFriendlyMessage: 'Pagesa dështoi. Ju lutemi kontrolloni detajet e kartës dhe provoni përsëri.',
        action: 'Kontrolloni që detajet e kartës janë të sakta.'
      };
    }

    // Insufficient funds
    if (message.includes('insufficient funds') || message.includes('fondet e pamjaftueshme')) {
      return {
        code: 'INSUFFICIENT_FUNDS',
        message: error?.error?.message || 'Insufficient funds',
        userFriendlyMessage: 'Fondet në llogarinë tuaj janë të pamjaftueshme.',
        action: 'Kontrolloni balancën e llogarisë suaj ose përdorni një kartë tjetër.'
      };
    }

    // Card declined
    if (message.includes('card declined') || message.includes('karta u refuzua')) {
      return {
        code: 'CARD_DECLINED',
        message: error?.error?.message || 'Card declined',
        userFriendlyMessage: 'Karta juaj u refuzua nga banka.',
        action: 'Kontaktoni bankën tuaj ose përdorni një kartë tjetër.'
      };
    }

    // Generic payment error
    return {
      code: 'PAYMENT_ERROR',
      message: error?.error?.message || 'Payment error',
      userFriendlyMessage: 'Ndodhi një gabim gjatë pagesës. Ju lutemi provoni përsëri.',
      action: 'Kontaktoni mbështetjen nëse problemi vazhdon.'
    };
  }

  /**
   * Show error toast with user-friendly message
   */
  private showErrorToast(error: SubscriptionError): void {
    this.toast.danger(error.userFriendlyMessage, 'GABIM', 5000);
    
    // Log detailed error for debugging
    console.error('Subscription Error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      userFriendlyMessage: error.userFriendlyMessage,
      action: error.action
    });
  }

  /**
   * Get operation text in Albanian
   */
  private getOperationText(operation: string): string {
    const operationMap: { [key: string]: string } = {
      'cancel': 'anulohej abonimi',
      'pause': 'pauzohej abonimi',
      'resume': 'rifillohej abonimi',
      'change plan': 'ndryshohej plani',
      'load': 'ngarkohej abonimi',
      'create': 'krijohej abonimi'
    };
    return operationMap[operation.toLowerCase()] || operation;
  }

  /**
   * Show success message
   */
  showSuccessMessage(message: string, action?: string): void {
    this.toast.success(message, 'SUKSES', 4000);
    if (action) {
      console.log('Success Action:', action);
    }
  }

  /**
   * Show warning message
   */
  showWarningMessage(message: string, action?: string): void {
    this.toast.warning(message, 'KUJDES', 4000);
    if (action) {
      console.log('Warning Action:', action);
    }
  }

  /**
   * Show info message
   */
  showInfoMessage(message: string, action?: string): void {
    this.toast.info(message, 'INFO', 4000);
    if (action) {
      console.log('Info Action:', action);
    }
  }
}
