import { Injectable } from '@angular/core';
import {
  CreateInventoryRequest,
  InventoryAuditDto,
  InventoryDropdownItem,
  InventoryDropdownResponse,
  InventoryDto,
  InventorySummary,
  UpdateInventoryRequest,
} from '../models/Inventory';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Observable, retry, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';
import { BaseOption } from '../models/BaseModel';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  url = environment.ApiBaseUrl + '/Inventory';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<InventoryDto>> {
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
      .get<PagingContent<InventoryDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(id: string): Observable<InventoryDto | null> {
    const params = new HttpParams().set('id', id);

    return this.http.get<InventoryDto>(this.url + '/GetOne', { params }).pipe(
      retry(1),
      catchError((error) => {
        if (error.status === 404) {
          return of(null);
        }
        return this.handleError('GetOne')(error);
      }),
    );
  }

  GetAudit(inventoryId: string, take = 10): Observable<InventoryAuditDto[]> {
    const params = new HttpParams()
      .set('inventoryId', inventoryId)
      .set('take', take.toString());

    return this.http
      .get<InventoryAuditDto[]>(`${this.url}/GetAudit`, { params })
      .pipe(retry(1), catchError(this.handleError('GetAudit')));
  }

  Create(formData: FormData): Observable<InventoryDto> {
    return this.http
      .post<InventoryDto>(`${this.url}/Create`, formData)
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(formData: FormData): Observable<InventoryDto> {
    return this.http
      .put<InventoryDto>(`${this.url}/Update`, formData)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: id } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  GetDropdown(): Observable<InventoryDropdownResponse> {
    return this.http
      .get<InventoryDropdownResponse>(`${this.url}/dropdowns`)
      .pipe(retry(1), catchError(this.handleError('dropdowns')));
  }

  GetSummary(): Observable<InventorySummary> {
    return this.http
      .get<InventorySummary>(`${this.url}/GetSummary`)
      .pipe(retry(1), catchError(this.handleError('GetSummary')));
  }

  GetRequestItems(): Observable<InventoryDropdownItem[]> {
    return this.http
      .get<InventoryDropdownItem[]>(`${this.url}/GetRequestItems`)
      .pipe(retry(1), catchError(this.handleError('GetRequestItems')));
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
