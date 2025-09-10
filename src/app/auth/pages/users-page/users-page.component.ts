import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth/services/auth.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { UsersTableComponent } from "@auth/components/users-table/users-table.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'users-page',
  imports: [UsersTableComponent, RouterLink],
  templateUrl: './users-page.component.html',
})
export class UsersPageComponent {
  authService = inject(AuthService);
  paginationService = inject(PaginationService);

  usersResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage() - 1 }),
    stream: ({ params }) => {
      return this.authService.getUsers({
        offset: params.page * 9,
      });
    },
  });
}
