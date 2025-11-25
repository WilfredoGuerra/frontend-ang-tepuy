import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError } from 'rxjs/operators';
import { NetworkElementsService } from '@features/network-elements/services/network-elements.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { NetworkElementTableComponent } from '@features/network-elements/components/network-element-table/network-element-table.component';
import { AuthService } from '@auth/services/auth.service';
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { Router, RouterLink } from '@angular/router';
import { NetworkElement } from '@features/network-elements/interfaces/network-element.interface';
import Swal from 'sweetalert2';
import { SearchInputComponent } from '@tickets/components/search-input/search-input.component';

@Component({
  selector: 'network-elements-page',
  imports: [NetworkElementTableComponent, PaginationComponent, RouterLink, SearchInputComponent],
  templateUrl: './network-elements-page.component.html',
})
export class NetworkElementsPageComponent {
  networkElementsService = inject(NetworkElementsService);
  paginationService = inject(PaginationService);
  authService = inject(AuthService);
  router = inject(Router);

  query = signal('');
  searchError = signal('');

  networkElementsResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage() - 1,
      search: this.query()
    }),
    stream: ({ params }) => {
      this.searchError.set('');

      if (params.search && params.search.trim().length > 0) {
        return this.networkElementsService.searchNetworkElements(params.search.trim(), {
          offset: params.page * 9
        }).pipe(
          catchError((error) => {
            this.searchError.set(error.message);
            return [{
              count: 0,
              pages: 0,
              networksElements: []
            }];
          })
        );
      } else {
        return this.networkElementsService.getNetworkElements({
          offset: params.page * 9
        });
      }
    },
  });

  onSearch(searchTerm: string): void {
    this.query.set(searchTerm);
    this.paginationService.setCurrentPage(1);
  }

  clearSearch(): void {
    this.query.set('');
    this.searchError.set('');
    this.paginationService.setCurrentPage(1);
  }

  // NUEVO: Manejar edición de elemento
  onEditElement(element: NetworkElement): void {
    // Navegar a la página de edición con el ID
    this.router.navigate(['/admin/network-elements/edit', element.id]);
  }

  // NUEVO: Manejar eliminación de elemento
  onDeleteElement(elementId: number): void {
    this.networkElementsService.deleteNetworkElement(elementId).subscribe({
      next: async () => {
        await Swal.fire({
          title: '¡Eliminado!',
          text: 'El elemento de red ha sido eliminado correctamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Aceptar',
          timer: 2000,
          timerProgressBar: true,
        });
        // Recargar los datos
        this.networkElementsResource.reload();
      },
      error: async (error) => {
        console.error('Error al eliminar elemento:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el elemento de red. Por favor, intente nuevamente.',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'Aceptar',
        });
      }
    });
  }

  // NUEVO: Manejar ver detalles
  onViewDetails(element: NetworkElement): void {
    // Aquí puedes implementar un modal de detalles o navegar a una página específica
    Swal.fire({
      title: `Detalles - ${element.acronym}`,
      html: `
        <div class="text-left">
          <p><strong>Descripción:</strong> ${element.description}</p>
          <p><strong>Modelo:</strong> ${element.model}</p>
          <p><strong>Localidad:</strong> ${element.locality}</p>
          <p><strong>IP Gestión:</strong> ${element.management_ip || 'N/A'}</p>
          <p><strong>IP Servicio:</strong> ${element.service_ip || 'N/A'}</p>
          <p><strong>IP ADSL:</strong> ${element.adsl_ip || 'N/A'}</p>
          <p><strong>Central:</strong> ${element.central?.central_name} (${element.central?.central_code})</p>
          <p><strong>Estado:</strong> ${element.isActive ? 'Activo' : 'Inactivo'}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Cerrar'
    });
  }
}
