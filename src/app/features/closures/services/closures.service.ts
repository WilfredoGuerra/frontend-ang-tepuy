import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateClosureDto, Closure } from '../interfaces/closure.interface';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ClosuresService {
  private http = inject(HttpClient);
  // private baseUrl = `${baseUrl}/closures`;

  createClosure(closureData: CreateClosureDto): Observable<Closure> {
    return this.http.post<Closure>(`${baseUrl}/closures`, closureData);
  }

  getClosureByTicketId(ticketId: number): Observable<Closure> {
    return this.http.get<Closure>(`${baseUrl}/ticket/${ticketId}`);
  }

  //TODO: Modificar para adaptar a eliminacion por Admin
  safeDeleteClosure(closureId: number): Observable<any> {
    return this.http.delete(`${baseUrl}/safe-delete/${closureId}`);
  }
}
