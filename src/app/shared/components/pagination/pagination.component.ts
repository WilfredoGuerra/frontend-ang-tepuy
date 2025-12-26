import {
  Component,
  computed,
  input,
  linkedSignal,
  signal,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagination',
  imports: [RouterLink],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  pages = input(0);
  currentPage = input<number>(1);
  pageChange = output<number>();

  activePage = linkedSignal(this.currentPage);

  private emitPageChange(page: number): void {
    this.activePage.set(page);
    this.pageChange.emit(page);
  }

  // Determina si mostrar puntos suspensivos iniciales
  showInitialEllipsis = computed(() => {
    return this.activePage() > 3 && this.pages() > 5;
  });

  // Determina si mostrar puntos suspensivos finales
  showFinalEllipsis = computed(() => {
    return this.activePage() < this.pages() - 2 && this.pages() > 5;
  });

  // Función para obtener las páginas visibles
  getVisiblePages = computed(() => {
    const totalPages = this.pages();
    const currentPage = this.activePage();
    const pages: number[] = [];

    if (totalPages <= 5) {
      // Si hay pocas páginas, mostramos todas excepto primera y última
      for (let i = 2; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar la página actual y las dos siguientes
      const startPage = Math.max(2, currentPage);
      const endPage = Math.min(totalPages - 1, currentPage + 2);

      // Ajustar si estamos cerca del inicio
      if (currentPage <= 2) {
        for (let i = 2; i <= 4; i++) {
          if (i < totalPages) pages.push(i);
        }
      }
      // Ajustar si estamos cerca del final
      else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 3; i < totalPages; i++) {
          if (i > 1) pages.push(i);
        }
      }
      // Mostrar página actual y dos siguientes
      else {
        for (let i = currentPage; i <= currentPage + 2; i++) {
          if (i > 1 && i < totalPages) pages.push(i);
        }
      }
    }

    return pages;
  });
}
