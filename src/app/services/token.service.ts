import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  isTokenExpired(token: string): boolean {
    if (!token) return true;

    try {
      const payload = this.decodeToken(token);
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 30000; // 30 segundos de buffer

      return currentTime >= (expirationTime - bufferTime);
    } catch (error) {
      return true;
    }
  }

  getTokenExpirationTime(token: string): number | null {
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      return payload.exp ? payload.exp * 1000 : null;
    } catch (error) {
      return null;
    }
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }
}
