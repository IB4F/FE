import {Component} from '@angular/core';
import {CoursesTabsComponent} from "./courses-tabs/courses-tabs.component";
import {CommonModule} from "@angular/common";
import {DynamicBannerComponent} from "../../../shared/components/dynamic-banner/dynamic-banner.component";

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    CommonModule,
    CoursesTabsComponent,
    DynamicBannerComponent
  ],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss'
})
export class CoursesComponent {

}
