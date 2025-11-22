// auth-service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export interface SignUpPayload {
  username: string;
  email: string;
  password: string;
  name?: string | null;
  surname?: string | null;
  birthdate?: string | null;
  country?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8000';
  private _isLoggedIn = false;
  private _currentUser: User | null = null;

  get isLoggedIn() { return this._isLoggedIn; }
  get currentUser() { return this._currentUser; }

  constructor(private http: HttpClient) {
    
  }

  // === REGISTER ===
  register(payload: SignUpPayload): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/api/v1/auth/register`,
      payload,
      { withCredentials: true } // 👈 importante
    ).pipe(
      tap(res => {
        if (res?.user) {
          this._isLoggedIn = true;
          this._currentUser = res.user;
        }
      })
    );
  }

  // === LOGIN ===
  login(payload: LoginPayload): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/api/v1/auth/login`,
      payload,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        if (res?.user) {
          this._isLoggedIn = true;
          this._currentUser = res.user;
        }
      })
    );
  }

  // === CHECK SESSION (usar al inicio de la app) ===
  checkSession(): Observable<User | null> {
    return this.http.get<User>(
      `${this.baseUrl}/api/v1/auth/me`,
      { withCredentials: true }
    ).pipe(
      tap({
        next: (user) => {
          this._isLoggedIn = true;
          this._currentUser = user;
        },
        error: () => {
          this._isLoggedIn = false;
          this._currentUser = null;
        }
      })
    );
  }

  // === REFRESH TOKEN ===
  refreshToken(): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/v1/auth/refresh`,
      {},
      { withCredentials: true }
    );
  }

  // === LOGOUT ===
  logout(): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/v1/auth/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this._isLoggedIn = false;
        this._currentUser = null;
      })
    );
  }
}
