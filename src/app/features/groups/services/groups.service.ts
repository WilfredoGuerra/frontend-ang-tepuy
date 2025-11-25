import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Group } from '../interfaces/group.interface';
import { environment } from 'src/environments/environment';
import { Failure } from '@features/failures/interfaces/failure.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private http = inject(HttpClient);

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${baseUrl}/groups`);
  }

  getFailuresByGroup(groupId: number): Observable<Failure[]> {
    return this.http.get<any>(`${baseUrl}/groups/${groupId}/with-failures`).pipe(
      map(response => response.failures || [])
    );
  }
}
