import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Observable, retry, catchError, of, map, throwError } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';
import {
  CreateDeliveryRequest,
  DeliveryDto,
  UpdateDeliveryRequest,
} from '../models/Delivery';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  url = environment.ApiBaseUrl + '/Deliveries';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<DeliveryDto>> {
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
      .get<PagingContent<DeliveryDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<DeliveryDto | null> {
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
      .get<{ data: DeliveryDto }>(this.url + '/GetOne', { params })
      .pipe(
        retry(1),
        catchError(this.handleError('Create')),
        map((res) => res?.data),
      );
  }

  Create(request: CreateDeliveryRequest): Observable<DeliveryDto> {
    return this.http
      .post<{ data: DeliveryDto }>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(
        retry(1),
        catchError(this.handleError('Create')),
        map((res) => res?.data),
      );
  }

  Update(request: UpdateDeliveryRequest): Observable<DeliveryDto> {
    return this.http
      .put<{ Data: DeliveryDto }>(`${this.url}/Update`, request)
      .pipe(
        retry(1),
        catchError(this.handleError('Update')),
        map((res) => res?.Data),
      );
  }

  Delete(staff_id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete/${staff_id}`)
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  UpdateStatus(
    id: string,
    status: 'shipped' | 'received' | 'cancelled',
  ): Observable<{ success: boolean; data: DeliveryDto | any }> {
    const params = new HttpParams()
      .set('id', id.toString())
      .set('newStatus', status);

    return this.http
      .put<{ success: boolean; data: any }>(`${this.url}/UpdateStatus`, null, {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
  }

  CountSummary(): Observable<{
    total: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
  }> {
    return this.http
      .get<{
        total: number;
        pending: number;
        confirmed: number;
        shipped: number;
        delivered: number;
      }>(this.url + '/CountSummary', {})
      .pipe(retry(1), catchError(this.handleError('CountSummary')));
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
