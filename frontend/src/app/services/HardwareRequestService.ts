import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, retry, catchError, of, throwError } from 'rxjs';

import { environment } from '../../environments/environment.development';

import {
  CreateHardwareRequest,
  ApproveHardwareRequest,
  RejectHardwareRequest,
  AssignHardwareRequest,
  IssueHardwareRequest,
  UpdateHardwareRequestStatus,
  HardwareRequestApiResponse,
  HardwareRequestDto,
} from '../models/HardwareRequest';

@Injectable({
  providedIn: 'root',
})
export class HardwareRequestService {
  url = environment.ApiBaseUrl + '/HardwareRequest';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  // ==========================================
  // POST: api/HardwareRequest/Create
  // ==========================================
  Create(
    request: CreateHardwareRequest,
  ): Observable<HardwareRequestApiResponse> {
    return this.http
      .post<HardwareRequestApiResponse>(`${this.url}/Create`, request)
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  // ==========================================
  // GET: api/HardwareRequest/MyRequests
  // ==========================================
  GetMyRequests(): Observable<HardwareRequestDto[]> {
    return this.http
      .get<HardwareRequestDto[]>(`${this.url}/MyRequests`)
      .pipe(retry(1), catchError(this.handleError('GetMyRequests')));
  }

  // ==========================================
  // GET: api/HardwareRequest/All
  // ==========================================
  GetAll(): Observable<HardwareRequestDto[]> {
    return this.http
      .get<HardwareRequestDto[]>(`${this.url}/All`)
      .pipe(retry(1), catchError(this.handleError('GetAll')));
  }

  // ==========================================
  // GET: api/HardwareRequest/{id}
  // ==========================================
  GetById(id: string): Observable<HardwareRequestDto | null> {
    return this.http.get<HardwareRequestDto>(`${this.url}/${id}`).pipe(
      retry(1),
      catchError((error) => {
        if (error.status === 404) {
          return of(null);
        }

        return this.handleError('GetById')(error);
      }),
    );
  }

  // ==========================================
  // POST: api/HardwareRequest/{id}/Approve
  // ==========================================
  Approve(
    id: string,
    request: ApproveHardwareRequest,
  ): Observable<HardwareRequestApiResponse> {
    return this.http
      .post<HardwareRequestApiResponse>(`${this.url}/${id}/Approve`, request)
      .pipe(retry(1), catchError(this.handleError('Approve')));
  }

  // ==========================================
  // POST: api/HardwareRequest/{id}/Reject
  // ==========================================
  Reject(
    id: string,
    request: RejectHardwareRequest,
  ): Observable<HardwareRequestApiResponse> {
    return this.http
      .post<HardwareRequestApiResponse>(`${this.url}/${id}/Reject`, request)
      .pipe(retry(1), catchError(this.handleError('Reject')));
  }

  // ==========================================
  // POST: api/HardwareRequest/{id}/Assign
  // ==========================================
  Assign(
    id: string,
    request: AssignHardwareRequest,
  ): Observable<HardwareRequestApiResponse> {
    return this.http
      .post<HardwareRequestApiResponse>(`${this.url}/${id}/Assign`, request)
      .pipe(retry(1), catchError(this.handleError('Assign')));
  }

  // ==========================================
  // POST: api/HardwareRequest/{id}/Issue
  // ==========================================
  Issue(
    id: string,
    request: IssueHardwareRequest,
  ): Observable<HardwareRequestApiResponse> {
    return this.http
      .post<HardwareRequestApiResponse>(`${this.url}/${id}/Issue`, request)
      .pipe(retry(1), catchError(this.handleError('Issue')));
  }

  // ==========================================
  // POST: api/HardwareRequest/{id}/UpdateStatus
  // ==========================================
  UpdateStatus(
    id: string,
    request: UpdateHardwareRequestStatus,
  ): Observable<HardwareRequestApiResponse> {
    return this.http
      .post<HardwareRequestApiResponse>(
        `${this.url}/${id}/UpdateStatus`,
        request,
      )
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
  }

  // ==========================================
  // POST: api/HardwareRequest/{id}/Cancel
  // ==========================================
  Cancel(id: string): Observable<HardwareRequestApiResponse> {
    return this.http
      .post<HardwareRequestApiResponse>(`${this.url}/${id}/Cancel`, null)
      .pipe(retry(1), catchError(this.handleError('Cancel')));
  }

  GetPendingApprovals(): Observable<HardwareRequestDto[]> {
    return this.http
      .get<HardwareRequestDto[]>(`${this.url}/PendingApprovals`)
      .pipe(retry(1), catchError(this.handleError('GetPendingApprovals')));
  }

  // ==========================================
  // ERROR HANDLER
  // ==========================================
  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail:
        error?.error?.detail ||
        error?.error?.Error ||
        error?.error?.message ||
        error?.message ||
        `Unexpected error occurred in ${context}.`,
    });

    return throwError(() => error);
  };
}
