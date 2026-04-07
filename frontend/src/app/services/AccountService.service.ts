import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { MessageService } from 'primeng/api';
import { Observable, retry, catchError, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LoginResponse } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  url = environment.ApiBaseUrl + '/Account';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  Login(username: string, password: string): Observable<LoginResponse> {
    const request = { username, password };

    return this.http
      .post<LoginResponse>(`${this.url}/Login`, request)
      .pipe(retry(1), catchError(this.handleError('Login')));
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
