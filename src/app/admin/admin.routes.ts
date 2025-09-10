import { Routes } from "@angular/router";
import { AdminLayoutComponent } from "./layouts/admin-layout/admin-layout.component";
import { TicketAdminPageComponent } from "./pages/ticket-admin-page/ticket-admin-page.component";
import { TicketsAdminPageComponent } from "./pages/tickets-admin-page/tickets-admin-page.component";
import { IsAdminGuard } from "@auth/guards/is-admin.guard";
import { GroupPageComponent } from "@app-front/pages/group-page/group-page.component";
import { NewTicketComponent } from "@tickets/pages/new-ticket/new-ticket.component";
import { UsersPageComponent } from "@auth/pages/users-page/users-page.component";
import { NetworkElementsPageComponent } from "@features/network-elements/pages/network-elements-page/network-elements-page.component";


export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    // canMatch: [IsAdminGuard],
    children: [
      { path: 'tickets', component: TicketsAdminPageComponent },
      { path: 'new-ticket', component: NewTicketComponent },
      { path: 'tickets/by/:id', component: TicketAdminPageComponent },
      { path: 'group/:group', component: GroupPageComponent },
      { path: 'auth/users', component: UsersPageComponent },
      { path: 'network-elements', component: NetworkElementsPageComponent },
      { path: '**', redirectTo: 'tickets' },
    ]
  }
];

export default adminRoutes;
