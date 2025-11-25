import { Component, inject, input, output } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';
import { Central } from '@features/centrals/interfaces/central.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'centrals-table',
  imports: [],
  templateUrl: './centrals-table.component.html',
})
export class CentralsTableComponent {
  // Inputs
  central = input.required<Central[]>();
  isSelectorMode = input(false);

  // Outputs
  editCentral = output<Central>();
  deleteCentral = output<number>();
  selectCentral = output<Central>();

  // Services
  authService = inject(AuthService);

  // ==================== MÉTODOS DE ACCIONES ====================

  onEdit(central: Central): void {
    this.editCentral.emit(central);
  }

  async onDelete(central: Central): Promise<void> {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `Está a punto de eliminar la central "${central.central_name}" (${central.central_code}). Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      this.deleteCentral.emit(central.id);
    }
  }

  onSelect(central: Central): void {
    this.selectCentral.emit(central);
  }

  // ==================== MÉTODOS AUXILIARES ====================

  get isSuperUser(): boolean {
    return this.authService.user()?.roles?.includes('super_user') ?? false;
  }

  shouldShowActions(): boolean {
    return this.isSuperUser && !this.isSelectorMode();
  }

  getColumnCount(): number {
    const baseColumns = 6; // Código, Nombre, Estado, Coordenadas, Estado Activo, Observaciones
    return baseColumns + (this.shouldShowActions() || this.isSelectorMode() ? 1 : 0);
  }
}
