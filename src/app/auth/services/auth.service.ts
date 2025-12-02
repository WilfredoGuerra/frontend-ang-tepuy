import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthResponse } from '@auth/interfaces/auth-response.interface';
import { User, UserResponse } from '@auth/interfaces/user.interface';
import {
  catchError,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

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

  private tokenRefreshInterval: any;
  private readonly TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000;

  constructor() {
    this.startAutoRefresh();
  }

  checkStatusResource = rxResource({
    stream: () => this.checkStatus(),
  });

  authStatus = computed<AuthStatus>(() => {
    if (this._authStatus() === 'checking') return 'checking';
    return this._user() ? 'authenticated' : 'not-authenticated';
  });

  user = computed(() => this._user());
  token = computed(() => this._token());

  isAdmin = computed(() => {
    const roles = this._user()?.roles ?? [];
    return roles.includes('super_user') || roles.includes('admin');
  });

  isUserRoom = computed(() => {
    const roles = this._user()?.roles ?? [];
    return roles.includes('room_user');
  });

  private startAutoRefresh(): void {
    this.tokenRefreshInterval = setInterval(() => {
      if (this._authStatus() === 'authenticated') {
        console.log('🔄 Renovación automática de token (30min)');
        this.checkStatus().subscribe({
          next: (success) => {
            if (success) {
              console.log('✅ Token renovado automáticamente');
            }
          },
          error: (error) => {
            console.warn('⚠️ Error en renovación automática:', error);
          },
        });
      }
    }, this.TOKEN_REFRESH_INTERVAL);
  }

  private stopAutoRefresh(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
  }

login(email: string, password: string): Observable<boolean> {
  return this.http
    .post<AuthResponse>(`${baseUrl}/auth/login`, { email, password })
    .pipe(
      map((resp) => this.handleAuthSuccess(resp)),
      catchError((error) => {
        // Aquí podríamos manejar el error de login de manera específica
        console.log('Login error:', error);
        // Retornar false sin llamar a handleAuthError
        this._user.set(null);
        this._token.set(null);
        this._authStatus.set('not-authenticated');
        return of(false);
      })
    );
}

  checkStatus(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.logout();
      return of(false);
    }

    return this.http.get<AuthResponse>(`${baseUrl}/auth/check-status`).pipe(
      map((resp) => this.handleAuthSuccess(resp)),
      catchError((error) => this.handleAuthError(error))
    );
  }

  logout() {
    this.stopAutoRefresh();
    const sessionId = localStorage.getItem('sessionId');

    // Intentar notificar al backend del logout, pero no bloquear si falla
    if (sessionId) {
      this.http
        .post(`${baseUrl}/auth/logout`, { sessionId })
        .pipe(
          catchError((error) => {
            console.warn(
              'Logout request failed, continuing with local logout:',
              error
            );
            return of(null);
          })
        )
        .subscribe();
    }

    this._user.set(null);
    this._token.set(null);
    this._authStatus.set('not-authenticated');

    localStorage.removeItem('token');
    localStorage.removeItem('sessionId');

    // El WebSocketService se desconectará automáticamente
  }

  createUser(
    userLike: Partial<User>,
    imageFileList?: FileList
  ): Observable<User> {
    return this.uploadUserImages(imageFileList).pipe(
      map((imageUrls) => ({
        ...userLike,
        images: [...(userLike.images || []), ...imageUrls],
      })),
      switchMap((userData) =>
        this.http.post<User>(`${baseUrl}/auth/register/`, userData)
      )
    );
  }

  getUsers(options: Options): Observable<UserResponse> {
    const { limit = 9, offset = 0, group = '' } = options;
    return this.http.get<UserResponse>(`${baseUrl}/auth/users`, {
      params: { limit, offset, group },
    });
  }

  getUsersBy(query: string, options: Options = {}): Observable<UserResponse> {
    const { limit = 9, offset = 0 } = options;

    return this.http
      .get<UserResponse>(`${baseUrl}/auth/${query}`, {
        params: { limit, offset },
      })
      .pipe(tap((resp) => console.log('Respuesta búsqueda:', resp)));
  }

  getUsersSearch(
    query: string,
    options: Options = {}
  ): Observable<UserResponse> {
    query = query.toLowerCase().trim();
    const { limit = 9, offset = 0 } = options;

    if (!query || query.length < 2) {
      return of({
        count: 0,
        pages: 0,
        users: [],
      });
    }

    const validQuery = encodeURIComponent(query);

    return this.http
      .get<any>(`${baseUrl}/auth/${validQuery}`, {
        params: { limit, offset },
      })
      .pipe(
        map((response) => {
          if (response && response.users && Array.isArray(response.users)) {
            return {
              count: response.count || response.users.length,
              pages: response.pages || Math.ceil(response.users.length / limit),
              users: response.users,
            };
          } else if (Array.isArray(response)) {
            return {
              count: response.length,
              pages: Math.ceil(response.length / limit),
              users: response,
            };
          } else {
            return {
              count: 0,
              pages: 0,
              users: [],
            };
          }
        }),
        catchError((error) => {
          console.error('Error en búsqueda de usuarios:', error);
          return of({
            count: 0,
            pages: 0,
            users: [],
          });
        })
      );
  }

  uploadUserImage(imageFile: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', imageFile);

    return this.http.post<any>(`${baseUrl}/files/user`, formData).pipe(
      map((resp) => {
        if (resp && resp.secureUrl) {
          return resp.secureUrl;
        } else if (typeof resp === 'string') {
          return resp;
        } else if (resp && typeof resp === 'object') {
          return (
            resp.fileName ||
            resp.filename ||
            resp.name ||
            resp.imageName ||
            resp.file ||
            resp.image ||
            `unknown_${Date.now()}`
          );
        } else {
          return `temp_${Date.now()}_${imageFile.name}`;
        }
      }),
      catchError((error) => of(`error_${Date.now()}_${imageFile.name}`))
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

  private handleAuthSuccess({ token, user, sessionId }: any) {
    this._user.set(user);
    this._authStatus.set('authenticated');
    this._token.set(token);

    localStorage.setItem('token', token);
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
      console.log('💾 SessionId guardado:', sessionId);
    }

    // El WebSocketService detectará automáticamente el nuevo token y sessionId
    return true;
  }

private handleAuthError(error: any) {
  // Identificar el tipo de error
  if (error.status === 401) {
    // Verificar si es una solicitud de login
    const isLoginRequest = error.url && error.url.includes('/auth/login');

    if (isLoginRequest) {
      // Error de credenciales inválidas - solo logout sin notificación
      this.logout();
      return of(false);
    } else {
      // Sesión expirada para otras rutas
      const errorMessage = 'Su sesión ha expirado por inactividad';

      // Mostrar notificación inmediatamente o después de un breve delay
      setTimeout(() => {
        this.showSessionExpiredNotification(errorMessage);
      }, 100);

      this.logout();
      return of(false);
    }
  }

  // Para otros errores
  this.logout();
  return of(false);
}

  private showSessionExpiredNotification(message: string): void {
    // Usar SweetAlert2 para mostrar notificación
    Swal.fire({
      icon: 'warning',
      title: 'Sesión Expirada',
      text: message,
      confirmButtonText: 'Aceptar',
      timer: 5000,
      timerProgressBar: true,
      allowOutsideClick: false,
    });
  }
}
