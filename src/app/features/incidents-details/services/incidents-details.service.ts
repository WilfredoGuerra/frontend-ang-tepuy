import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IncidentDetails } from '../interfaces/incident-details.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class IncidentsDetailsService {

  private http = inject(HttpClient);

  getIncidentsDetails(): Observable<IncidentDetails[]> {
    return this.http.get<IncidentDetails[]>(`${baseUrl}/incident-details`);
  }

}
