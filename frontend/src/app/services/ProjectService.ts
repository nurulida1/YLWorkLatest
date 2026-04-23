import { catchError, Observable, of, retry, throwError } from 'rxjs';
import {
  CreateProjectRequest,
  ProjectDropdownDto,
  ProjectDto,
  UpdateProjectRequest,
} from '../models/Project';
import {
  BaseResponse,
  GridifyQueryExtend,
  PagingContent,
} from '../shared/helpers/helpers';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment.development';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  url = environment.ApiBaseUrl + '/Project';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<ProjectDto>> {
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
      .get<PagingContent<ProjectDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<ProjectDto | null> {
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

    return this.http.get<ProjectDto>(this.url + '/GetOne', { params }).pipe(
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

  Create(request: CreateProjectRequest): Observable<ProjectDto> {
    return this.http
      .post<ProjectDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: UpdateProjectRequest): Observable<ProjectDto> {
    return this.http
      .put<ProjectDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(staff_id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: staff_id } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  GetDropdown(): Observable<ProjectDropdownDto> {
    return this.http
      .get<ProjectDropdownDto>(`${this.url}/GetDropdown`)
      .pipe(retry(1), catchError(this.handleError('GetDropdown')));
  }

  UpdateStatus(request: {
    projectId: string;
    status: string;
  }): Observable<ProjectDto> {
    return this.http
      .put<ProjectDto>(`${this.url}/UpdateStatus`, request)
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
