import { Routes } from "@angular/router";
import { AppFrontLayoutComponent } from "./layouts/app-front-layout/app-front-layout.component";
import { HomePageComponent } from "./pages/home-page/home-page.component";
import { GroupPageComponent } from "./pages/group-page/group-page.component";
import { TicketPageComponent } from "./pages/ticket-page/ticket-page.component";
import { NotFoundPageComponent } from "./pages/not-found-page/not-found-page.component";
import { IsAuthenticatedGuard } from "@auth/guards/is-authenticated.guard";
import { NewTicketComponent } from "@tickets/pages/new-ticket/new-ticket.component";
import { NetworkElementsPageComponent } from "@features/network-elements/pages/network-elements-page/network-elements-page.component";

export const appFrontRoutes: Routes = [
  {
    path: '',
    component: AppFrontLayoutComponent,
    canMatch: [IsAuthenticatedGuard],
    children: [
      { path: '', component: HomePageComponent },
      { path: 'group/:group', component: GroupPageComponent },
      { path: 'tickets/by/:id', component: TicketPageComponent },
      { path: 'new-ticket', component: NewTicketComponent },
      { path: 'network-elements', component: NetworkElementsPageComponent },
      { path: '**', component: NotFoundPageComponent },
    ]
  },
  {
    path: '**',
    redirectTo: '',
  }
];

export default appFrontRoutes;
