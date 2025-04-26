import { Component } from '@angular/core';
import {CommonModule} from "@angular/common";
import {CardsComponent} from "./cards/cards.component";

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CardsComponent
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {

}
