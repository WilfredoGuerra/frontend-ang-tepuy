import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private currentTheme: string = 'light';

  constructor() {
    // Cargar el tema guardado en localStorage al iniciar
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(this.currentTheme);
  }

  setTheme(theme: string) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); // Guardar la preferencia del tema
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }

}
