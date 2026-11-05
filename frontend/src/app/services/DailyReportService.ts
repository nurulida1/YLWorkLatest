import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, retry, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';

import {
  DailyReportDto,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  DailyReportResponse,
  DailyReportStaffTaskDropdown,
} from '../models/DailyReport';

@Injectable({
  providedIn: 'root',
})
export class DailyReportService {
  url = environment.ApiBaseUrl + '/DailyReport';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  // ==========================================
  // GET: api/DailyReport/GetMyReports
  // ==========================================
  GetMyReports(): Observable<DailyReportDto[]> {
    return this.http
      .get<DailyReportDto[]>(`${this.url}/GetMyReports`)
      .pipe(retry(1), catchError(this.handleError('GetMyReports')));
  }

  // ==========================================
  // GET: api/DailyReport/GetById?id={id}
  // ==========================================
  GetById(id: string): Observable<DailyReportDto | null> {
    const params = new HttpParams().set('id', id);

    return this.http
      .get<DailyReportDto>(`${this.url}/GetById`, { params })
      .pipe(
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
  // POST: api/DailyReport/Create
  // ==========================================
  Create(request: CreateDailyReportRequest): Observable<DailyReportResponse> {
    return this.http
      .post<DailyReportResponse>(`${this.url}/Create`, request)
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  // ==========================================
  // PUT: api/DailyReport/Update
  // ==========================================
  Update(request: UpdateDailyReportRequest): Observable<DailyReportResponse> {
    return this.http
      .put<DailyReportResponse>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  // ==========================================
  // PUT: api/DailyReport/Submit?id={id}
  // ==========================================
  Submit(id: string): Observable<DailyReportResponse> {
    const params = new HttpParams().set('id', id);

    return this.http
      .put<DailyReportResponse>(`${this.url}/Submit`, null, { params })
      .pipe(retry(1), catchError(this.handleError('Submit')));
  }

  // ==========================================
  // PUT: api/DailyReport/Approve?id={id}
  // ==========================================
  Approve(id: string): Observable<DailyReportResponse> {
    const params = new HttpParams().set('id', id);

    return this.http
      .put<DailyReportResponse>(`${this.url}/Approve`, null, { params })
      .pipe(retry(1), catchError(this.handleError('Approve')));
  }

  // ==========================================
  // PUT: api/DailyReport/Reject?id={id}&remarks={remarks}
  // ==========================================
  Reject(id: string, remarks: string): Observable<DailyReportResponse> {
    const params = new HttpParams().set('id', id).set('remarks', remarks);

    return this.http
      .put<DailyReportResponse>(`${this.url}/Reject`, null, { params })
      .pipe(retry(1), catchError(this.handleError('Reject')));
  }

  // ==========================================
  // DELETE: api/DailyReport/Delete?id={id}
  // ==========================================
  Delete(id: string): Observable<DailyReportResponse> {
    const params = new HttpParams().set('id', id);

    return this.http
      .delete<DailyReportResponse>(`${this.url}/Delete`, { params })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  // ==========================================
  // GET: api/DailyReport/GetMyStaffTasks
  // ==========================================
  GetMyStaffTasks(projectId?: string | null) {
    let params = {};

    if (projectId) {
      params = { projectId };
    }

    return this.http.get<DailyReportStaffTaskDropdown[]>(
      `${this.url}/GetMyStaffTasks`,
      { params },
    );
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
        error?.message ||
        'Unexpected error occurred.',
    });

    return throwError(() => error);
  };
}
