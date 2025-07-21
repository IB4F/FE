import {Component, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {Subjects, TypeClass} from "../../../../shared/constant/enums";
import {ActivatedRoute} from "@angular/router";
import * as Grade from "../../../../shared/components/svg/grades";
import * as Category from "../../../../shared/components/svg/categories";
import {LearnHubsService} from "../../../../../api-client";
import {LinksListComponent} from "./links-list/links-list.component";

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
export class CoursesTabsComponent implements OnInit {
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

  constructor(
    private route: ActivatedRoute,
    private _learnHubsService: LearnHubsService,
  ) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && Object.values(TypeClass).includes(tab)) {
        this.selectedTab = tab;
      }
    });
    this.getCourses(this.selectedTab, this.selectedSubject);

  }

  selectTab(tab: TypeClass) {
    this.selectedTab = tab;
    this.selectedSubject = this.subjects[0];
    this.getCourses(this.selectedTab, this.selectedSubject);

  }

  selectSubject(subject: Subjects) {
    this.selectedSubject = subject;
    this.getCourses(this.selectedTab, this.selectedSubject);
  }

    getCourses(typeClass: TypeClass, subject: Subjects) {
      this._learnHubsService.apiLearnHubsFilterLearnhubsGet(typeClass, subject).subscribe({
        next: (response) => {
          this.courses = response;
          console.log('Courses fetched:', response);
        },
        error: (error) => {
          this.courses = [];
          console.error('Error fetching courses:', error);
        }
      });
    }
}
