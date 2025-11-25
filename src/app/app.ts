import { Component, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionNotificationComponent } from "@shared/components/session-notification/session-notification.component";
import { AuthService } from '@auth/services/auth.service';
import { InactivityService } from './services/inactivity.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SessionNotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = 'tepuy';

  private authService = inject(AuthService);
  private inactivityService = inject(InactivityService);

  private authStatusEffect = effect(() => {
    const status = this.authService.authStatus();
    const user = this.authService.user();

    console.log('🔐 Auth status changed:', status);

    if (status === 'authenticated' && user) {
      setTimeout(() => {
        console.log('🚀 Starting inactivity monitoring for user:', user.fullName);
        this.inactivityService.restartMonitoring();
      }, 500);
    } else if (status === 'not-authenticated') {
      console.log('🛑 Stopping inactivity monitoring - user logged out');
      this.inactivityService.stopMonitoring();
    }
  });

  ngOnInit(): void {
    const currentStatus = this.authService.authStatus();
    if (currentStatus === 'authenticated') {
      setTimeout(() => {
        this.inactivityService.restartMonitoring();
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    this.inactivityService.stopMonitoring();
  }
}
