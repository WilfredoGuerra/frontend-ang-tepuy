import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Group } from '../interfaces/group.interface';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class GroupsService {

  private http = inject(HttpClient);

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${baseUrl}/groups`);
  }

}
