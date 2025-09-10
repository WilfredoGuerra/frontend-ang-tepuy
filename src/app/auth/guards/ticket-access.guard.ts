import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';

export const ticketAccessGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService); // Inyectamos el AuthService
  const router = inject(Router); // Inyectamos el Router

  const user = authService.user(); // Obtenemos el usuario actual
  const id = route.paramMap.get('id'); // Obtenemos el parámetro `id` de la URL

  // Permitir acceso si:
  // 1. El usuario es admin, O
  // 2. El usuario es "user" y el ID es "0"
  if (user?.roles.includes('super_user') || (user?.roles.includes('room_user') && id === '0')) {
    return true; // Acceso permitido
  }

  // Redirigir si no cumple las condiciones
  return router.createUrlTree(['/unauthorized']); // O usar `router.navigate()`
};
