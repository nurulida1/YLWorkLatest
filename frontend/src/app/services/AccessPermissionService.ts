import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { MessageService } from 'primeng/api';
import {
  AccessPermissionDto,
  CreateAccessPermissionRequest,
  UpdateAccessPermissionRequest,
} from '../models/AccessPermission';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry, catchError, throwError } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';

@Injectable({
  providedIn: 'root',
})
export class AccessPermissionService {
  url = environment.ApiBaseUrl + '/AccessPermission';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(
    query: GridifyQueryExtend,
  ): Observable<PagingContent<AccessPermissionDto>> {
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
      .get<PagingContent<AccessPermissionDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  Create(
    request: CreateAccessPermissionRequest,
  ): Observable<AccessPermissionDto> {
    return this.http
      .post<AccessPermissionDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(
    request: UpdateAccessPermissionRequest,
  ): Observable<AccessPermissionDto> {
    return this.http
      .put<AccessPermissionDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(staff_id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: staff_id } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
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
