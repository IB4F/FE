import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  constructor() { }

  private isLoading = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoading.asObservable();

  private activeRequests = 0;

  show() {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      this.isLoading.next(true);
    }
  }

  hide() {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
    if (this.activeRequests === 0) {
      this.isLoading.next(false);
    }
  }
}
