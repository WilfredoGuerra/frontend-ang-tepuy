import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  currentYear = signal<number>(0);
  appVersion = signal<string>('0.1.0');

  ngOnInit() {
    this.currentYear.set(new Date().getFullYear());
  }
}
