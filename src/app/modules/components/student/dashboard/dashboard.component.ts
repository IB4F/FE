import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {RouterLink} from "@angular/router";
import {Subject, takeUntil} from "rxjs";
import {UserService} from "../../../../services/user.service";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  user$ = this.userService.user$;
  name!: string;

  constructor(
    private userService: UserService,
  ) {
  }

  ngOnInit() {
    this.loadUserData();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  loadUserData() {
    this.user$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(user => {
      if (user && user.firstName) {
        this.name = user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1);
      } else {
        this.name = '';
      }
    });
  }

}
