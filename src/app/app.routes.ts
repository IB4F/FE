import {Routes} from '@angular/router';
import {PageNotFoundComponent} from "./modules/components/layouts/components/page-not-found/page-not-found.component";

export const routes: Routes = [
  {
    path: 'hyr',
    title: 'Login',
    loadComponent: () => import('./modules/components/authentication/login/login.component')
      .then(m => m.LoginComponent),
  },
  {
    path: 'regjistrohu',
    title: 'Register',
    loadComponent: () => import('./modules/components/authentication/register/register.component')
      .then(m => m.RegisterComponent),
  },
  {
    path: 'apliko',
    title: 'Apliko',
    loadComponent: () => import('./modules/components/authentication/register-supervizor/register-supervizor.component')
      .then(m => m.RegisterSupervizorComponent),
  },
  {
    path: 'membership',
    title: 'Membership',
    loadComponent: () => import('./modules/components/authentication/membership/membership.component')
      .then(m => m.MembershipComponent),
  },
  {
    path: 'reset',
    title: 'Reset Password',
    loadComponent: () => import('./modules/components/authentication/forget-password/forget-password.component')
      .then(m => m.ForgetPasswordComponent),
  },
  {
    path: '',
    loadChildren: () => import('./modules/components/layouts/portal-layouts.routes')
      .then(r => r.PortalLayoutsRoutes),
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];
