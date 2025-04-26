import {Routes} from '@angular/router';
import {PortalLayoutComponent} from "./portal-layout.component";
import {authGuard} from "../../../guards/auth.guard";

export const PortalLayoutsRoutes: Routes = [
  {
    path: '',
    component: PortalLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('../landing-page/landing-page.component')
          .then(m => m.LandingPageComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('../student/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        canActivate: [authGuard]
      }
    ]
  }
];
