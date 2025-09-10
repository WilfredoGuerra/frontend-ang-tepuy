import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NetworkElementsService } from '@features/network-elements/services/network-elements.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { NetworkElementTableComponent } from '@features/network-elements/components/network-element-table/network-element-table.component';
import { AuthService } from '@auth/services/auth.service';
import { PaginationComponent } from "@shared/components/pagination/pagination.component";

@Component({
  selector: 'network-elements-page',
  imports: [NetworkElementTableComponent, PaginationComponent],
  templateUrl: './network-elements-page.component.html',
})
export class NetworkElementsPageComponent {

  networkElementsService = inject(NetworkElementsService);
  paginationService = inject(PaginationService);
  authService = inject(AuthService);

  query = signal('');

  networkElementsResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage() - 1 }),
    stream: ({ params }) => {
      return this.networkElementsService.getNetworkElements({
        offset: params.page * 9,
      });
    },
  });
}
