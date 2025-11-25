import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';
import { ThemeService } from 'src/app/services/theme.service';
import { FooterComponent } from '@app-front/components/footer/footer.component';

@Component({
  selector: 'front-layout',
  imports: [RouterOutlet, Sidebar, FooterComponent],
  templateUrl: './front-layout.component.html',
})
export class FrontLayoutComponent {
  private themeService = inject(ThemeService);

  isSidebarCollapsed = false;

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }
}
