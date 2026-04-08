import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {TypeClass} from '../../../shared/constant/enums';
import {TranslatePipe} from '../../../../pipes/translate.pipe';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [TranslatePipe],
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
