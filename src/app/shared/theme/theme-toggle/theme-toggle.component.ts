import { Component } from '@angular/core';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.component.html',
})
export class ThemeToggleComponent {
  isDarkMode: boolean = false;

  constructor(private themeService: ThemeService) {
    this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.toggleTheme();
  }
}
