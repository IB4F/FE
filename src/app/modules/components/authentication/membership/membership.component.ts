import {Component} from '@angular/core';
import {RouterLink} from "@angular/router";
import {TranslatePipe} from '../../../../pipes/translate.pipe';

@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [
    RouterLink
  ,
    TranslatePipe],
  templateUrl: './membership.component.html',
  styleUrl: './membership.component.scss'
})
export class MembershipComponent {

}
