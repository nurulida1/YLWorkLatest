import { Injectable } from '@angular/core';
import {
  CreatePORequest,
  PurchaseOrderDto,
  UpdatePORequest,
} from '../models/PurchaseOrder';
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
export class PurchaseOrderService {
  url = environment.ApiBaseUrl + '/PurchaseOrder';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(
    query: GridifyQueryExtend,
  ): Observable<PagingContent<PurchaseOrderDto>> {
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
      .get<PagingContent<PurchaseOrderDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<PurchaseOrderDto | null> {
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
      .get<PurchaseOrderDto>(this.url + '/GetOne', { params })
      .pipe(
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

  Create(request: CreatePORequest): Observable<PurchaseOrderDto> {
    return this.http
      .post<PurchaseOrderDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: UpdatePORequest): Observable<PurchaseOrderDto> {
    return this.http
      .put<PurchaseOrderDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Preview(request: CreatePORequest | PurchaseOrderDto): Observable<any> {
    return this.http
      .post<any>(`${this.url}/Preview`, request)
      .pipe(retry(1), catchError(this.handleError('Preview')));
  }

  Delete(id: string): Observable<BaseResponse> {
    const params = { id };

    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  UpdateStatus(id: string, status: string): Observable<PurchaseOrderDto> {
    const request = {
      Id: id,
      Status: status,
    };

    return this.http
      .put<PurchaseOrderDto>(`${this.url}/UpdateStatus`, request)
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
