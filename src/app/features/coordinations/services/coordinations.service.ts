import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Coordination } from '../interfaces/coordination.interface';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root',
})
export class CoordinationsService {
  private http = inject(HttpClient);

  getCoordinations(): Observable<Coordination[]> {
    return this.http.get<Coordination[]>(`${baseUrl}/coordinations`);
  }
}
