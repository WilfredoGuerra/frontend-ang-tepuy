// import { inject } from '@angular/core';
// import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
// import { AuthService } from '@auth/services/auth.service';
// import { firstValueFrom } from 'rxjs';

// export const IsAdminGuard: CanMatchFn = async (
//   route: Route,
//   segments: UrlSegment[]
// ) => {

//   const authService = inject(AuthService);

//   await firstValueFrom(authService.checkStatus());

//   return authService.isAdmin();
// }

import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { firstValueFrom } from 'rxjs';

export const IsAdminGuard: CanMatchFn = async (
  route: Route,
  segments: UrlSegment[]
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar autenticación primero
  const isAuthenticated = await firstValueFrom(authService.checkStatus());

  if (!isAuthenticated) {
    // Si no está autenticado, redirigir a login
    router.navigateByUrl('/auth/login');
    return false;
  }

  // Verificar si es admin
  if (authService.isAdmin()) {
    return true;
  } else {
    // Si no es admin, redirigir a not-found
    router.navigateByUrl('/not-found');
    return false;
  }
};
