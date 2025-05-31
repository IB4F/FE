import { Injectable } from '@angular/core';
import {BehaviorSubject, combineLatest, map, Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class MembershipStudentService {
  // Stato del form di registrazione
  private registerFormValid = new BehaviorSubject<boolean>(false);

  // Pacchetto selezionato
  private selectedPackage = new BehaviorSubject<any>(null);

  // Observable combinato per abilitare il bottone
  isSubmitEnabled$: Observable<boolean> = combineLatest([
    this.registerFormValid,
    this.selectedPackage
  ]).pipe(
    map(([isRegisterValid, packageSelected]) => isRegisterValid && !!packageSelected)
  );

  // Metodi per aggiornare lo stato
  setRegisterFormValid(valid: boolean): void {
    this.registerFormValid.next(valid);
  }

  setSelectedPackage(pack: any): void {
    this.selectedPackage.next(pack);
  }

  getSelectedPackage(): any {
    return this.selectedPackage.value;
  }
}
