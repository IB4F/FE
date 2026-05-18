import {Component, OnDestroy, OnInit} from '@angular/core';
import {CoursesTabsComponent} from "./courses-tabs/courses-tabs.component";
import {CommonModule} from "@angular/common";
import {Subject, takeUntil} from "rxjs";
import {UserService} from "../../../../services/user.service";

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, CoursesTabsComponent],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss'
})
export class CoursesComponent implements OnInit, OnDestroy {
  name = '';
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user?.firstName) {
        this.name = user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
