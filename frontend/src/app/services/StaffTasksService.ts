import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment';

import {
  CreateStaffTaskRequest,
  StaffTaskDto,
  UpdateStaffTaskRequest,
} from '../models/StaffTask';

import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';

import { Observable, retry, catchError, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StaffTaskService {
  url = environment.ApiBaseUrl + '/StaffTask';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<StaffTaskDto>> {
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
      .get<PagingContent<StaffTaskDto>>(`${this.url}/GetMany`, { params })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(id: string): Observable<StaffTaskDto | null> {
    const params = new HttpParams().set('filter', `Id=${id}`);

    return this.http.get<StaffTaskDto>(`${this.url}/GetOne`, { params }).pipe(
      retry(1),
      catchError((error) => {
        if (error.status === 404) {
          return of(null);
        }

        return this.handleError('GetOne')(error);
      }),
    );
  }

  Create(request: CreateStaffTaskRequest): Observable<StaffTaskDto> {
    return this.http
      .post<StaffTaskDto>(`${this.url}/Create`, request)
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: UpdateStaffTaskRequest): Observable<StaffTaskDto> {
    return this.http
      .put<StaffTaskDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, {
        params: { id },
      })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  GetDropdown(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/GetDropdown`)
      .pipe(retry(1), catchError(this.handleError('GetDropdown')));
  }

  Complete(request: { taskId: string; actualHours?: number }): Observable<any> {
    return this.http
      .put<any>(`${this.url}/Complete`, request)
      .pipe(retry(1), catchError(this.handleError('Complete')));
  }

  Reopen(request: { taskId: string }): Observable<any> {
    return this.http
      .put<any>(`${this.url}/Reopen`, request)
      .pipe(retry(1), catchError(this.handleError('Reopen')));
  }

  UpdateChecklist(request: any): Observable<any> {
    return this.http
      .put<any>(`${this.url}/UpdateChecklist`, request)
      .pipe(retry(1), catchError(this.handleError('UpdateChecklist')));
  }

  GetSummary(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/GetSummary`)
      .pipe(retry(1), catchError(this.handleError('GetSummary')));
  }

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail:
        error?.error?.detail ||
        error?.error?.message ||
        error?.message ||
        `Failed to ${context}.`,
    });

    return throwError(() => error);
  };
}
