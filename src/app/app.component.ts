import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {LoginComponent} from "./modules/components/authentication/login/login.component";
import {NgToastModule, ToasterPosition} from "ng-angular-popup";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgToastModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'brain-gain-fe';
  protected readonly ToasterPosition = ToasterPosition;
}
