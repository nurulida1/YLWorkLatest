import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { SalesOrderDto } from '../models/SalesOrder';
import { Observable, retry, catchError, of, throwError } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';

@Injectable({
  providedIn: 'root',
})
export class SalesOrderService {
  url = environment.ApiBaseUrl + '/SalesOrder';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<SalesOrderDto>> {
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
      .get<PagingContent<SalesOrderDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<SalesOrderDto | null> {
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

    return this.http.get<SalesOrderDto>(this.url + '/GetOne', { params }).pipe(
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

  Create(request: FormData): Observable<SalesOrderDto> {
    return this.http
      .post<SalesOrderDto>(`${this.url}/Create`, request)
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: FormData): Observable<SalesOrderDto> {
    return this.http
      .put<SalesOrderDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(id: string): Observable<BaseResponse> {
    const params = { id };

    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  UpdateStatus(payload: {
    id: string;
    status: string;
    remarks?: string;
  }): Observable<any> {
    return this.http
      .put<any>(`${this.url}/UpdateStatus`, payload)
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
  }

  Approve(payload: { id: string; remarks?: string | null }): Observable<any> {
    return this.http
      .put<any>(`${this.url}/Approve`, payload)
      .pipe(retry(1), catchError(this.handleError('Approve')));
  }

  Reject(payload: { id: string; remarks: string | null }): Observable<any> {
    return this.http
      .put<any>(`${this.url}/Reject`, payload)
      .pipe(retry(1), catchError(this.handleError('Reject')));
  }

  GetDropdown(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/GetDropdown`)
      .pipe(retry(1), catchError(this.handleError('GetDropdown')));
  }

  GenerateNo() {
    return this.http.get<{ salesOrderNo: string }>(`${this.url}/generate-no`);
  }

  GenerateDO(salesOrderId: string): Observable<any> {
    return this.http
      .post<any>(`${this.url}/GenerateDO/${salesOrderId}`, {})
      .pipe(retry(1), catchError(this.handleError('GenerateDO')));
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
