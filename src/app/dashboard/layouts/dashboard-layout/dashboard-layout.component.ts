import { Component } from '@angular/core';
import { FrontUpComponent } from "@app-front/components/front-up/front-up.component";
import DashboardComponent from '../../pages/dashboard-page/dashboard-page.component';
import { FooterComponent } from "@app-front/components/footer/footer.component";

@Component({
  selector: 'dashboard-layout',
  imports: [FrontUpComponent, DashboardComponent, FooterComponent],
  templateUrl: './dashboard-layout.component.html',
})
export class DashboardLayoutComponent { }
