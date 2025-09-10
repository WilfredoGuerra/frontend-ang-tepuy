import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Position } from '../interfaces/position.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root',
})
export class PositionsService {
  private http = inject(HttpClient);

  getPositions(): Observable<Position[]> {
    return this.http.get<Position[]>(`${baseUrl}/positions`);
  }
}
