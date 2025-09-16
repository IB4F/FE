import {Routes} from '@angular/router';
import {PageNotFoundComponent} from "./modules/components/layouts/components/page-not-found/page-not-found.component";

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/components/layouts/portal-layouts.routes')
      .then(r => r.PortalLayoutsRoutes)
  },
  {
    path: 'hyr',
    title: 'Login',
    loadComponent: () => import('./modules/components/authentication/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'regjistrohu',
    title: 'Register',
    loadComponent: () => import('./modules/components/authentication/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'verify-email',
    title: 'Verifikim Email',
    loadComponent: () => import('./modules/components/authentication/email-verification/email-verification.component')
      .then(m => m.EmailVerificationComponent),
    pathMatch: 'full'
  },
  {
    path: 'reset-password',
    title: 'Ndrysho Fjalëkalimin',
    loadComponent: () => import('./modules/components/authentication/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent),
    pathMatch: 'full'
  },
  {
    path: 'change-password-first-time',
    title: 'Ndrysho Fjalëkalimin - Hyrja e Parë',
    loadComponent: () => import('./modules/components/authentication/change-password-first-time/change-password-first-time.component')
      .then(m => m.ChangePasswordFirstTimeComponent),
    pathMatch: 'full'
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
    path: 'success',
    title: 'Pagesa Sukses',
    loadComponent: () => import('./modules/components/payment/payment-success/payment-success.component')
      .then(m => m.PaymentSuccessComponent),
  },
  {
    path: 'cancel',
    title: 'Pagesa Anuluar',
    loadComponent: () => import('./modules/components/payment/payment-cancel/payment-cancel.component')
      .then(m => m.PaymentCancelComponent),
  },
  {
    path: 'subscription-packages',
    title: 'Zgjidh Paketën e Subscriptionit',
    loadComponent: () => import('./modules/components/subscription/supervisor-subscription-packages/supervisor-subscription-packages.component')
      .then(m => m.SupervisorSubscriptionPackagesComponent),
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];
