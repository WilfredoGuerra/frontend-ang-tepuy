import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LevelEducation } from '../interfaces/level-education.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root',
})
export class LevelsEducationService {
  private http = inject(HttpClient);

  getLevelsEducation(): Observable<LevelEducation[]> {
    return this.http.get<LevelEducation[]>(`${baseUrl}/level-education`);
  }
}
