import { Injectable } from '@angular/core';
import {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateUserRequest,
  UserDto,
} from '../models/User';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import {
  Observable,
  retry,
  catchError,
  of,
  throwError,
  BehaviorSubject,
  map,
} from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  url = environment.ApiBaseUrl + '/Users';
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private router: Router,
  ) {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) this.currentUserSubject.next(JSON.parse(savedUser));
  }

  get currentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: LoginResponse | null, rememberMe: boolean = false) {
    this.currentUserSubject.next(user);
    if (user) {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('jwtToken', user.accessToken);
      storage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('jwtToken');
      sessionStorage.removeItem('currentUser');
    }
  }

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<UserDto>> {
    let params = new HttpParams()
      .set('page', query.Page.toString())
      .set('pageSize', query.PageSize.toString());
    if (query.Select) params = params.set('select', query.Select);
    if (query.OrderBy) params = params.set('orderBy', query.OrderBy);
    if (query.Filter) params = params.set('filter', query.Filter);
    if (query.Includes) params = params.set('includes', query.Includes);

    return this.http
      .get<PagingContent<UserDto>>(this.url + '/GetMany', { params })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<UserDto | null> {
    let params = new HttpParams()
      .set('page', query.Page.toString())
      .set('pageSize', query.PageSize.toString());
    if (query.Select) params = params.set('select', query.Select);
    if (query.OrderBy) params = params.set('orderBy', query.OrderBy);
    if (query.Filter) params = params.set('filter', query.Filter);
    if (query.Includes) params = params.set('includes', query.Includes);

    return this.http.get<UserDto>(this.url + '/GetOne', { params }).pipe(
      retry(1),
      catchError((error) =>
        error.status === 404 ? of(null) : this.handleError('GetOne')(error),
      ),
    );
  }

  GetProfile(): Observable<UserDto> {
    return this.http
      .get<UserDto>(`${this.url}/Profile`)
      .pipe(retry(1), catchError(this.handleError('GetProfile')));
  }

  Login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.url}/Login`, request)
      .pipe(retry(1), catchError(this.handleError('Login')));
  }

  Register(request: RegisterRequest): Observable<UserDto> {
    return this.http.post<any>(`${this.url}/Register`, request).pipe(
      map((res) => res.user),
      retry(1),
      catchError(this.handleError('Register')),
    );
  }

  UpdateUser(
    request: UpdateUserRequest,
  ): Observable<{ success: boolean; message: string; user?: UserDto }> {
    // Extract id from request to use in the URL path
    return this.http
      .put<{
        success: boolean;
        message: string;
        user?: UserDto;
      }>(`${this.url}/Update/${request.id}`, request)
      .pipe(retry(1), catchError(this.handleError('UpdateUser')));
  }

  ResetPasswordLink(email: string): Observable<BaseResponse> {
    const params = new HttpParams().set('Email', email);
    return this.http
      .post<BaseResponse>(`${this.url}/ForgotPassword`, {}, { params })
      .pipe(retry(1), catchError(this.handleError('ResetPasswordLink')));
  }

  ResetPassword(request: ResetPasswordRequest): Observable<BaseResponse> {
    return this.http
      .post<BaseResponse>(`${this.url}/ResetPassword`, request)
      .pipe(retry(1), catchError(this.handleError('ResetPassword')));
  }

  ChangePassword(request: ChangePasswordRequest): Observable<BaseResponse> {
    return this.http
      .post<BaseResponse>(`${this.url}/ChangePassword`, request)
      .pipe(retry(1), catchError(this.handleError('ChangePassword')));
  }

  UpdateStatus(id: string, isActive: boolean): Observable<BaseResponse> {
    return this.http
      .put<BaseResponse>(
        `${this.url}/${id}/status`,
        {},
        {
          params: { isActive: isActive.toString() }, // Using HttpParams is cleaner
        },
      )
      .pipe(retry(1), catchError(this.handleError('isActive')));
  }

  GetDashboardCounts(): Observable<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  }> {
    return this.http
      .get<{
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
      }>(`${this.url}/DashboardCounts`)
      .pipe(retry(1), catchError(this.handleError('GetDashboardCounts')));
  }

  logout(): void {
    this.setCurrentUser(null);
    this.router.navigate(['/login']);
  }

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail:
        error?.error?.detail || error?.message || 'Unexpected error occurred.',
    });
    return throwError(() => error);
  };
}
