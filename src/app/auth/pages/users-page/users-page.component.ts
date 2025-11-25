import { Component, inject, signal, effect } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth/services/auth.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { UsersTableComponent } from "@auth/components/users-table/users-table.component";
import { RouterLink } from '@angular/router';
import { SearchInputComponent } from "@tickets/components/search-input/search-input.component";
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'users-page',
  imports: [UsersTableComponent, RouterLink, SearchInputComponent, PaginationComponent],
  templateUrl: './users-page.component.html',
})
export class UsersPageComponent {
  authService = inject(AuthService);
  paginationService = inject(PaginationService);
  query = signal('');
  isSearching = signal(false);

  usersResource = rxResource({
    params: () => ({
      query: this.query(),
      page: this.paginationService.currentPage(),
      isSearching: this.isSearching()
    }),
    stream: ({ params }) => {
      const offset = (params.page - 1) * 9;

      if (params.isSearching && params.query.trim() !== '') {
        // Búsqueda con paginación
        return this.authService.getUsersBy(params.query, {
          offset: offset,
          limit: 9
        });
      } else {
        // Lista normal con paginación
        return this.authService.getUsers({
          offset: offset,
          limit: 9
        });
      }
    },
  });

  constructor() {
    // Resetear a página 1 cuando se realiza una búsqueda
    effect(() => {
      const query = this.query();
      if (query && query.trim() !== '') {
        this.isSearching.set(true);
        this.paginationService.currentPage();
      } else {
        this.isSearching.set(false);
      }
    });

    // Debug
    effect(() => {
      const value = this.usersResource.value();
      // console.log('Resultado:', value);
    });

    effect(() => {
      const error = this.usersResource.error();
      if (error) {
        // console.error('Error:', error);
      }
    });
  }

  // Método para manejar cambios en la búsqueda
  onSearchChange(searchTerm: string) {
    this.query.set(searchTerm);
  }
}
