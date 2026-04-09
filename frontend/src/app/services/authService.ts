import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { retry, tap, catchError, throwError, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { UserService } from './userService.service';
import { LoginResponse } from '../models/User';

@Injectable({ providedIn: 'root' })
export class AuthService {
  url = environment.ApiBaseUrl + '/Auth';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private userService: UserService,
  ) {}

  login(username: string, password: string) {
    return this.http
      .post<any>(`${this.url}/login`, { username, password })
      .pipe(
        retry(1),
        tap((res) => {
          if (res?.data?.token) {
            this.userService.setCurrentUser(res.data);
            localStorage.setItem('jwtToken', res.data.token);
          }
        }),
        catchError(this.handleError('Login')),
      );
  }

  authenticate(email: string, password: string): Observable<LoginResponse> {
    const request = { email, password };
    return this.http
      .post<LoginResponse>(`${this.url}/authenticate`, request)
      .pipe(retry(1), catchError(this.handleError('authenticate')));
  }

  initAuth() {
    const token = localStorage.getItem('jwtToken') ?? sessionStorage.getItem('jwtToken');
    const user = localStorage.getItem('currentUser') ?? sessionStorage.getItem('currentUser');

    if (token && user) {
      const rememberMe = !!localStorage.getItem('jwtToken');
      this.userService.setCurrentUser(JSON.parse(user), rememberMe);
    }
  }

  isAuthenticated(): boolean {
    const token =localStorage.getItem('jwtToken')  ?? sessionStorage.getItem('jwtToken');
    console.log(token);
    return !!token;
  }

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: `Error during ${context}`,
      detail:
        error?.error?.message || error?.message || 'Unexpected error occurred.',
    });
    return throwError(() => error);
  };
}
