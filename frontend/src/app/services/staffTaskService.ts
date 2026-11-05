import { Injectable } from '@angular/core';
import {
  CreateStaffTaskRequest,
  StaffTask,
  StaffTaskSummary,
  UpdateChecklistOnlyRequest,
  UpdateStaffTaskRequest,
  CompleteStaffTaskRequest,
} from '../models/StaffTask';

import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Observable, of, throwError, catchError } from 'rxjs';

import { environment } from '../../environments/environment.development';

import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';

@Injectable({
  providedIn: 'root',
})
export class StaffTaskService {
  url = environment.ApiBaseUrl + '/StaffTask';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  // ==========================================
  // GET MANY
  // ==========================================

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<StaffTask>> {
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
      .get<PagingContent<StaffTask>>(`${this.url}/GetMany`, { params })
      .pipe(catchError(this.handleError('GetMany')));
  }

  // ==========================================
  // GET ONE
  // ==========================================

  GetOne(id: string): Observable<StaffTask | null> {
    const params = new HttpParams().set('id', id);

    return this.http.get<StaffTask>(`${this.url}/GetOne`, { params }).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of(null);
        }

        return this.handleError('GetOne')(error);
      }),
    );
  }

  // ==========================================
  // CREATE
  // ==========================================

  Create(request: CreateStaffTaskRequest): Observable<StaffTask> {
    return this.http
      .post<StaffTask>(`${this.url}/Create`, request)
      .pipe(catchError(this.handleError('Create')));
  }

  // ==========================================
  // UPDATE
  // ==========================================

  Update(request: UpdateStaffTaskRequest): Observable<StaffTask> {
    return this.http
      .put<StaffTask>(`${this.url}/Update`, request)
      .pipe(catchError(this.handleError('Update')));
  }

  // ==========================================
  // UPDATE CHECKLIST
  // ==========================================

  UpdateChecklist(request: UpdateChecklistOnlyRequest): Observable<StaffTask> {
    return this.http
      .put<StaffTask>(`${this.url}/UpdateChecklist`, request)
      .pipe(catchError(this.handleError('UpdateChecklist')));
  }

  // ==========================================
  // DELETE
  // ==========================================

  Delete(id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, {
        params: { id },
      })
      .pipe(catchError(this.handleError('Delete')));
  }

  // ==========================================
  // SUMMARY
  // ==========================================

  GetSummary(): Observable<StaffTaskSummary> {
    return this.http
      .get<StaffTaskSummary>(`${this.url}/GetSummary`)
      .pipe(catchError(this.handleError('GetSummary')));
  }

  // ==========================================
  // REOPEN
  // ==========================================

  Reopen(id: string): Observable<StaffTask> {
    return this.http
      .put<StaffTask>(`${this.url}/${id}/Reopen`, {})
      .pipe(catchError(this.handleError('Reopen')));
  }

  // ==========================================
  // COMPLETE
  // ==========================================

  Complete(id: string, actualHours?: number): Observable<StaffTask> {
    const request: CompleteStaffTaskRequest = {};

    if (actualHours != null) {
      request.actualHours = actualHours;
    }

    return this.http
      .put<StaffTask>(`${this.url}/${id}/Complete`, request)
      .pipe(catchError(this.handleError('Complete')));
  }

  // ==========================================
  // DROPDOWN
  // ==========================================

  GetDropdown(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/GetDropdown`)
      .pipe(catchError(this.handleError('GetDropdown')));
  }

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: `${context} Failed`,
      detail:
        error?.error?.detail ||
        error?.error?.message ||
        error?.message ||
        'Unexpected error occurred.',
    });

    return throwError(() => error);
  };
}
