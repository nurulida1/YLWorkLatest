import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { MessageService } from 'primeng/api';
import { catchError, map, Observable, of, retry, throwError } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  BaseResponse,
  GridifyQueryExtend,
  PagingContent,
} from '../shared/helpers/helpers';
import { CreatePaymentRequest, PaymentDto } from '../models/Payments';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  url = environment.ApiBaseUrl + '/Payment';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<PaymentDto>> {
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
      .get<PagingContent<PaymentDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<PaymentDto | null> {
    let params = new HttpParams()
      .set('Page', query.Page.toString())
      .set('PageSize', query.PageSize.toString());

    if (query.Select) {
      params = params.set('Select', query.Select);
    }
    if (query.OrderBy) {
      params = params.set('OrderBy', query.OrderBy);
    }
    if (query.Filter) {
      params = params.set('Filter', query.Filter);
    }

    return this.http.get<PaymentDto>(this.url + '/GetOne', { params }).pipe(
      retry(1),
      catchError((error) => {
        if (error.status === 404) {
          // Return null gracefully when not found
          return of(null);
        } else {
          // Handle all other errors
          return this.handleError('GetOne')(error);
        }
      }),
    );
  }

  Create(request: CreatePaymentRequest): Observable<PaymentDto> {
    return this.http
      .post<PaymentDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Delete(paymentId: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: paymentId } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  // New: Fetch dashboard summary (role-based)
  GetDashboardSummary(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/DashboardSummary`)
      .pipe(retry(1), catchError(this.handleError('GetDashboardSummary')));
  }

  UpdateStatus(
    id: string,
    status: string,
    remarks?: string,
  ): Observable<PaymentDto> {
    const request = {
      Id: id,
      Status: status,
      Remarks: remarks || null,
    };

    return this.http
      .put<PaymentDto>(`${this.url}/UpdateStatus`, request)
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
  }

  ExportExcel(query: GridifyQueryExtend): Observable<Blob> {
    let params = new HttpParams()
      .set('page', query.Page.toString())
      .set('pageSize', query.PageSize.toString());

    if (query.Select) params = params.set('select', query.Select);
    if (query.OrderBy) params = params.set('orderBy', query.OrderBy);
    if (query.Filter) params = params.set('filter', query.Filter);
    if (query.Includes) params = params.set('includes', query.Includes);

    return this.http.get(`${this.url}/ExportExcel`, {
      params,
      responseType: 'blob', // important for files
    });
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
