import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaginationService {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  currentPage = toSignal(
    this.activatedRoute.queryParamMap.pipe(
      map((params) => (params.get('page') ? +params.get('page')! : 1)),
      map((page) => (isNaN(page) ? 1 : page))
    ),
    {
      initialValue: 1,
    }
  );

  setCurrentPage(page: number): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { page: page > 1 ? page : undefined },
      queryParamsHandling: 'merge',
    });
  }
}
