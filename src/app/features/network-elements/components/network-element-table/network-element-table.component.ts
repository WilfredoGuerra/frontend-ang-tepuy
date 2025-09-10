import { Component, input } from '@angular/core';
import { NetworkElement } from '@features/network-elements/interfaces/network-element.interface';

@Component({
  selector: 'network-element-table',
  imports: [],
  templateUrl: './network-element-table.component.html',
})
export class NetworkElementTableComponent {
  network = input.required<NetworkElement[]>();
}
