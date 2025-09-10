import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '@app-front/components/footer/footer.component';
import { FrontUpComponent } from "@app-front/components/front-up/front-up.component";

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, FrontUpComponent, FooterComponent],
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent { }
