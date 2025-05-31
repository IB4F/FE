import {Component} from '@angular/core';
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './membership.component.html',
  styleUrl: './membership.component.scss'
})
export class MembershipComponent {

}
