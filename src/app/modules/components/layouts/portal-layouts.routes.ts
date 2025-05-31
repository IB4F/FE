import {Routes} from '@angular/router';
import {PortalLayoutComponent} from "./portal-layout.component";
import {roleGuard} from "../../../guards/role.guard";

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
        path: 'supervizor',
        children: [
          {
            path: 'apliko',
            title: 'Apliko',
            loadComponent: () => import('../authentication/register-supervizor/register-supervizor.component')
              .then(m => m.RegisterSupervizorComponent),
          },
        ]
      },
      {
        path: 'student',
        children: [
          {
            path: 'membership',
            loadComponent: () => import('../authentication/membership-student/membership-student.component')
              .then(m => m.MembershipStudentComponent)
          },
          {
            path: 'dashboard',
            canActivate: [roleGuard('Student')],
            loadComponent: () => import('../student/dashboard/dashboard.component')
              .then(m => m.DashboardComponent)
          },

        ]
      }
    ]
  }
];
