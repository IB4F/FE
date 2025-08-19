import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {Subjects, TypeClass} from "../../../../shared/constant/enums";
import {ActivatedRoute} from "@angular/router";
import * as Grade from "../../../../shared/components/svg/grades";
import * as Category from "../../../../shared/components/svg/categories";
import {LearnHubsService, DetailsService, Class} from "../../../../../api-client";
import {LinksListComponent} from "./links-list/links-list.component";
import {UserService} from "../../../../../services/user.service";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";

@Component({
  selector: 'app-courses-tabs',
  standalone: true,
  imports: [
    CommonModule,
    Grade.FirstSvgComponent,
    Grade.SecondSvgComponent,
    Grade.ThirdSvgComponent,
    Grade.FourthSvgComponent,
    Grade.FifthSvgComponent,
    Grade.SixthSvgComponent,
    Grade.SeventhSvgComponent,
    Grade.EighthSvgComponent,
    Grade.NinethComponent,
    Grade.TenthComponent,
    Grade.EleventhComponent,
    Grade.TwelvethComponent,
    Category.AnglishtSvgComponent,
    Category.MatematikSvgComponent,
    Category.ShkencSvgComponent,
    Category.GjeografiSvgComponent,
    Category.HistoriSvgComponent,
    Category.LetersiSvgComponent,
    LinksListComponent
  ],
  templateUrl: './courses-tabs.component.html',
  styleUrl: './courses-tabs.component.scss'
})
export class CoursesTabsComponent implements OnInit, OnDestroy {
  TypeClass = TypeClass;
  Subject = Subjects;

  subjects = Object.values(Subjects);
  typeClasses = Object.values(TypeClass);

  selectedTab: TypeClass = TypeClass.First;
  selectedSubject: Subjects = Subjects.Literature;

  subjectLabels: { [key in Subjects]: string } = {
    [Subjects.Literature]: 'Letërsia',
    [Subjects.Mathematics]: 'Matematikë',
    [Subjects.Geography]: 'Gjeografia',
    [Subjects.English]: 'Anglisht',
    [Subjects.History]: 'Histori',
    [Subjects.Science]: 'Shkencë'
  };

  courses: any[] = [];
  classesList: Class[] = [];
  userClassId: string | null = null;
  userTypeClass: TypeClass | null = null;
  canNavigateAllTabs = true;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private _learnHubsService: LearnHubsService,
    private _detailsService: DetailsService,
    private userService: UserService,
  ) {
  }

  ngOnInit() {
    this.loadClassesList();
    this.loadUserData();

    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && Object.values(TypeClass).includes(tab)) {
        // Only allow tab selection if user can navigate all tabs or if it's their assigned class
        if (this.canNavigateAllTabs || this.userTypeClass === tab) {
          this.selectedTab = tab;
        }
      }
    });

    this.getCourses(this.selectedTab, this.selectedSubject);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadClassesList() {
    this._detailsService.apiDetailsGetClassGet().subscribe({
      next: (classes) => {
        this.classesList = classes;
        this.mapUserClassToTypeClass();
      },
      error: (error) => {
        console.error('Error loading classes:', error);
      }
    });
  }

  private loadUserData() {
    this.userService.user$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user?.currentClass) {
        this.userClassId = user.currentClass;
        this.mapUserClassToTypeClass();
      } else {
        this.userClassId = null;
        this.userTypeClass = null;
        this.canNavigateAllTabs = true;
      }
    });
  }

  private mapUserClassToTypeClass() {
    if (!this.userClassId || this.classesList.length === 0) {
      this.canNavigateAllTabs = true;
      return;
    }

    const userClass = this.classesList.find(c => c.id === this.userClassId);

    if (userClass?.name) {
      // Map class name to TypeClass enum
      this.userTypeClass = this.mapClassNameToTypeClass(userClass.name);
      this.canNavigateAllTabs = false;

      // Set the selected tab to user's class if not already set
      if (this.userTypeClass && this.selectedTab !== this.userTypeClass) {
        this.selectedTab = this.userTypeClass;
        this.getCourses(this.selectedTab, this.selectedSubject);
      }
    } else {
      this.canNavigateAllTabs = true;
    }
  }

  private mapClassNameToTypeClass(className: string): TypeClass | null {
    // Map class names to TypeClass enum values
    const classMapping: { [key: string]: TypeClass } = {
      'Klasa 1': TypeClass.First,
      'Klasa 2': TypeClass.Second,
      'Klasa 3': TypeClass.Third,
      'Klasa 4': TypeClass.Fourth,
      'Klasa 5': TypeClass.Fifth,
      'Klasa 6': TypeClass.Sixth,
      'Klasa 7': TypeClass.Seventh,
      'Klasa 8': TypeClass.Eighth,
      'Klasa 9': TypeClass.Nineth,
      'Klasa 10': TypeClass.Tenth,
      'Klasa 11': TypeClass.Eleventh,
      'Klasa 12': TypeClass.Twelveth,
    };

    return classMapping[className] || null;
  }

  selectTab(tab: TypeClass) {
    // Only allow tab selection if user can navigate all tabs or if it's their assigned class
    if (this.canNavigateAllTabs || this.userTypeClass === tab) {
      this.selectedTab = tab;
      this.selectedSubject = this.subjects[0];
      this.getCourses(this.selectedTab, this.selectedSubject);
    }
  }

  selectSubject(subject: Subjects) {
    this.selectedSubject = subject;
    this.getCourses(this.selectedTab, this.selectedSubject);
  }

  // Helper method to check if a tab should be disabled
  isTabDisabled(tab: TypeClass): boolean {
    const isDisabled = !this.canNavigateAllTabs && this.userTypeClass !== tab;
    return isDisabled;
  }

  getCourses(typeClass: TypeClass, subject: Subjects) {
    this._learnHubsService.apiLearnHubsFilterLearnhubsGet(typeClass, subject).subscribe({
      next: (response) => {
        this.courses = response;
      },
      error: (error) => {
        this.courses = [];
        console.error('Error fetching courses:', error);
      }
    });
  }
}
