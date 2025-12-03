import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { TicketAdminPageComponent } from './pages/ticket-admin-page/ticket-admin-page.component';
import { TicketsAdminPageComponent } from './pages/tickets-admin-page/tickets-admin-page.component';
import { IsAdminGuard } from '@auth/guards/is-admin.guard';
import { GroupPageComponent } from '@app-front/pages/group-page/group-page.component';
import { NewTicketComponent } from '@tickets/pages/new-ticket/new-ticket.component';
import { UsersPageComponent } from '@auth/pages/users-page/users-page.component';
import { CentralsPageComponent } from '@features/centrals/pages/centrals-page/centrals-page.component';
import { TicketHistoryTableComponent } from './pages/ticket-history-table/ticket-history-table.component';
import { TicketHistoryDetailsComponent } from '@tickets/components/ticket-history-details/ticket-history-details.component';
import { FiberLengthsComponent } from '@features/fiber-lengths/fiber-lengths/fiber-lengths.component';
import { NewElementNetworkComponent } from '@features/network-elements/pages/new-element-network/new-element-network.component';
import { NetworkElementsPageComponent } from '@features/network-elements/pages/network-elements-page/network-elements-page.component';
import { EditElementNetworkComponent } from '@features/network-elements/pages/new-element-network/edit-element-network.component';
import { FrontLayoutComponent } from '@app-front/layouts/front-layout/front-layout.component';
import { TeamsPageComponentTs } from '@features/teams/pages/teams-page.component.ts/teams-page.component.ts';
import { EditUserPageComponent } from '@auth/components/edit-user-page/edit-user-page.component';

export const adminRoutes: Routes = [
  {
    path: '',
    // component: AdminLayoutComponent,
    component: FrontLayoutComponent,
    // canMatch: [IsAdminGuard],
    children: [
      { path: 'tickets', component: TicketsAdminPageComponent },
      { path: 'new-ticket', component: NewTicketComponent },
      { path: 'tickets/by/:id', component: TicketAdminPageComponent },
      { path: 'tickets/:id/history', component: TicketHistoryDetailsComponent },
      { path: 'tickets/history', component: TicketHistoryTableComponent },
      { path: 'group/:group', component: GroupPageComponent },
      { path: 'auth/users', component: UsersPageComponent },
       { path: 'auth/users/edit/:id', component: EditUserPageComponent },
      { path: 'network-elements', component: NetworkElementsPageComponent },
      { path: 'network-elements/new', component: NewElementNetworkComponent },
      { path: 'network-elements/edit/:id', component: EditElementNetworkComponent },
      { path: 'centrals', component: CentralsPageComponent },
      { path: 'fiber-lengths', component: FiberLengthsComponent },
      { path: 'teams', component: TeamsPageComponentTs },
      { path: '**', redirectTo: 'tickets' },
    ],
  },
];

export default adminRoutes;
