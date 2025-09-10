import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { IsAuthenticatedGuard } from '@auth/guards/is-authenticated.guard';
import DashboardComponent from './pages/dashboard-page/dashboard-page.component';
import { NotFoundPageComponent } from '@app-front/pages/not-found-page/not-found-page.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    canMatch: [IsAuthenticatedGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: '**', component: NotFoundPageComponent },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

export default dashboardRoutes;
