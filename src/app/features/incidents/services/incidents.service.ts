import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Incident } from '../interfaces/incidents.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class IncidentsService {

  private http = inject(HttpClient);

  getIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${baseUrl}/incidents`);
  }

}
