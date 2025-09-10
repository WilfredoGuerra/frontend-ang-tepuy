import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Status } from '../interfaces/status.interface';
import { HttpClient } from '@angular/common/http';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class StatusesService {
  private http = inject(HttpClient);

  getStatuses(): Observable<Status[]> {
    return this.http.get<Status[]>(`${baseUrl}/statuses`);
  }
}
