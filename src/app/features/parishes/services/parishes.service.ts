import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Parish } from '../interfaces/parish.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root',
})
export class ParishesService {
  private http = inject(HttpClient);

  getParishes(): Observable<Parish[]> {
    return this.http.get<Parish[]>(`${baseUrl}/parish`);
  }
}
