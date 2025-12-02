import { Routes } from '@angular/router';
import { NotFoundPageComponent } from '@app-front/pages/not-found-page/not-found-page.component';
import { PrincipalComponent } from '@app-front/principal/principal/principal.component';
import { IsAdminGuard } from '@auth/guards/is-admin.guard';
import { NotAuthenticatedGuard } from '@auth/guards/not-authenticated.guard';

export const routes: Routes = [
  {
    path: '',
    component: PrincipalComponent,
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes'),
    canMatch: [
      // NotAuthenticatedGuard,
    ],
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.routes'),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes'),
    canMatch: [IsAdminGuard],
  },
  {
    path: 'tickets',
    loadChildren: () => import('./app-front/app-front.routes'),
  },
  {
    path: 'not-found',
    component: NotFoundPageComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
