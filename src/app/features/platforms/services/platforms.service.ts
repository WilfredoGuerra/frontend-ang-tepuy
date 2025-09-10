import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Platform } from '../interfaces/platform.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root',
})
export class PlatformsService {
  private http = inject(HttpClient);

  getPlatforms(): Observable<Platform[]> {
    return this.http.get<Platform[]>(`${baseUrl}/platforms`);
  }
}
