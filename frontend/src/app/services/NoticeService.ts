import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import { CreateNoticeRequest, UpdateNoticeRequest } from '../models/Notice';

@Injectable({
  providedIn: 'root',
})
export class NoticeService {
  url = environment.ApiBaseUrl + '/Notice';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(params: {
    Page?: number;
    PageSize?: number;
    Filter?: string | null;
    OrderBy?: string | null;
  }) {
    return this.http
      .get<any>(`${this.url}/GetMany`, {
        params: {
          page: params.Page ?? 1,
          pageSize: params.PageSize ?? 10,
          filter: params.Filter ?? '',
          orderBy: params.OrderBy ?? '',
        },
      })
      .pipe(catchError(this.handleError('load notices')));
  }

  GetOne(id: string) {
    return this.http
      .get<any>(`${this.url}/GetOne`, {
        params: { id },
      })
      .pipe(catchError(this.handleError('load notice')));
  }

  Create(data: CreateNoticeRequest) {
    return this.http
      .post<any>(`${this.url}/Create`, data)
      .pipe(catchError(this.handleError('create notice')));
  }

  Update(data: UpdateNoticeRequest) {
    return this.http
      .put<any>(`${this.url}/Update`, data)
      .pipe(catchError(this.handleError('update notice')));
  }

  Delete(id: string) {
    return this.http
      .delete<any>(`${this.url}/Delete`, {
        params: { id },
      })
      .pipe(catchError(this.handleError('delete notice')));
  }

  ToggleStatus(id: string) {
    return this.http
      .put<any>(
        `${this.url}/ToggleStatus`,
        {},
        {
          params: { id },
        },
      )
      .pipe(catchError(this.handleError('update notice status')));
  }

  TogglePin(id: string) {
    return this.http
      .put<any>(
        `${this.url}/TogglePin`,
        {},
        {
          params: { id },
        },
      )
      .pipe(catchError(this.handleError('update notice pin')));
  }

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail:
        error?.error?.detail ||
        error?.error?.Error ||
        error?.message ||
        `Failed to ${context}.`,
    });

    return throwError(() => error);
  };
}
