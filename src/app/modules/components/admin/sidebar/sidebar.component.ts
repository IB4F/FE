import {Component} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {MatListModule} from "@angular/material/list";
import {RouterLink, RouterLinkActive} from "@angular/router";
import {CommonModule} from "@angular/common";

interface MenuItem {
  path: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatListModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  menuItems: MenuItem[] = [
    {path: '/admin/panel', icon: 'dashboard', label: 'Paneli'},
    {path: '/admin/users', icon: 'people', label: 'Menaxhimi Userave'},
    {path: '/admin/learnhub', icon: 'menu_book', label: 'Menaxhimi Learnhubit'},
  ];
}
