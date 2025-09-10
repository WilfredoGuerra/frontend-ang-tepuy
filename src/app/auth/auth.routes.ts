import { Routes } from "@angular/router";
import { AuthLayoutComponent } from "./layout/auth-layout/auth-layout.component";
import { LoginPageComponent } from "./pages/login-page/login-page.component";
import { RegisterPageComponent } from "./pages/register-page/register-page.component";
import { NotAuthenticatedGuard } from "./guards/not-authenticated.guard";

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginPageComponent, canMatch: [NotAuthenticatedGuard] },
      { path: 'register', component: RegisterPageComponent },
      { path: '**', redirectTo: 'login' },
    ],
  }
];

export default authRoutes;
