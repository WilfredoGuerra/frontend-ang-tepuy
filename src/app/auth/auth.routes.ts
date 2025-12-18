import { Routes } from "@angular/router";
import { AuthLayoutComponent } from "./layout/auth-layout/auth-layout.component";
import { LoginPageComponent } from "./pages/login-page/login-page.component";
import { RegisterPageComponent } from "./pages/register-page/register-page.component";
import { NotAuthenticatedGuard } from "./guards/not-authenticated.guard";
import { EditUserPageComponent } from "./components/edit-user-page/edit-user-page.component";
import { MyUserPageComponent } from "./components/user-details-page.component/my-user-page.component";

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginPageComponent, canMatch: [NotAuthenticatedGuard] },
      { path: 'register', component: RegisterPageComponent },
      { path: 'users/edit/:id', component: EditUserPageComponent },
      { path: 'my-profile', component: MyUserPageComponent },
      { path: '**', redirectTo: 'login' },
    ],
  }
];
export default authRoutes;
