import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {Subjects, TypeClass} from "../../../../shared/constant/enums";
import {ActivatedRoute} from "@angular/router";
import * as Category from "../../../../shared/components/svg/categories";
import {LearnHubsService, DetailsService, Class} from "../../../../../api-client";
import {LinksListComponent} from "./links-list/links-list.component";
import {UserService} from "../../../../../services/user.service";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";
import {TranslatePipe} from '../../../../../pipes/translate.pipe';

@Component({
  selector: 'app-courses-tabs',
  standalone: true,
  imports: [
    CommonModule,
    Category.AnglishtSvgComponent,
    Category.MatematikSvgComponent,
    Category.ShkencSvgComponent,
    Category.GjeografiSvgComponent,
    Category.HistoriSvgComponent,
    Category.LetersiSvgComponent,
    Category.AlbanianSvgComponent,
    LinksListComponent,
    TranslatePipe,
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
  selectedSubject: Subjects = Subjects.AlbanianLanguage;

  subjectLabels: { [key in Subjects]: string } = {
    [Subjects.AlbanianLanguage]: 'Gjuhë Shqipe',
    [Subjects.Literature]:       'Letërsia',
    [Subjects.Mathematics]:      'Matematikë',
    [Subjects.Geography]:        'Gjeografia',
    [Subjects.English]:          'Anglisht',
    [Subjects.History]:          'Histori',
    [Subjects.Science]:          'Shkencë',
  };

  subjectGlyphs: { [key in Subjects]: string } = {
    [Subjects.AlbanianLanguage]: 'Aa',
    [Subjects.Literature]:       '✦',
    [Subjects.Mathematics]:      'π',
    [Subjects.English]:          'En',
    [Subjects.History]:          '⌛',
    [Subjects.Geography]:        '◐',
    [Subjects.Science]:          '⚛',
  };

  subjectColors: { [key in Subjects]: { tone: string; soft: string } } = {
    [Subjects.AlbanianLanguage]: { tone: '#7C3AED', soft: '#F3E8FF' },
    [Subjects.Literature]:       { tone: '#BE185D', soft: '#FCE7F3' },
    [Subjects.Mathematics]:      { tone: '#1B9CD8', soft: '#E8F4FB' },
    [Subjects.English]:          { tone: '#0E5A85', soft: '#DBEAFE' },
    [Subjects.History]:          { tone: '#92400E', soft: '#FEF3C7' },
    [Subjects.Geography]:        { tone: '#065F46', soft: '#D1FAE5' },
    [Subjects.Science]:          { tone: '#9D174D', soft: '#FCE7F3' },
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
  ) {}

  ngOnInit() {
    this.loadClassesList();
    this.loadUserData();

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const tab = params['tab'];
      if (tab && Object.values(TypeClass).includes(tab)) {
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

  getClassNumber(typeClass: TypeClass): string {
    return typeClass.replace('Klasa ', '');
  }

  get userTypeClassLabel(): string {
    return this.userTypeClass || '';
  }

  selectTab(tab: TypeClass) {
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

  isTabDisabled(tab: TypeClass): boolean {
    return !this.canNavigateAllTabs && this.userTypeClass !== tab;
  }

  getCourses(typeClass: TypeClass, subject: Subjects) {
    this._learnHubsService.apiLearnHubsFilterLearnhubsGet(typeClass, subject).subscribe({
      next: (response) => {
        this.courses = response;
      },
      error: () => {
        this.courses = [];
      }
    });
  }

  private loadClassesList() {
    this._detailsService.apiDetailsGetClassGet().subscribe({
      next: (classes) => {
        this.classesList = classes;
        this.mapUserClassToTypeClass();
      },
      error: () => {}
    });
  }

  private loadUserData() {
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
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
      this.userTypeClass = this.mapClassNameToTypeClass(userClass.name);
      this.canNavigateAllTabs = false;

      if (this.userTypeClass && this.selectedTab !== this.userTypeClass) {
        this.selectedTab = this.userTypeClass;
        this.getCourses(this.selectedTab, this.selectedSubject);
      }
    } else {
      this.canNavigateAllTabs = true;
    }
  }

  private mapClassNameToTypeClass(className: string): TypeClass | null {
    const classMapping: { [key: string]: TypeClass } = {
      'Klasa 1':  TypeClass.First,
      'Klasa 2':  TypeClass.Second,
      'Klasa 3':  TypeClass.Third,
      'Klasa 4':  TypeClass.Fourth,
      'Klasa 5':  TypeClass.Fifth,
      'Klasa 6':  TypeClass.Sixth,
      'Klasa 7':  TypeClass.Seventh,
      'Klasa 8':  TypeClass.Eighth,
      'Klasa 9':  TypeClass.Nineth,
      'Klasa 10': TypeClass.Tenth,
      'Klasa 11': TypeClass.Eleventh,
      'Klasa 12': TypeClass.Twelveth,
    };
    return classMapping[className] || null;
  }
}
