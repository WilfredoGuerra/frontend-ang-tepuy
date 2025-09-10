import { Component, input } from '@angular/core';
import { Central } from '@features/centrals/interfaces/central.interface';

@Component({
  selector: 'centrals-table',
  imports: [],
  templateUrl: './centrals-table.component.html',
})
export class CentralsTableComponent {
  central = input.required<Central[]>();
}
