import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthResponse } from '@auth/interfaces/auth-response.interface';
import { User, UserResponse } from '@auth/interfaces/user.interface';
import { catchError, map, Observable, of, tap } from 'rxjs';
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

  createUser(personaLike: Partial<User>): Observable<User> {
    return this.http.post<User>(`${baseUrl}/auth/register/`, personaLike);
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

  // getNetworkElementsSearch(query: string, options: Options = {}): Observable<NetworksElement> {
  //   const { limit = 9, offset = 0 } = options;
  //   return this.http.get<NetworksElement>(`${baseUrl}/network-elements/${query}`, {
  //     params: {
  //       limit,
  //       offset,
  //     },
  //   });
  // }
}
