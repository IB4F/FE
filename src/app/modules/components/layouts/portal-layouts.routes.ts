import {Routes} from '@angular/router';
import {PortalLayoutComponent} from "./portal-layout.component";
import {roleGuard} from "../../../guards/role.guard";
import {userResolver} from "../../../helpers/resolvers/user.resolver";
import {mustChangePasswordGuard} from "../../../guards/must-change-password.guard";

export const PortalLayoutsRoutes: Routes = [
  {
    path: '',
    component: PortalLayoutComponent,
    resolve: {user: userResolver},
    canActivate: [mustChangePasswordGuard],
    children: [
      {
        path: '',
        title: 'Landing Page',
        pathMatch: 'full',
        loadComponent: () => import('../landing-page/landing-page.component')
          .then(m => m.LandingPageComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('../settings/settings.component')
          .then(m => m.SettingsComponent)
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
          {
            path: 'dashboard',
            title: 'Dashboard Supervisor',
            canActivate: [roleGuard('Supervisor', 'Admin')],
            loadComponent: () => import('../supervisor/dashboard/supervisor-dashboard.component')
              .then(m => m.SupervisorDashboardComponent),
          },
          {
            path: 'students',
            title: 'Menaxhimi i Studentëve',
            canActivate: [roleGuard('Supervisor', 'Admin')],
            loadComponent: () => import('../supervisor/students/students-management.component')
              .then(m => m.StudentsManagementComponent),
          },
          {
            path: 'password-reset',
            title: 'Reset Password',
            canActivate: [roleGuard('Supervisor', 'Admin')],
            loadComponent: () => import('../supervisor/password-reset/password-reset-management.component')
              .then(m => m.PasswordResetManagementComponent),
          },
          {
            path: 'students/:studentId/progress',
            title: 'Detajet e Progresit të Studentit',
            canActivate: [roleGuard('Supervisor', 'Admin')],
            loadComponent: () => import('../supervisor/student-progress/student-progress-details.component')
              .then(m => m.StudentProgressDetailsComponent),
          },
        ]
      },
      {
        path: 'admin',
        children: [
          {
            path: 'panel',
            title: 'Panel',
            canActivate: [roleGuard('Admin')],
            loadComponent: () => import('../admin/panel/panel.component')
              .then(m => m.PanelComponent)
          },
          {
            path: 'users',
            canActivate: [roleGuard('Admin')],
            children: [
              {
                path: '',
                title: 'Users',
                loadComponent: () => import('../admin/users/users.component')
                  .then(m => m.UsersComponent)
              },
              {
                path: 'manageUser/:id',
                title: 'Modifiko Userin',
                loadComponent: () => import('../admin/users/manage-user/manage-user.component')
                  .then(m => m.ManageUserComponent)
              }
            ]
          },
          {
            path: 'learnhub',
            canActivate: [roleGuard('Admin')],
            children: [
              {
                path: '',
                title: 'Learnhub',
                loadComponent: () => import('../admin/learnhub/learnhub.component')
                  .then(m => m.LearnhubComponent)
              },
              {
                path: 'manage',
                title: 'Shto Learnhub',
                loadComponent: () => import('../admin/learnhub/manage-learnhub/manage-learnhub.component')
                  .then(m => m.ManageLearnhubComponent)
              },
              {
                path: 'manage/:id',
                title: 'Modifiko Learnhub',
                loadComponent: () => import('../admin/learnhub/manage-learnhub/manage-learnhub.component')
                  .then(m => m.ManageLearnhubComponent)
              },
              {
                path: 'manage/quiz/:id',
                title: 'Menaxho Quizet',
                loadComponent: () => import('../admin/learnhub/manage-learnhub/manage-quiz/manage-quiz.component')
                  .then(m => m.ManageQuizComponent)
              },
              {
                path: 'manage/quiz/:linkId/add-quiz',
                title: 'Shto Quiz',
                loadComponent: () => import('../admin/learnhub/manage-learnhub/manage-quiz/quizzes/quizzes.component')
                  .then(m => m.QuizzesComponent)
              },
              {
                path: 'manage/quiz/:linkId/edit-quiz/:quizId',
                title: 'Modifiko Quiz',
                loadComponent: () => import('../admin/learnhub/manage-learnhub/manage-quiz/quizzes/quizzes.component')
                  .then(m => m.QuizzesComponent)
              }
            ]
          }
        ],
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
            title: 'dashboard',
            canActivate: [roleGuard('Student', 'Admin', 'Family')],
            loadComponent: () => import('../student/dashboard/dashboard.component')
              .then(m => m.DashboardComponent)
          },
          {
            path: 'kurset',
            // canActivate: [roleGuard('Student', 'Admin', 'Family')],
            loadComponent: () => import('../student/courses/courses.component')
              .then(m => m.CoursesComponent)
          },
          {
            path: 'quiz-list/:id',
            canActivate: [roleGuard('Student', 'Admin', 'Family')],
            loadComponent: () => import('../student/quiz-list/quiz-list.component')
              .then(m => m.QuizListComponent)
          },

        ]
      },
      {
        path: 'family',
        children: [
          {
            path: 'membership',
            loadComponent: () => import('../authentication/register-family/register-family.component')
              .then(m => m.RegisterFamilyComponent)
          }
        ]
      }
    ]
  }
];
