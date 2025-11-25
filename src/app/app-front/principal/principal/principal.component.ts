import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
// import { ThemeService } from '@shared/theme/theme.service';
import 'animate.css';
import { ThemeToggleComponent } from '@shared/theme/theme-toggle/theme-toggle.component';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'principal',
  standalone: true,
  imports: [RouterModule, RouterLink],
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.css'],
})
export class PrincipalComponent {
  private themeService = inject(ThemeService);

  currentYear = signal<number>(0);
  appVersion = signal<string>('0.1.0');
  // appVersion: string = '0.1.0';

    ngOnInit() {
    this.currentYear.set(new Date().getFullYear())
    // this.currentYear = new Date().getFullYear();
  }

  get currentTheme(): string {
    return this.themeService.getCurrentTheme();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  openExternalLink(): void {
    const url = 'http://161.196.42.67:4200/';
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
