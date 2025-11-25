import { Component, inject, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-session-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Notificación de sesión terminada -->
    <div *ngIf="websocketService.sessionTerminated() as termination"
         class="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
      <!-- <div class="alert alert-warning shadow-lg"> -->
        <!-- <div class="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6 mt-0.5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div class="ml-2 flex-1">
            <h3 class="font-bold">Sesión Cerrada</h3>
            <div class="text-xs mt-1">{{ termination.message }}</div>
            <div *ngIf="termination.newLoginTime" class="text-xs mt-2 text-warning">
              <strong>Nuevo inicio:</strong> {{ termination.newLoginTime | date:'medium' }}
            </div>
            <div class="text-xs mt-2 opacity-70">
              Serás redirigido al login automáticamente...
            </div>
          </div>
        </div>
        <div class="flex-none">
          <button class="btn btn-ghost btn-xs" (click)="closeNotification()">
            Cerrar ahora
          </button>
        </div>
      </div> -->
    <!-- </div> -->

    <!-- Indicador de conexión WebSocket (opcional para debug) -->
    <div *ngIf="showConnectionStatus" class="fixed bottom-4 right-4 z-40">
      <div class="badge badge-lg"
           [class.badge-success]="websocketService.isConnected()"
           [class.badge-error]="!websocketService.isConnected()"
           [class.badge-warning]="websocketService.connectionError()">
        WS: {{ websocketService.isConnected() ? 'Conectado' : 'Desconectado' }}
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SessionNotificationComponent implements OnDestroy {
  websocketService = inject(WebsocketService);
  router = inject(Router);

  showConnectionStatus = false; // Cambiar a true para debugging

  private terminationEffect = effect(() => {
    const termination = this.websocketService.sessionTerminated();
    if (termination) {
      console.log('Session termination detected:', termination);
      // Aquí puedes agregar lógica adicional cuando se detecta una terminación
    }
  });

  closeNotification(): void {
    // Usar el método público para limpiar la notificación
    this.websocketService.clearSessionTermination();
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    this.terminationEffect.destroy();
  }
}
