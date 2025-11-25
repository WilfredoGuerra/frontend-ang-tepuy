import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { NetworkElement } from '@features/network-elements/interfaces/network-element.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'network-element-table',
  imports: [],
  templateUrl: './network-element-table.component.html',
})
export class NetworkElementTableComponent {
  network = input.required<NetworkElement[]>();

  // Outputs para acciones
  editElement = output<NetworkElement>();
  deleteElement = output<number>();
  viewDetails = output<NetworkElement>();

  // Services
  authService = inject(AuthService);

  onEdit(element: NetworkElement): void {
    this.editElement.emit(element);
  }

  async onDelete(element: NetworkElement): Promise<void> {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `Está a punto de eliminar el elemento "${element.acronym}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      this.deleteElement.emit(element.id);
    }
  }

  onViewDetails(element: NetworkElement): void {
    this.viewDetails.emit(element);
  }

  get isSuperUser(): boolean {
    return this.authService.user()?.roles?.includes('super_user') ?? false;
  }
}
