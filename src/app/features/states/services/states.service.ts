import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { State } from '../interfaces/state.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class StatesService {

  private http = inject(HttpClient);

    getStates(): Observable<State[]> {
      return this.http.get<State[]>(`${baseUrl}/states`);
    }
}
