import { Component, input, output, signal, computed } from '@angular/core';

@Component({
  selector: 'app-progress-pagination',
  template: `
    <div class="join flex justify-center items-center flex-wrap gap-1 my-6">
      <!-- Flecha Anterior -->
      <button
        class="join-item btn btn-sm md:btn-md"
        [class.btn-disabled]="currentPage() === 1"
        (click)="changePage(currentPage() - 1)"
        aria-label="Página anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Primera página -->
      @if (pages() > 0) {
        <button
          class="join-item btn btn-sm md:btn-md"
          [class.btn-primary]="1 === currentPage()"
          (click)="changePage(1)"
        >1</button>
      }

      <!-- Puntos suspensivos iniciales si es necesario -->
      @if (showInitialEllipsis()) {
        <button class="join-item btn btn-sm md:btn-md btn-disabled">...</button>
      }

      <!-- Páginas intermedias (solo números) -->
      @for (page of visiblePages(); track page) {
        <button
          class="join-item btn btn-sm md:btn-md"
          [class.btn-primary]="page === currentPage()"
          (click)="changePage(page)"
        >{{ page }}</button>
      }

      <!-- Puntos suspensivos finales si es necesario -->
      @if (showFinalEllipsis()) {
        <button class="join-item btn btn-sm md:btn-md btn-disabled">...</button>
      }

      <!-- Última página (si hay más de 1 página) -->
      @if (pages() > 1) {
        <button
          class="join-item btn btn-sm md:btn-md"
          [class.btn-primary]="pages() === currentPage()"
          (click)="changePage(pages())"
        >{{ pages() }}</button>
      }

      <!-- Flecha Siguiente -->
      <button
        class="join-item btn btn-sm md:btn-md"
        [class.btn-disabled]="currentPage() === pages()"
        (click)="changePage(currentPage() + 1)"
        aria-label="Página siguiente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  `,
  styles: []
})
export class ProgressPaginationComponent {
  pages = input(0);
  currentPage = input<number>(1);
  pageChange = output<number>();

  // Determina si mostrar puntos suspensivos iniciales
  showInitialEllipsis = computed(() => {
    return this.currentPage() > 3 && this.pages() > 5;
  });

  // Determina si mostrar puntos suspensivos finales
  showFinalEllipsis = computed(() => {
    return this.currentPage() < this.pages() - 2 && this.pages() > 5;
  });

  // Páginas visibles (solo números, sin '...')
  visiblePages = computed(() => {
    const totalPages = this.pages();
    const currentPage = this.currentPage();
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

  changePage(page: number): void {
    if (page >= 1 && page <= this.pages()) {
      this.pageChange.emit(page);
    }
  }
}
