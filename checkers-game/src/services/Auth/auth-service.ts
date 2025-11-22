import { Injectable } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface SignUpPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user?: { id: string; username: string; email: string };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8000';

  private _isLoggedIn = false;
  get isLoggedIn() { return this._isLoggedIn; }

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    this._isLoggedIn = !!token;
  }

  register(payload: SignUpPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/api/v1/auth/register`, payload).pipe(
      tap((res) => {
        if (res?.access_token) {
          localStorage.setItem('token', res.access_token);
          this._isLoggedIn = true;
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this._isLoggedIn = false;
  }
}
