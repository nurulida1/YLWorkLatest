import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, retry, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  BaseResponse,
  GridifyQueryExtend,
  PagingContent,
} from '../shared/helpers/helpers';
import {
  CreateDeliveryOrderRequest,
  DeliveryOrderDto,
  UpdateDeliveryOrderRequest,
} from '../models/DeliveryOrder';

@Injectable({
  providedIn: 'root',
})
export class DeliveryOrderService {
  url = environment.ApiBaseUrl + '/DeliveryOrder';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(
    query: GridifyQueryExtend,
  ): Observable<PagingContent<DeliveryOrderDto>> {
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
      .get<PagingContent<DeliveryOrderDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<DeliveryOrderDto | null> {
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
      .get<DeliveryOrderDto>(this.url + '/GetOne', { params })
      .pipe(
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

  Create(request: FormData): Observable<DeliveryOrderDto> {
    return this.http
      .post<DeliveryOrderDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: FormData): Observable<DeliveryOrderDto> {
    return this.http
      .put<DeliveryOrderDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(id: string): Observable<BaseResponse> {
    const params = { id };

    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  UpdateStatus(id: string, status: string, proofImages: File[] = []) {
    const formData = new FormData();

    formData.append('id', id);
    formData.append('status', status);

    proofImages.forEach((file) => {
      formData.append('proofImages', file);
    });

    return this.http
      .put<any>(`${this.url}/UpdateStatus`, formData)
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
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
