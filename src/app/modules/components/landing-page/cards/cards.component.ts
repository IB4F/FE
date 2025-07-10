import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {TypeClass} from '../../../shared/constant/enums';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.scss'
})
export class CardsComponent {
  TypeClass = TypeClass;

  constructor(private router: Router) {
  }

  navigateToCourses(tab: TypeClass) {
    this.router.navigate(['/student/kurset'], {queryParams: {tab: tab}});
  }
}
