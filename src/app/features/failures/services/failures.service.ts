import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Failure } from '../interfaces/failure.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root',
})
export class FailuresService {
  private http = inject(HttpClient);

  getFailures(): Observable<Failure[]> {
    return this.http.get<Failure[]>(`${baseUrl}/failures`);
  }
}
