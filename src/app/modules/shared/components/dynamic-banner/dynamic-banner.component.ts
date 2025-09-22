import {Component, Input, OnChanges} from '@angular/core';
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-dynamic-banner',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './dynamic-banner.component.html',
  styleUrl: './dynamic-banner.component.scss'
})
export class DynamicBannerComponent implements OnChanges {
  @Input() bannerType: string = '';
  title: string = '';
  bannerImage: string = '';

  ngOnChanges(): void {
    if (this.bannerType) {
      this.setBannerDetails();
    }
  }

  setBannerDetails() {
    switch (this.bannerType) {
      case 'quiz':
        this.title = 'Kurse për të gjitha klasat';
        this.bannerImage = 'assets/svgImages/banner/courses.svg';
        break;
      case 'exam-management':
        this.title = 'Shto Kuizet tek linku i perzgjedhur';
        this.bannerImage = 'assets/svgImages/banner/exam-management.svg';
        break;
      case 'exam-submit':
        this.title = 'Përfundo kuicet për të arritur Suksesin!';
        this.bannerImage = 'assets/svgImages/banner/exam-submit.svg';
        break;
      case 'success-exams':
        this.title = 'Të gjitha kuizet janë përfunduar! Urime për përfundimin!';
        this.bannerImage = 'assets/svgImages/banner/success.svg';
        break;
      case 'course':
        this.title = 'Course Management';
        this.bannerImage = 'assets/svgImages/banner/course-management.svg';
        break;
      case 'membership':
        this.title = 'Paketat tona të çmimeve të gatshme';
        this.bannerImage = 'assets/svgImages/membership.svg';
        break;
      case 'family':
        this.title = 'Përfshirja Familjare në Edukim: Një Platformë e Unifikuar';
        this.bannerImage = 'assets/svgImages/family.svg';
        break;
      case 'supervisor':
        this.title = 'Menaxhimi i studentëve në një platformë të unifikuar';
        this.bannerImage = 'assets/svgImages/supervizor.svg';
        break;
      default:
        this.title = 'Default Title';
        this.bannerImage = 'assets/svgImages/banner/default.svg';
    }
  }
}
