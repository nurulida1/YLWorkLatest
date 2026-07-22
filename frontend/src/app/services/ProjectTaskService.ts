import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import {
  CreateProjectTaskRequest,
  ProjectTaskCount,
  ProjectTaskDto,
  UpdateProjectTaskRequest,
} from '../models/ProjectTask';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Observable, retry, catchError, of, throwError } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';

@Injectable({
  providedIn: 'root',
})
export class ProjectTaskService {
  url = environment.ApiBaseUrl + '/ProjectTask';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(
    query: GridifyQueryExtend,
  ): Observable<PagingContent<ProjectTaskDto>> {
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
      .get<PagingContent<ProjectTaskDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(id: string): Observable<ProjectTaskDto | null> {
    let params = new HttpParams();

    if (id) {
      params = params.set('id', id);
    }

    return this.http.get<ProjectTaskDto>(this.url + '/GetOne', { params }).pipe(
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

  Create(request: CreateProjectTaskRequest): Observable<ProjectTaskDto> {
    return this.http
      .post<ProjectTaskDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: UpdateProjectTaskRequest): Observable<ProjectTaskDto> {
    return this.http
      .put<ProjectTaskDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(staff_id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: staff_id } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  GetDropdown(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/GetDropdown`)
      .pipe(retry(1), catchError(this.handleError('GetDropdown')));
  }

  UpdateStatus(request: {
    projectTaskId: string;
    status: string;
  }): Observable<ProjectTaskDto> {
    return this.http
      .put<ProjectTaskDto>(`${this.url}/UpdateStatus`, request)
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
  }

  UploadFile(request: { projectTaskId: string; file: File }): Observable<any> {
    const formData = new FormData();

    formData.append('projectTaskId', request.projectTaskId);
    formData.append('file', request.file);

    return this.http
      .post<any>(`${this.url}/UploadFile`, formData)
      .pipe(retry(1), catchError(this.handleError('UploadFile')));
  }

  GetCounts(): Observable<ProjectTaskCount | null> {
    return this.http.get<ProjectTaskCount>(this.url + '/GetCounts').pipe(
      retry(1),
      catchError((error) => {
        if (error.status === 404) {
          return of(null);
        } else {
          return this.handleError('GetCounts')(error);
        }
      }),
    );
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
