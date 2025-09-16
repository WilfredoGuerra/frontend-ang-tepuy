import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthResponse } from '@auth/interfaces/auth-response.interface';
import { User, UserResponse } from '@auth/interfaces/user.interface';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  group?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(localStorage.getItem('token'));

  private http = inject(HttpClient);

  checkStatusResource = rxResource({
    stream: () => this.checkStatus(),
  });

  authStatus = computed<AuthStatus>(() => {
    if (this._authStatus() === 'checking') return 'checking';
    if (this._user()) {
      return 'authenticated';
    }
    return 'not-authenticated';
  });

  user = computed(() => this._user());
  token = computed(this._token);
  isAdmin = computed(() => {
    const roles = this._user()?.roles ?? [];
    return roles.includes('super_user') || roles.includes('admin');
  });

  isUserRoom = computed(() => {
    const roles = this._user()?.roles ?? [];
    return roles.includes('room_user');
  });

  login(email: string, password: string): Observable<boolean> {
    return this.http
      .post<AuthResponse>(`${baseUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        map((resp) => this.handleAuthSuccess(resp)),
        catchError((error: any) => this.handleAuthError(error))
      );
  }

  checkStatus(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.logout();
      return of(false);
    }
    return this.http
      .get<AuthResponse>(`${baseUrl}/auth/check-status`, {
        // headers: {
        //   Authorization: `Bearer ${token}`,
        // },
      })
      .pipe(
        map((resp) => this.handleAuthSuccess(resp)),
        catchError((error: any) => this.handleAuthError(error))
      );
  }

  logout() {
    this._user.set(null);
    this._token.set(null);
    this._authStatus.set('not-authenticated');
    localStorage.removeItem('token');
  }

  private handleAuthSuccess({ token, user }: AuthResponse) {
    this._user.set(user);
    this._authStatus.set('authenticated');
    this._token.set(token);
    localStorage.setItem('token', token);
    return true;
  }

  private handleAuthError(error: any) {
    this.logout();
    return of(false);
  }

createUser(userLike: Partial<User>, imageFileList?: FileList): Observable<User> {
  return this.uploadUserImages(imageFileList).pipe(
    map(imageUrls => ({
      ...userLike,
      images: [...(userLike.images || []), ...imageUrls]
    })),
    switchMap(userData =>
      this.http.post<User>(`${baseUrl}/auth/register/`, userData)
    )
  );
}

  getUsers(options: Options): Observable<UserResponse> {
    const { limit = 9, offset = 0, group = '' } = options;
    return this.http.get<UserResponse>(`${baseUrl}/auth/users`, {
      params: {
        limit,
        offset,
        group,
      },
    });
  }

  getUsersSearch(query: string, options: Options = {}): Observable<UserResponse> {
    const { limit = 9, offset = 0 } = options;
    return this.http.get<UserResponse>(`${baseUrl}/auth/users/${query}`, {
      params: {
        limit,
        offset,
      },
    });
  }

  uploadUserImage(imageFile: File): Observable<string> {
  const formData = new FormData();
  formData.append('file', imageFile);

  return this.http
    .post<any>(`${baseUrl}/files/user`, formData)
    .pipe(
      map((resp) => {
        if (resp && resp.secureUrl) {
          return resp.secureUrl;
        } else if (typeof resp === 'string') {
          return resp;
        } else if (resp && typeof resp === 'object') {
          return resp.fileName || resp.filename || resp.name || resp.imageName ||
                 resp.file || resp.image || `unknown_${Date.now()}`;
        } else {
          console.warn('Formato de respuesta inesperado, usando nombre temporal');
          return `temp_${Date.now()}_${imageFile.name}`;
        }
      }),
      catchError(error => {
        console.error('Error en uploadImage:', error);
        return of(`error_${Date.now()}_${imageFile.name}`);
      })
    );
}

uploadUserImages(images?: FileList): Observable<string[]> {
  if (!images || images.length === 0) return of([]);

  const uploadObservables = Array.from(images).map((imageFile) =>
    this.uploadUserImage(imageFile)
  );

  return forkJoin(uploadObservables);
}

getUserImages(userId: number): Observable<User[]> {
  return this.http.get<User[]>(`${baseUrl}/auth/users/${userId}/images`);
}

}
