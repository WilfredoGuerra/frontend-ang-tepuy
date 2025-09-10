import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CentralsTableComponent } from "@features/centrals/components/centrals-table/centrals-table.component";
import { CentralsService } from '@features/centrals/services/centrals.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';

@Component({
  selector: 'centrals-page',
  imports: [CentralsTableComponent],
  templateUrl: './centrals-page.component.html',
})
export class CentralsPageComponent {
  centralsService = inject(CentralsService);
  paginationService = inject(PaginationService);
  query = signal('');

  centralsResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage() - 1 }),
    stream: ({ params }) => {
      return this.centralsService.getCentrals({
        offset: params.page * 9
      });
    },
  });
}
