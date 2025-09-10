import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FrontNavbarComponent } from "../../components/front-navbar/front-navbar.component";
import { FrontUpComponent } from "../../components/front-up/front-up.component";

@Component({
  selector: 'app-front-layout',
  imports: [RouterOutlet, FrontNavbarComponent, FrontUpComponent],
  templateUrl: './app-front-layout.component.html',
})
export class AppFrontLayoutComponent { }
