import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  showSessionExpired(message: string = 'Su sesión ha expirado por inactividad'): void {
    Swal.fire({
      icon: 'warning',
      title: 'Sesión Expirada',
      text: message,
      confirmButtonText: 'Aceptar',
      timer: 5000,
      timerProgressBar: true,
      allowOutsideClick: false,
      customClass: {
        popup: 'session-expired-popup'
      }
    });
  }

  showReLoginMessage(): void {
    Swal.fire({
      icon: 'info',
      title: 'Sesión Cerrada',
      text: 'Será redirigido al login para renovar su sesión',
      confirmButtonText: 'Entendido',
      timer: 3000,
      timerProgressBar: true
    });
  }
}
