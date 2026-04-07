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
  CreateMaterialRequest,
  MaterialRequestDto,
  UpdateMaterialRequest,
  UpdateMaterialRequestStatusDto,
} from '../models/MaterialRequest';

@Injectable({
  providedIn: 'root',
})
export class MaterialRequestService {
  url = environment.ApiBaseUrl + '/MaterialRequest';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(
    query: GridifyQueryExtend,
  ): Observable<PagingContent<MaterialRequestDto>> {
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
      .get<PagingContent<MaterialRequestDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<MaterialRequestDto | null> {
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
    if (query.Includes) {
      params = params.set('Includes', query.Includes);
    }

    return this.http
      .get<MaterialRequestDto>(this.url + '/GetOne', { params })
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

  GetDropdown(): Observable<any[]> {
    return this.http
      .get<any[]>(this.url + '/GetSelectOptions')
      .pipe(retry(1), catchError(this.handleError('GetSelectOptions')));
  }

  Create(request: CreateMaterialRequest): Observable<MaterialRequestDto> {
    return this.http
      .post<MaterialRequestDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: UpdateMaterialRequest): Observable<MaterialRequestDto> {
    return this.http
      .put<MaterialRequestDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: id } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  UpdateStatus(
    request: UpdateMaterialRequestStatusDto,
  ): Observable<MaterialRequestDto> {
    return this.http
      .put<MaterialRequestDto>(`${this.url}/UpdateStatus`, request)
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
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
