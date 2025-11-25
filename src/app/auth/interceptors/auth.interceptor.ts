

import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) {
  const authService = inject(AuthService);
  const token = authService.token();
  const sessionId = localStorage.getItem('sessionId');

  let headers = req.headers;

  // Solo agregar headers si hay token
  if (token) {
    headers = headers.append('Authorization', `Bearer ${token}`);

    // Agregar sessionId a TODAS las peticiones autenticadas, EXCEPTO login
    if (sessionId && !req.url.includes('/auth/login')) {
      headers = headers.append('x-session-id', sessionId);
    }
  }

  const newReq = req.clone({ headers });
  return next(newReq);
}
