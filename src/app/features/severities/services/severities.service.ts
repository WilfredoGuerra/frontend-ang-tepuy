import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Severity } from '../interfaces/severity.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root',
})
export class SeveritiesService {
  private http = inject(HttpClient);

  getSeverities(): Observable<Severity[]> {
    return this.http.get<Severity[]>(`${baseUrl}/severities`);
  }
}
