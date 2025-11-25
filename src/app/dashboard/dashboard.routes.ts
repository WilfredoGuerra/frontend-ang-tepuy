import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { IsAuthenticatedGuard } from '@auth/guards/is-authenticated.guard';
import DashboardComponent from './pages/dashboard-page/dashboard-page.component';
import { NotFoundPageComponent } from '@app-front/pages/not-found-page/not-found-page.component';
import { FrontLayoutComponent } from '@app-front/layouts/front-layout/front-layout.component';
import { ReportsPageComponent } from '../reports/components/reports-page.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: FrontLayoutComponent,
    canMatch: [IsAuthenticatedGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'reports', component: ReportsPageComponent },
      { path: '**', component: NotFoundPageComponent },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

export default dashboardRoutes;
