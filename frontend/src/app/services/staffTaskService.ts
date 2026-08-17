import { Injectable } from '@angular/core';
import {
  CreateStaffTaskRequest,
  StaffTask,
  StaffTaskSummary,
  UpdateChecklistOnlyRequest,
  UpdateStaffTaskRequest,
} from '../models/StaffTask';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Observable, retry, catchError, of, throwError } from 'rxjs';
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
      .get<PagingContent<StaffTask>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(id: string): Observable<StaffTask | null> {
    let params = new HttpParams();

    if (id) {
      params = params.set('id', id);
    }

    return this.http.get<StaffTask>(this.url + '/GetOne', { params }).pipe(
      retry(1),
      catchError((error) => {
        if (error.status === 404) {
          return of(null);
        } else {
          return this.handleError('GetOne')(error);
        }
      }),
    );
  }

  Create(request: CreateStaffTaskRequest): Observable<StaffTask> {
    return this.http
      .post<StaffTask>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: UpdateStaffTaskRequest): Observable<StaffTask> {
    return this.http
      .put<StaffTask>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  UpdateChecklist(request: UpdateChecklistOnlyRequest): Observable<StaffTask> {
    return this.http
      .put<StaffTask>(`${this.url}/UpdateChecklist`, request)
      .pipe(retry(1), catchError(this.handleError('UpdateChecklist')));
  }

  Delete(staff_id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: staff_id } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  GetSummary(): Observable<StaffTaskSummary> {
    return this.http
      .get<StaffTaskSummary>(`${this.url}/GetSummary`)
      .pipe(retry(1), catchError(this.handleError('GetSummary')));
  }

  Reopen(id: string): Observable<StaffTask> {
    return this.http
      .put<StaffTask>(`${this.url}/${id}/Reopen`, {})
      .pipe(retry(1), catchError(this.handleError('Reopen')));
  }

  Complete(id: string, actualHours?: number): Observable<StaffTask> {
    const request = actualHours != null ? { actualHours } : null;

    return this.http
      .put<StaffTask>(`${this.url}/${id}/Complete`, request)
      .pipe(retry(1), catchError(this.handleError('Complete')));
  }

  GetDropdown(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/GetDropdown`)
      .pipe(retry(1), catchError(this.handleError('GetDropdown')));
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
