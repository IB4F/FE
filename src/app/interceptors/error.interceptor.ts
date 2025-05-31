import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core'
import {catchError, throwError} from 'rxjs';
import {NgToastService} from "ng-angular-popup";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NgToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        // Errore di rete
        notificationService.danger('Errore di rete. Controlla la connessione.', 'ERROR', 3000);
      } else if (error.status >= 500) {
        // Errore del server
        notificationService.danger('Errore del server. Riprova più tardi.', 'ERROR', 3000);
      } else {
        // Altri errori
        // notificationService.danger(`Errore: ${error.message}`, 'ERROR', 3000);
        console.log('errore')
      }
      return throwError(() => error);
    })
  );
};
