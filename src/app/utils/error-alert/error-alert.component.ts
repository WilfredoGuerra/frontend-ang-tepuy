import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  imports: [],
  templateUrl: './error-alert.component.html',
})
export class ErrorAlertComponent {
  @Input() message: string = '';
  @Input() show: boolean = false;

  closeAlert() {
    this.show = false;
  }
}
