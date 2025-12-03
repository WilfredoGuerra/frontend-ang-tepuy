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

createUser(userLike: Partial<User>, imageFileList?: FileList): Observable<User> {
  return this.uploadUserImages(imageFileList).pipe(
    map((imageUrls) => {
      // Procesar URLs para quedarse solo con nombres de archivo
      const processedImages = imageUrls.map(url => {
        if (url.includes('http') || url.includes('/')) {
          return url.split('/').pop();
        }
        return url;
      });

      return {
        ...userLike,
        images: [...(userLike.images || []), ...processedImages],
      };
    }),
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
      console.log('🔍 Respuesta upload imagen:', resp); // Para debug

      // El backend debería devolver solo el nombre del archivo, no la URL completa
      if (resp && resp.fileName) {
        return resp.fileName; // Solo el nombre del archivo
      } else if (resp && resp.secureUrl) {
        // Si devuelve URL completa, extraer solo el nombre del archivo
        const url = resp.secureUrl;
        const fileName = url.split('/').pop(); // Extraer "0a844366-7218-49af-b57f-90f553e6b16d.png"
        return fileName || `temp_${Date.now()}_${imageFile.name}`;
      } else if (typeof resp === 'string') {
        // Si es string, verificar si es URL o solo nombre
        if (resp.includes('http') || resp.includes('/')) {
          return resp.split('/').pop(); // Extraer solo el nombre
        }
        return resp; // Ya es solo el nombre
      }
      // Fallback
      return `temp_${Date.now()}_${imageFile.name}`;
    }),
    catchError((error) => {
      console.error('Error subiendo imagen:', error);
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

  // Codigo Nuevo para user

getUserById(id: number): Observable<User> {
  return this.http.get<any>(`${baseUrl}/auth/${id}`).pipe(
    map(response => {
      if (response.users && response.users.length > 0) {
        const user = response.users[0];

        // Convertir imágenes de objetos a strings si es necesario
        if (user.images && Array.isArray(user.images)) {
          user.images = user.images.map((img: any) =>
            typeof img === 'object' && img.url ? img.url : String(img)
          );
        }

        // Asegurar que level_education sea un array de números (IDs)
        if (user.level_education && Array.isArray(user.level_education)) {
          user.level_education = user.level_education.map((level: any) => {
            if (typeof level === 'object' && level.id !== undefined) {
              return level.id;
            }
            return Number(level);
          });
        }

        return user;
      }
      throw new Error('Usuario no encontrado');
    }),
    catchError(error => {
      console.error('Error al obtener usuario:', error);
      throw error;
    })
  );
}

updateUser(id: number, updateData: any, imageFileList?: FileList): Observable<any> {
  return this.uploadUserImages(imageFileList).pipe(
    switchMap(imageUrls => {
      console.log('🔍 imageUrls antes de procesar:', imageUrls); // Debug

      // Filtrar solo nombres de archivo (sin URLs completas)
      const processedImages = imageUrls.map(url => {
        if (url.includes('http') || url.includes('/')) {
          // Extraer solo el nombre del archivo
          const fileName = url.split('/').pop();
          console.log(`🔍 Procesando URL: ${url} -> ${fileName}`);
          return fileName;
        }
        return url;
      }).filter(Boolean); // Remover valores nulos/undefined

      console.log('🔍 processedImages:', processedImages); // Debug

      const dataToSend = {
        ...updateData,
        // Solo incluir imágenes si hay
        ...(processedImages.length > 0 && { images: processedImages })
      };

      console.log('🔍 Data a enviar al backend:', dataToSend); // Debug

      // Si no hay contraseña, no incluirla
      if (!dataToSend.password || dataToSend.password.trim() === '') {
        delete dataToSend.password;
      }

      return this.http.patch<any>(`${baseUrl}/auth/${id}`, dataToSend);
    })
  );
}

// Método para eliminar imagen de usuario
deleteUserImage(userId: number, imageUrl: string): Observable<any> {
  return this.http.delete(`${baseUrl}/auth/${userId}/images`, {
    body: { imageUrl }
  }).pipe(
    catchError(error => {
      console.warn('Error al eliminar imagen, continuando...', error);
      return of({ success: false, message: 'No se pudo eliminar la imagen' });
    })
  );
}
}
