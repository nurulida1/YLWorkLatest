import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import {
  CreateDeliveryOrderRMARequest,
  DeliveryOrderRMA,
  UpdateDeliveryOrderRMARequest,
} from '../models/DeliveryOrderRMA';
import { Observable, retry, catchError, of, throwError } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';

@Injectable({
  providedIn: 'root',
})
export class DeliveryOrderRMAService {
  url = environment.ApiBaseUrl + '/DeliveryOrderRMA';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(
    query: GridifyQueryExtend,
  ): Observable<PagingContent<DeliveryOrderRMA>> {
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
      .get<PagingContent<DeliveryOrderRMA>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<DeliveryOrderRMA | null> {
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
      .get<DeliveryOrderRMA>(this.url + '/GetOne', { params })
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

  Create(request: CreateDeliveryOrderRMARequest): Observable<DeliveryOrderRMA> {
    return this.http
      .post<DeliveryOrderRMA>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: UpdateDeliveryOrderRMARequest): Observable<DeliveryOrderRMA> {
    return this.http
      .put<DeliveryOrderRMA>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(id: string): Observable<BaseResponse> {
    const params = { id };

    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  UpdateStatus(
    id: string,
    status: string,
    reviewerUserId: string | null = null,
    proofImages: File[] = [],
    remarks: string | null = null,
  ) {
    const formData = new FormData();

    formData.append('id', id);
    formData.append('status', status);

    if (reviewerUserId) {
      formData.append('reviewerUserId', reviewerUserId);
    }

    if (remarks) {
      formData.append('remarks', remarks);
    }

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

  GenerateNo() {
    return this.http.get<{ rmaNo: string }>(`${this.url}/generate-no`);
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
