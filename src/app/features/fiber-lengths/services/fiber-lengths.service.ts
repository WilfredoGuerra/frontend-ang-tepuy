// fiber-lengths.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FiberLength, FiberLengthsResponse } from '../interfaces/fiber-length.interface';

const baseUrl = environment.baseUrl;

interface CreateFiberLengthData {
  locality_a: string;
  locality_b: string;
  section_name: string;
  stateAId: number;
  stateBId: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FiberLengthsService {
  private http = inject(HttpClient);

  getFiberLengths(options: { limit?: number; offset?: number }): Observable<FiberLengthsResponse> {
    const { limit = 9, offset = 0 } = options;
    return this.http.get<FiberLengthsResponse>(`${baseUrl}/fiber-lengths`, {
      params: { limit, offset }
    });
  }

  searchFiberLengths(term: string): Observable<FiberLength[]> {
    return this.http.get<FiberLength[]>(`${baseUrl}/fiber-lengths/${term}`);
  }

  createFiberLength(data: CreateFiberLengthData): Observable<FiberLength> {
    return this.http.post<FiberLength>(`${baseUrl}/fiber-lengths`, data);
  }

  updateFiberLength(id: number, data: Partial<CreateFiberLengthData>): Observable<FiberLength> {
    return this.http.patch<FiberLength>(`${baseUrl}/fiber-lengths/${id}`, data);
  }

  deleteFiberLength(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${baseUrl}/fiber-lengths/${id}`);
  }

  getFiberLengthById(id: number): Observable<FiberLength> {
    return this.http.get<FiberLength>(`${baseUrl}/fiber-lengths/${id}`);
  }
}
