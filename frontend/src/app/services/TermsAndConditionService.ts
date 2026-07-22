import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CreateTermsAndConditionBulkRequest,
  CreateTermsAndConditionRequest,
  TermsAndConditionDto,
  UpdateTermsAndConditionRequest,
} from '../models/TermsAndCondition';
import { MessageService } from 'primeng/api';
import { Observable, retry, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';

@Injectable({
  providedIn: 'root',
})
export class TermsAndConditionService {
  url = environment.ApiBaseUrl + '/TermsAndCondition';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(
    query: GridifyQueryExtend,
  ): Observable<PagingContent<TermsAndConditionDto>> {
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
      .get<PagingContent<TermsAndConditionDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  Create(
    request: CreateTermsAndConditionRequest,
  ): Observable<TermsAndConditionDto> {
    return this.http
      .post<TermsAndConditionDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(
    request: UpdateTermsAndConditionRequest,
  ): Observable<TermsAndConditionDto> {
    return this.http
      .put<TermsAndConditionDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: id } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  CreateBulk(
    request: CreateTermsAndConditionBulkRequest,
  ): Observable<TermsAndConditionDto[]> {
    return this.http
      .post<TermsAndConditionDto[]>(`${this.url}/CreateBulk`, request)
      .pipe(retry(1), catchError(this.handleError('CreateBulk')));
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
