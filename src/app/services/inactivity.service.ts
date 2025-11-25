import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class InactivityService implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  private readonly INACTIVITY_TIMEOUT = environment.inactivity.timeout;
  private readonly WARNING_TIMEOUT = environment.inactivity.warningTime;

  private inactivityTimer: any;
  private warningTimer: any;
  private isWarningActive = false;
  private isLoggingOut = false;

  // ✅ OPTIMIZADO: Menos eventos y con throttling
  private activityEvents = ['mousedown', 'keypress', 'touchstart', 'click'];

  private onUserActivityBound = () => this.onUserActivity();
  private lastActivityTime = 0;
  private readonly THROTTLE_TIME = 1000; // 1 segundo entre ejecuciones

  constructor() {
    // ✅ Detección correcta de ambiente
    if (!environment.production) {
      console.log('🕒 Inactivity Service - Tiempos configurados:', {
        timeout: this.INACTIVITY_TIMEOUT / 1000 + ' segundos',
        warning: this.WARNING_TIMEOUT / 1000 + ' segundos',
      });
    }
    this.startInactivityMonitoring();
  }

  private startInactivityMonitoring(): void {
    this.resetInactivityTimer();
    this.setupActivityListeners();
  }

  private setupActivityListeners(): void {
    this.activityEvents.forEach((event) => {
      document.addEventListener(event, this.onUserActivityBound, {
        passive: true,
      });
    });
  }

  private removeActivityListeners(): void {
    this.activityEvents.forEach((event) => {
      document.removeEventListener(event, this.onUserActivityBound);
    });
  }

  private reactivateActivityListeners(): void {
    this.removeActivityListeners();
    this.setupActivityListeners();
  }

  /**
   * ✅ OPTIMIZADO: Con throttling para evitar ejecuciones excesivas
   */
  private onUserActivity(): void {
    if (this.authService.authStatus() !== 'authenticated') return;

    // Throttling: Solo ejecutar si pasó más de 1 segundo desde la última vez
    const now = Date.now();
    if (now - this.lastActivityTime < this.THROTTLE_TIME) {
      return;
    }
    this.lastActivityTime = now;

    if (this.isWarningActive) {
      return; // ✅ Sin console.log
    }

    this.resetInactivityTimer(); // ✅ Sin console.log
  }

  private resetInactivityTimer(): void {
    // Limpiar timers existentes
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    const warningTime = Math.max(
      0,
      this.INACTIVITY_TIMEOUT - this.WARNING_TIMEOUT
    );

    // ✅ SOLO en desarrollo
    if (!environment.production) {
      console.log('🔄 Reset inactivity timer');
    }

    this.warningTimer = setTimeout(() => {
      this.showInactivityWarning();
    }, warningTime);

    this.inactivityTimer = setTimeout(() => {
      this.logoutDueToInactivity();
    }, this.INACTIVITY_TIMEOUT);
  }

  private showInactivityWarning(): void {
    if (this.isWarningActive || this.isLoggingOut) return;

    this.isWarningActive = true;

    // ✅ SOLO en desarrollo
    if (!environment.production) {
      console.log('⚠️ Mostrando advertencia de inactividad');
    }

    const warningSeconds = this.WARNING_TIMEOUT / 1000;
    this.removeActivityListeners();

    let userClickedContinue = false;

    Swal.fire({
      icon: 'warning',
      title: 'Sesión por expirar',
      html: `
        <div class="text-center">
          <p>Su sesión se cerrará por inactividad en <strong>${warningSeconds} segundos</strong>.</p>
          <p class="text-sm text-gray-600 mt-2">Haga click en "Continuar" para mantener su sesión activa.</p>
          <div class="mt-4 text-xs text-gray-500">
            Tiempo restante: <span id="warning-countdown">${warningSeconds}</span> segundos
          </div>
        </div>
      `,
      confirmButtonText: 'Continuar',
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      timer: this.WARNING_TIMEOUT,
      timerProgressBar: true,
      customClass: {
        popup: 'inactivity-warning-popup',
      },
      didOpen: () => {
        let secondsLeft = warningSeconds;
        const countdownElement = document.getElementById('warning-countdown');
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
            userClickedContinue = true;
          });
        }
      },
    }).then((result) => {
      this.isWarningActive = false;
      this.reactivateActivityListeners();

      if (userClickedContinue || result.isConfirmed) {
        this.handleContinueSession();
      } else if (result.dismiss === Swal.DismissReason.timer) {
        this.logoutDueToInactivity();
      } else {
        this.resetInactivityTimer();
      }
    });
  }

  private handleContinueSession(): void {
    this.isWarningActive = false;
    this.reactivateActivityListeners();
    this.resetInactivityTimer();
  }

  private async logoutDueToInactivity(): Promise<void> {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;

    if (this.isWarningActive) {
      this.isWarningActive = false;
      Swal.close();
    }

    this.reactivateActivityListeners();
    await this.showInactivityLogoutMessage();
    this.executeLogout();
  }

  private async showInactivityLogoutMessage(): Promise<void> {
    return new Promise((resolve) => {
      Swal.fire({
        icon: 'info',
        title: 'Sesión Cerrada',
        html: `
          <div class="text-center">
            <p>Su sesión ha sido cerrada por inactividad.</p>
            <div class="mt-4 text-xs text-gray-500">
              Será redirigido al login en <span id="logout-countdown">5</span> segundos
            </div>
          </div>
        `,
        confirmButtonText: 'Ir al Login',
        showCancelButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: 5000,
        timerProgressBar: true,
        customClass: {
          popup: 'inactivity-logout-popup',
        },
        didOpen: () => {
          let secondsLeft = 5;
          const countdownElement = document.getElementById('logout-countdown');
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
              resolve();
            });
          }
        },
        willClose: () => {
          resolve();
        },
      });
    });
  }

  private executeLogout(): void {
    this.clearAllTimers();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  private clearAllTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    this.isWarningActive = false;
    this.isLoggingOut = false;
  }

  public restartMonitoring(): void {
    this.clearAllTimers();
    this.resetInactivityTimer();
  }

  public stopMonitoring(): void {
    this.clearAllTimers();
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
    this.removeActivityListeners();
  }
}
