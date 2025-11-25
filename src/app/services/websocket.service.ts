import { Injectable, inject, signal, OnDestroy, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

export interface SessionTerminationMessage {
  message: string;
  terminatedAt?: string;
  newLoginTime?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
  private socket: Socket | null = null;
  private router = inject(Router);
  private heartbeatInterval: any = null;

  // Writable signals (privados)
  private _isConnected = signal<boolean>(false);
  private _sessionTerminated = signal<SessionTerminationMessage | null>(null);
  private _connectionError = signal<string | null>(null);

  private tokenExpiryCheckInterval: any;
  private readonly TOKEN_CHECK_INTERVAL = 60000;

  // Computed signals para lectura externa
  isConnected = computed(() => this._isConnected());
  sessionTerminated = computed(() => this._sessionTerminated());
  connectionError = computed(() => this._connectionError());

  // Métodos para modificar los signals desde fuera
  clearSessionTermination() {
    this._sessionTerminated.set(null);
  }

  private authCheckInterval: any;

  constructor() {
    this.setupAuthListener();
    this.startTokenExpiryCheck();
  }

  private startTokenExpiryCheck(): void {
    this.tokenExpiryCheckInterval = setInterval(() => {
      this.checkTokenExpiry();
    }, this.TOKEN_CHECK_INTERVAL);
  }

  private checkTokenExpiry(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = this.decodeToken(token);
      if (this.isTokenExpired(payload)) {
        console.log('Token expired detected automatically');
        this.handleAutomaticTokenExpiration();
      }
    } catch (error) {
      console.warn('Error checking token expiry:', error);
    }
  }

  private decodeToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  private isTokenExpired(payload: any): boolean {
    if (!payload.exp) return true;

    const expirationTime = payload.exp * 1000; // Convertir a milisegundos
    const currentTime = Date.now();
    const bufferTime = 60000; // 1 minuto de buffer

    return currentTime >= expirationTime - bufferTime;
  }

  private handleAutomaticTokenExpiration(): void {
    this.showAutomaticExpirationMessage();
  }

  private setupAuthListener(): void {
    // Verificar autenticación cada segundo sin depender de AuthService
    this.authCheckInterval = setInterval(() => {
      this.checkAndInitializeConnection();
    }, 1000);
  }

  private checkAndInitializeConnection(): void {
    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('sessionId');
    const wasConnected = this._isConnected();

    if (token && sessionId && !wasConnected) {
      // Tenemos credenciales pero no estamos conectados
      this.initializeSocketConnection(token, sessionId);
    } else if ((!token || !sessionId) && wasConnected) {
      // Perdimos las credenciales pero estábamos conectados
      this.disconnect();
    }
  }

  private initializeSocketConnection(token: string, sessionId: string): void {
    // Limpiar conexión anterior si existe
    this.disconnect();

    try {
      this.socket = io(`${environment.wsUrl || environment.baseUrl}/sessions`, {
        auth: {
          token: token,
          sessionId: sessionId,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.setupSocketEvents();
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      this._connectionError.set('Failed to connect to server');
    }
  }

  private setupSocketEvents(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      this._isConnected.set(true);
      this._connectionError.set(null);
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this._isConnected.set(false);
      this.stopHeartbeat();

      // Reconectar solo si no fue una desconexión deliberada
      if (reason !== 'io client disconnect') {
        setTimeout(() => {
          const token = localStorage.getItem('token');
          const sessionId = localStorage.getItem('sessionId');
          if (token && sessionId) {
            this.reconnect();
          }
        }, 5000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this._isConnected.set(false);
      this._connectionError.set('Connection failed: ' + error.message);
      this.stopHeartbeat();
    });

    this.socket.on('session_terminated', (data: SessionTerminationMessage) => {
      console.log('Session terminated notification received:', data);
      this._sessionTerminated.set(data);
      this.stopHeartbeat();

      // Mostrar mensaje inmediatamente sin delay
      this.showSessionTerminationMessage(data);
    });

    this.socket.on('session_invalid', (data: { message: string }) => {
      console.log('Session invalid notification received:', data);
    this.showSessionTerminationMessage({
      message: data.message || 'Your session is no longer valid'
    });
      this.stopHeartbeat();

      // setTimeout(() => {
      //   this.handleSessionTermination();
      // }, 1000);
    });

    this.socket.on('session_connected', (data: any) => {
      console.log('Session connected successfully:', data);
    });

    this.socket.on('heartbeat_ack', (data: any) => {
      console.log('Heartbeat acknowledged:', data);
    });

    this.socket.on('token_expired', (data: { message: string }) => {
      console.log('Token expired notification received:', data);
      this.handleAutomaticTokenExpiration(); // Usar el mismo método que la detección automática
    });

    this.socket.on('auth_error', (data: { message: string }) => {
      console.log('Authentication error:', data);
      this.handleTokenExpiration(data.message || 'Error de autenticación');
    });

    this.socket.on(
      'token_expired_auto',
      (data: { message: string; autoRedirect: boolean }) => {
        console.log('Automatic token expiration received from server');
        this.handleAutomaticTokenExpiration();
      }
    );
  }

  private handleTokenExpiration(
    message: string = 'Su sesión ha expirado por inactividad'
  ): void {
    // Mostrar mensaje al usuario antes de hacer logout
    this.showExpirationMessage(message);

    // Esperar un poco para que el usuario vea el mensaje
    setTimeout(() => {
      this.handleSessionTermination();
    }, 3000);
  }

  private showExpirationMessage(message: string): void {
    // Puedes usar SweetAlert2 como en tu componente de login
    Swal.fire({
      icon: 'warning',
      title: 'Sesión Expirada',
      text: message,
      confirmButtonText: 'Aceptar',
      timer: 3000,
      timerProgressBar: true,
      allowOutsideClick: false,
    });
  }

  private async handleSessionTermination(): Promise<void> {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;

    // Mostrar mensaje con tiempo suficiente
    this.showSessionTerminationMessage();
  }

private showSessionTerminationMessage(data?: SessionTerminationMessage): void {
  const defaultMessage = 'Su sesión ha sido cerrada porque inició sesión desde otra ubicación';
  const message = data?.message || defaultMessage;
  const newLoginTime = data?.newLoginTime ?
    `\n\nNuevo inicio de sesión: ${new Date(data.newLoginTime).toLocaleString()}` : '';

  Swal.fire({
    icon: 'info',
    title: 'Sesión Cerrada',
    html: `
      <div class="text-center">
        <p>${message}${newLoginTime}</p>
        <div class="mt-4 text-xs text-gray-500">
          Será redirigido al login en <span id="termination-countdown">8</span> segundos
        </div>
      </div>
    `,
    confirmButtonText: 'Ir al Login',
    timer: 8000,
    timerProgressBar: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: 'session-termination-popup'
    },
    didOpen: () => {
      // Contador regresivo
      let secondsLeft = 8;
      const countdownElement = document.getElementById('termination-countdown');
      const countdownInterval = setInterval(() => {
        secondsLeft--;
        if (countdownElement) {
          countdownElement.textContent = secondsLeft.toString();
        }
        if (secondsLeft <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

      const confirmButton = Swal.getConfirmButton();
      if (confirmButton) {
        confirmButton.addEventListener('click', () => {
          clearInterval(countdownInterval);
          this.executeSessionTermination();
        });
      }
    },
    willClose: () => {
      this.executeSessionTermination();
    }
  });
}

  private executeSessionTermination(): void {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;

    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('sessionId');

    // Desconectar WebSocket
    this.disconnect();

    // Redirigir al login
    this.router.navigate(['/auth/login']);

    // Recargar la página
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  // private showReLoginMessage(): void {
  //   Swal.fire({
  //     icon: 'info',
  //     title: 'Sesión Cerrada',
  //     text: 'Será redirigido al login para renovar su sesión',
  //     confirmButtonText: 'Entendido',
  //     timer: 2000,
  //     timerProgressBar: true,
  //     allowOutsideClick: false,
  //   });
  // }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      const sessionId = localStorage.getItem('sessionId');
      if (this.socket?.connected && sessionId) {
        this.socket.emit('heartbeat', { sessionId });
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect(): void {
    this.stopHeartbeat();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this._isConnected.set(false);
    this._sessionTerminated.set(null);
    this._connectionError.set(null);
  }

  reconnect(): void {
    console.log('Attempting to reconnect WebSocket...');
    this.disconnect();

    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('sessionId');

    if (token && sessionId) {
      setTimeout(() => this.initializeSocketConnection(token, sessionId), 1000);
    }
  }

private showAutomaticExpirationMessage(): void {
  Swal.fire({
    icon: 'warning',
    title: 'Sesión Expirada',
    html: `
      <div class="text-center">
        <p>Su sesión ha expirado por inactividad</p>
        <p class="text-sm text-gray-600 mt-2">Será redirigido a la página de login automáticamente</p>
      </div>
    `,
    confirmButtonText: 'Aceptar',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCloseButton: false,
    timer: 8000, // 8 segundos - tiempo fijo
    timerProgressBar: true,
    customClass: {
      popup: 'automatic-expiration-popup'
    },
    didOpen: () => {
      const confirmButton = Swal.getConfirmButton();
      if (confirmButton) {
        confirmButton.addEventListener('click', () => {
          this.executeAutomaticLogout();
        });
      }
    },
    willClose: () => {
      this.executeAutomaticLogout();
    }
  });
}

  private isLoggingOut = false;

  private executeAutomaticLogout(): void {
    // Solo ejecutar si no estamos ya en proceso de logout
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;

    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('sessionId');

    // Desconectar WebSocket
    this.disconnect();

    // Redirigir al login
    this.router.navigate(['/auth/login']);

    // Recargar para limpiar estado después de un breve delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  private stopTokenExpiryCheck(): void {
    if (this.tokenExpiryCheckInterval) {
      clearInterval(this.tokenExpiryCheckInterval);
      this.tokenExpiryCheckInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }
    this.stopTokenExpiryCheck();
  }
}
