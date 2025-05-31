import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {LoginComponent} from "./modules/components/authentication/login/login.component";
import {NgToastModule, ToasterPosition} from "ng-angular-popup";
import {LoaderService} from "./modules/shared/components/loader/loader.service";
import {CommonModule} from "@angular/common";
import {LoaderComponent} from "./modules/shared/components/loader/loader.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgToastModule,
    CommonModule,
    LoaderComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'brain-gain-fe';
  isLoading$ = this.loaderService.isLoading$;
  protected readonly ToasterPosition = ToasterPosition;

  constructor(private loaderService: LoaderService) {}
}
