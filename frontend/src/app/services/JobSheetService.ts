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
import {
  CreateJobSheetRequest,
  JobSheetDto,
  UpdateJobSheetRequest,
} from '../models/JobSheets';

@Injectable({
  providedIn: 'root',
})
export class JobSheetService {
  url = environment.ApiBaseUrl + '/JobSheet';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<JobSheetDto>> {
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
      .get<PagingContent<JobSheetDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(id: string): Observable<JobSheetDto | null> {
    let params = new HttpParams();

    if (id) {
      params = params.set('id', id);
    }

    return this.http.get<JobSheetDto>(this.url + '/GetOne', { params }).pipe(
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

  Create(request: FormData): Observable<JobSheetDto> {
    return this.http
      .post<JobSheetDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: FormData): Observable<JobSheetDto> {
    return this.http
      .put<JobSheetDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(staff_id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: staff_id } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  UpdateStatus(request: {
    jobSheetId: string;
    status: string;
  }): Observable<JobSheetDto> {
    return this.http
      .put<JobSheetDto>(`${this.url}/UpdateStatus`, request)
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
  }

  ExportToExcel(): Observable<Blob> {
    return this.http.get(`${this.url}/Export`, {
      responseType: 'blob',
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
