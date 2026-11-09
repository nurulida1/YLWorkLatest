import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { UserService } from './userService.service';
import { LoginResponse } from '../models/User';

interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  url = environment.ApiBaseUrl + '/Auth';

  private refreshRequest$: Observable<LoginResponse> | null = null;

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private router: Router,
    private userService: UserService,
  ) {}

  // ==========================================
  // LOGIN
  // ==========================================

  login(
    email: string,
    password: string,
    rememberMe: boolean = false,
  ): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.url}/authenticate`, {
        email,
        password,
        rememberMe,
      })
      .pipe(
        tap((res) => {
          if (res?.success && res.accessToken && res.refreshToken) {
            this.userService.setCurrentUser(res, rememberMe);
          }
        }),
        catchError(this.handleError('Login')),
      );
  }

  // ==========================================
  // INITIALIZE AUTHENTICATION
  // ==========================================

  initAuth(): Observable<boolean> {
    const localToken = localStorage.getItem('jwtToken');
    const sessionToken = sessionStorage.getItem('jwtToken');

    const token = localToken ?? sessionToken;

    const storedUser =
      localStorage.getItem('currentUser') ??
      sessionStorage.getItem('currentUser');

    if (!storedUser) {
      this.clearAuth();
      return of(false);
    }

    let user: LoginResponse;

    try {
      user = JSON.parse(storedUser);
    } catch {
      this.clearAuth();
      return of(false);
    }

    const refreshToken =
      localStorage.getItem('refreshToken') ??
      sessionStorage.getItem('refreshToken') ??
      user.refreshToken;

    if (!refreshToken) {
      this.clearAuth();
      return of(false);
    }

    // Restore the refresh token into the user object.
    user = {
      ...user,
      refreshToken,
    };

    // Access token is still valid.
    if (token && this.isTokenValid(token)) {
      this.userService.setCurrentUser(
        {
          ...user,
          accessToken: token,
        },
        !!localToken,
      );

      return of(true);
    }

    // Access token expired. Attempt refresh.
    return this.refreshAccessToken().pipe(
      map(() => true),
      catchError(() => {
        this.clearAuth();
        return of(false);
      }),
    );
  }

  // ==========================================
  // REFRESH ACCESS TOKEN
  // ==========================================

  refreshAccessToken(): Observable<LoginResponse> {
    // Reuse an ongoing refresh request.
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const localToken = localStorage.getItem('jwtToken');
    const rememberMe =
      localToken !== null || localStorage.getItem('refreshToken') !== null;

    const storage = rememberMe ? localStorage : sessionStorage;

    const storedUser = storage.getItem('currentUser');

    if (!storedUser) {
      this.clearAuth();

      return throwError(() => new Error('No stored user found.'));
    }

    let user: LoginResponse;

    try {
      user = JSON.parse(storedUser);
    } catch {
      this.clearAuth();

      return throwError(() => new Error('Invalid stored user data.'));
    }

    const refreshToken = storage.getItem('refreshToken') ?? user.refreshToken;

    if (!refreshToken) {
      this.clearAuth();

      return throwError(() => new Error('Refresh token not found.'));
    }

    const request$ = this.http
      .post<RefreshTokenResponse>(`${this.url}/refresh`, { refreshToken })
      .pipe(
        map((res) => {
          if (!res?.success || !res.accessToken || !res.refreshToken) {
            throw new Error('Unable to refresh authentication.');
          }

          return {
            ...user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            expiresAt: res.expiresAt,
          } as LoginResponse;
        }),

        tap((updatedUser) => {
          this.userService.setCurrentUser(updatedUser, rememberMe);
        }),

        catchError((error) => {
          this.clearAuth();
          return throwError(() => error);
        }),

        finalize(() => {
          this.refreshRequest$ = null;
        }),

        shareReplay({
          bufferSize: 1,
          refCount: false,
        }),
      );

    this.refreshRequest$ = request$;

    return request$;
  }

  // ==========================================
  // CHECK AUTHENTICATION
  // ==========================================

  isAuthenticated(): boolean {
    const token =
      localStorage.getItem('jwtToken') ?? sessionStorage.getItem('jwtToken');

    const refreshToken =
      localStorage.getItem('refreshToken') ??
      sessionStorage.getItem('refreshToken');

    return !!token && !!refreshToken;
  }

  // ==========================================
  // CHECK JWT EXPIRY
  // ==========================================

  isTokenValid(token: string): boolean {
    try {
      const payloadBase64 = token.split('.')[1];

      if (!payloadBase64) {
        return false;
      }

      const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');

      const paddedBase64 = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        '=',
      );

      const payload = JSON.parse(atob(paddedBase64));

      if (!payload.exp) {
        return false;
      }

      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // ==========================================
  // GET ACCESS TOKEN
  // ==========================================

  getAccessToken(): string | null {
    return (
      localStorage.getItem('jwtToken') ?? sessionStorage.getItem('jwtToken')
    );
  }

  // ==========================================
  // GET REFRESH TOKEN
  // ==========================================

  getRefreshToken(): string | null {
    return (
      localStorage.getItem('refreshToken') ??
      sessionStorage.getItem('refreshToken')
    );
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  logout(): void {
    const refreshToken = this.getRefreshToken();

    const logoutRequest$ = refreshToken
      ? this.http
          .post(`${this.url}/logout`, {
            refreshToken,
          })
          .pipe(catchError(() => of(null)))
      : of(null);

    logoutRequest$
      .pipe(
        finalize(() => {
          this.clearAuth();
          this.router.navigate(['/login']);
        }),
      )
      .subscribe();
  }

  // ==========================================
  // CLEAR AUTHENTICATION
  // ==========================================

  clearAuth(): void {
    this.userService.setCurrentUser(null);
  }

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: `Error during ${context}`,
      detail:
        error?.error?.message ||
        error?.error?.title ||
        error?.error?.detail ||
        error?.message ||
        'Unexpected error occurred.',
    });

    return throwError(() => error);
  };

  logoutAfterPasswordChange(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }
}
