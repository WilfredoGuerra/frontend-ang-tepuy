import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Provider } from '../interfaces/provider.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root',
})
export class ProvidersService {
  private http = inject(HttpClient);

  getProviders(): Observable<Provider[]> {
    return this.http.get<Provider[]>(`${baseUrl}/providers`);
  }
}
