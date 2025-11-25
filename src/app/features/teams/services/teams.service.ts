import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Team } from '../interfaces/team.interface';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class TeamsService {

  private http = inject(HttpClient);

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${baseUrl}/teams`)
    .pipe(
      // tap((resp) => console.log(resp) )
    )
  }

}
