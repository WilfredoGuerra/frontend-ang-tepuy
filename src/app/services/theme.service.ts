// src/app/services/theme.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = 'nord';
  private readonly themeKey = 'app-theme';

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem(this.themeKey);

      if (savedTheme && (savedTheme === 'nord' || savedTheme === 'night')) {
        this.applyTheme(savedTheme);
      } else {
        // Verificar preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.applyTheme(prefersDark ? 'night' : 'nord');
      }
    }
  }

  private applyTheme(theme: string): void {
    this.currentTheme = theme;

    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(this.themeKey, theme);
    }
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme === 'nord' ? 'night' : 'nord';
    this.applyTheme(newTheme);
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }

  isDarkMode(): boolean {
    return this.currentTheme === 'night';
  }

  setTheme(theme: 'nord' | 'night'): void {
    this.applyTheme(theme);
  }
}
