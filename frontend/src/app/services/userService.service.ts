import { Injectable } from '@angular/core';
import {
  ChangePasswordRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  StaffDashboard,
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
  ) {
    // Restore user information from storage.
    // Token validation and refresh are handled by AuthService.
    const savedUser =
      localStorage.getItem('currentUser') ??
      sessionStorage.getItem('currentUser');

    if (savedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUser));
      } catch {
        this.setCurrentUser(null);
      }
    }
  }

  // ==========================================
  // CURRENT USER
  // ==========================================

  get currentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  // ==========================================
  // SET CURRENT USER
  // ==========================================

  setCurrentUser(
    user: LoginResponse | null,
    rememberMe: boolean = false,
  ): void {
    this.currentUserSubject.next(user);

    if (user) {
      const storage = rememberMe ? localStorage : sessionStorage;

      const otherStorage = rememberMe ? sessionStorage : localStorage;

      // Remove previous session from the other storage.
      otherStorage.removeItem('jwtToken');
      otherStorage.removeItem('refreshToken');
      otherStorage.removeItem('currentUser');

      // Save current session.
      storage.setItem('jwtToken', user.accessToken);
      storage.setItem('refreshToken', user.refreshToken);
      storage.setItem('currentUser', JSON.stringify(user));
    } else {
      // Clear both storages.
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');

      sessionStorage.removeItem('jwtToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('currentUser');
    }
  }

  // ==========================================
  // GET MANY USERS
  // ==========================================

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<UserDto>> {
    let params = new HttpParams()
      .set('page', query.Page.toString())
      .set('pageSize', query.PageSize.toString());

    if (query.Select) {
      params = params.set('select', query.Select);
    }

    if (query.OrderBy) {
      params = params.set('orderBy', query.OrderBy);
    }

    if (query.Filter) {
      params = params.set('filter', query.Filter);
    }

    if (query.Includes) {
      params = params.set('includes', query.Includes);
    }

    return this.http
      .get<PagingContent<UserDto>>(`${this.url}/GetMany`, { params })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  // ==========================================
  // GET ONE USER
  // ==========================================

  GetOne(query: GridifyQueryExtend): Observable<UserDto | null> {
    let params = new HttpParams()
      .set('page', query.Page.toString())
      .set('pageSize', query.PageSize.toString());

    if (query.Select) {
      params = params.set('select', query.Select);
    }

    if (query.OrderBy) {
      params = params.set('orderBy', query.OrderBy);
    }

    if (query.Filter) {
      params = params.set('filter', query.Filter);
    }

    if (query.Includes) {
      params = params.set('includes', query.Includes);
    }

    return this.http.get<UserDto>(`${this.url}/GetOne`, { params }).pipe(
      retry(1),
      catchError((error) =>
        error.status === 404 ? of(null) : this.handleError('GetOne')(error),
      ),
    );
  }

  // ==========================================
  // GET PROFILE
  // ==========================================

  GetProfile(): Observable<UserDto> {
    return this.http
      .get<UserDto>(`${this.url}/Profile`)
      .pipe(retry(1), catchError(this.handleError('GetProfile')));
  }

  // ==========================================
  // REGISTER
  // ==========================================

  Register(request: RegisterRequest): Observable<any> {
    return this.http
      .post<any>(`${this.url}/Register`, request)
      .pipe(retry(1), catchError(this.handleError('Register')));
  }

  // ==========================================
  // ADMIN CREATE
  // ==========================================

  AdminCreate(request: RegisterRequest): Observable<UserDto> {
    return this.http.post<any>(`${this.url}/AdminCreate`, request).pipe(
      map((res) => res.user),
      retry(1),
      catchError(this.handleError('AdminCreate')),
    );
  }

  // ==========================================
  // UPDATE USER
  // ==========================================

  UpdateUser(request: UpdateUserRequest): Observable<{
    success: boolean;
    message: string;
    user?: UserDto;
  }> {
    return this.http
      .put<{
        success: boolean;
        message: string;
        user?: UserDto;
      }>(`${this.url}/Update/${request.id}`, request)
      .pipe(retry(1), catchError(this.handleError('UpdateUser')));
  }

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  ResetPasswordLink(email: string): Observable<BaseResponse> {
    const params = new HttpParams().set('Email', email);

    return this.http
      .post<BaseResponse>(`${this.url}/ForgotPassword`, null, { params })
      .pipe(catchError(this.handleError('ResetPasswordLink')));
  }

  // ==========================================
  // RESET PASSWORD
  // ==========================================

  ResetPassword(request: ResetPasswordRequest): Observable<BaseResponse> {
    return this.http
      .post<BaseResponse>(`${this.url}/ResetPassword`, request)
      .pipe(catchError(this.handleError('ResetPassword')));
  }

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  ChangePassword(request: ChangePasswordRequest): Observable<BaseResponse> {
    return this.http
      .put<BaseResponse>(`${this.url}/ChangePassword`, request)
      .pipe(catchError(this.handleError('ChangePassword')));
  }

  // ==========================================
  // UPDATE USER STATUS
  // ==========================================

  UpdateStatus(id: string, isActive: boolean): Observable<BaseResponse> {
    return this.http
      .put<BaseResponse>(
        `${this.url}/${id}/status`,
        {},
        {
          params: {
            isActive: isActive.toString(),
          },
        },
      )
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
  }

  // ==========================================
  // UPDATE APPROVAL
  // ==========================================

  UpdateApproval(payload: any): Observable<BaseResponse> {
    return this.http
      .put<BaseResponse>(`${this.url}/Approval/${payload.id}`, payload)
      .pipe(retry(1), catchError(this.handleError('UpdateApproval')));
  }

  // ==========================================
  // GET DASHBOARD
  // ==========================================

  GetDashboard(): Observable<StaffDashboard | null> {
    return this.http.get<StaffDashboard>(`${this.url}/DashboardCounts`).pipe(
      retry(1),
      catchError((error) => {
        if (error.status === 404) {
          return of(null);
        }

        return this.handleError('GetDashboard')(error);
      }),
    );
  }

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail:
        error?.error?.detail ||
        error?.error?.message ||
        error?.message ||
        'Unexpected error occurred.',
    });

    return throwError(() => error);
  };
}
