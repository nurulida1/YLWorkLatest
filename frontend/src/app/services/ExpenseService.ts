import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import {
  BaseResponse,
  GridifyQueryExtend,
  PagingContent,
} from '../shared/helpers/helpers';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { CreateExpenseRequest, ExpenseDto } from '../models/Expense';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  url = environment.ApiBaseUrl + '/Expense';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<ExpenseDto>> {
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
      .get<PagingContent<ExpenseDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  Create(request: CreateExpenseRequest): Observable<ExpenseDto> {
    return this.http
      .post<ExpenseDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Delete(id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: id } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
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
