import { Component, inject } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { ThemeService } from '@shared/theme/theme.service';
import 'animate.css';
import { ThemeToggleComponent } from "@shared/theme/theme-toggle/theme-toggle.component";

@Component({
  selector: 'principal',
  standalone: true,
  imports: [RouterModule, RouterLink, ThemeToggleComponent],
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.css']
})
export class PrincipalComponent {

  private themeService = inject(ThemeService);

    get currentTheme(): string {
    return this.themeService.getCurrentTheme();
  }
}
