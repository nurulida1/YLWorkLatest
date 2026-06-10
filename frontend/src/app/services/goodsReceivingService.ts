import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Observable, retry, catchError, of, throwError } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';
import { GoodsReceivingDto } from '../models/GoodsReceiving';

@Injectable({
  providedIn: 'root',
})
export class GoodsReceivingService {
  url = environment.ApiBaseUrl + '/GoodsReceiving';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(
    query: GridifyQueryExtend,
  ): Observable<PagingContent<GoodsReceivingDto>> {
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
      .get<PagingContent<GoodsReceivingDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<GoodsReceivingDto | null> {
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
      .get<GoodsReceivingDto>(this.url + '/GetOne', { params })
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

  Create(request: FormData): Observable<GoodsReceivingDto> {
    return this.http
      .post<GoodsReceivingDto>(`${this.url}/Create`, request)
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: FormData): Observable<GoodsReceivingDto> {
    return this.http
      .put<GoodsReceivingDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(id: string): Observable<BaseResponse> {
    const params = { id };

    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  UpdateStatus(payload: { id: string; status: string }): Observable<any> {
    return this.http
      .put<any>(`${this.url}/UpdateStatus`, payload)
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
  }

  GetDropdown(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/GetDropdown`)
      .pipe(retry(1), catchError(this.handleError('GetDropdown')));
  }

  GenerateNo() {
    return this.http.get<{ grnNo: string }>(`${this.url}/generate-no`);
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
