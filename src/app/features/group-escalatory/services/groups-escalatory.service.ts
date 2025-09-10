import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GroupEscalatory } from '../interfaces/group-escalatory.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class GroupsEscalatoryService {

  private http = inject(HttpClient);

    getGroupsEscalatory(): Observable<GroupEscalatory[]> {
      return this.http.get<GroupEscalatory[]>(`${baseUrl}/groups-escalatory`);
    }

}
