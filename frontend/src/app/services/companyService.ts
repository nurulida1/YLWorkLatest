import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import {
  CompanyDto,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from '../models/Company';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, retry, catchError, throwError, of } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  url = environment.ApiBaseUrl + '/Company';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<CompanyDto>> {
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
      .get<PagingContent<CompanyDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<CompanyDto | null> {
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
    return this.http.get<CompanyDto>(`${this.url}/GetOne`, { params }).pipe(
      retry(1),
      catchError((error) => {
        if (error.status === 404) return of(null);
        return this.handleError('GetOne')(error);
      }),
    );
  }

  Create(request: CreateCompanyRequest): Observable<CompanyDto> {
    return this.http
      .post<CompanyDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: UpdateCompanyRequest): Observable<CompanyDto> {
    return this.http
      .put<CompanyDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(staff_id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: staff_id } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  ToggleStatus(clientId: string): Observable<{ id: string; status: string }> {
    const params = new HttpParams().set('id', clientId);
    return this.http
      .put<{ id: string; status: string }>(
        `${this.url}/ToggleStatus`,
        {}, // empty object instead of null
        { params },
      )
      .pipe(retry(1), catchError(this.handleError('ToggleStatus')));
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
