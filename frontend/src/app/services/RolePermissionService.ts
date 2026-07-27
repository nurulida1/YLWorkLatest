import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import {
  CreateRolePermissionRequest,
  RolePermissionDto,
  UpdateRolePermissionRequest,
} from '../models/RolePermission';
import { Observable, retry, catchError, throwError, map } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';

@Injectable({
  providedIn: 'root',
})
export class RolePermissionService {
  url = environment.ApiBaseUrl + '/RolePermission';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(
    query: GridifyQueryExtend,
  ): Observable<PagingContent<RolePermissionDto>> {
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
      .get<PagingContent<RolePermissionDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetByMatrix(
    systemRole: string,
    departmentId: string | null,
  ): Observable<RolePermissionDto[]> {
    let params = new HttpParams().set('systemRole', systemRole);

    if (departmentId) {
      params = params.set('departmentId', departmentId);
    }

    return this.http
      .get<RolePermissionDto[] | Record<string, unknown>[]>(`${this.url}/by-matrix`, {
        params,
      })
      .pipe(
        map((rows) => (rows ?? []).map((r) => this.normalize(r))),
        retry(1),
        catchError(this.handleError('GetByMatrix')),
      );
  }

  BulkSave(request: Partial<RolePermissionDto>[]): Observable<any> {
    const payload = request.map((row) => ({
      id: row.id && row.id !== '00000000-0000-0000-0000-000000000000' ? row.id : null,
      systemRole: row.systemRole,
      departmentId: row.departmentId,
      systemModuleId: row.systemModuleId,
      canCreate: !!row.canCreate,
      canRead: !!row.canRead,
      canUpdate: !!row.canUpdate,
      canDelete: !!row.canDelete,
      canUpdateStatus: !!row.canUpdateStatus,
    }));

    return this.http
      .post<any>(`${this.url}/bulk-save`, payload)
      .pipe(retry(1), catchError(this.handleError('BulkSave')));
  }

  Create(request: CreateRolePermissionRequest): Observable<RolePermissionDto> {
    return this.http
      .post<RolePermissionDto>(`${this.url}/Create`, request)
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: UpdateRolePermissionRequest): Observable<RolePermissionDto> {
    return this.http
      .put<RolePermissionDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(staff_id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params: { id: staff_id } })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  private normalize(row: RolePermissionDto | Record<string, unknown>): RolePermissionDto {
    const r = row as Record<string, unknown>;
    const emptyId = '00000000-0000-0000-0000-000000000000';
    const id = String(r['id'] ?? r['Id'] ?? emptyId);
    const moduleId = String(
      r['systemModuleId'] ?? r['SystemModuleId'] ?? r['moduleId'] ?? r['ModuleId'] ?? '',
    );
    const departmentIdRaw = r['departmentId'] ?? r['DepartmentId'];
    return {
      id,
      systemRole: String(r['systemRole'] ?? r['SystemRole'] ?? ''),
      departmentId:
        departmentIdRaw == null || departmentIdRaw === ''
          ? null
          : String(departmentIdRaw),
      systemModuleId: moduleId,
      moduleName: String(r['moduleName'] ?? r['ModuleName'] ?? ''),
      moduleKey: String(r['moduleKey'] ?? r['ModuleKey'] ?? ''),
      canCreate: Boolean(r['canCreate'] ?? r['CanCreate'] ?? false),
      canRead: Boolean(r['canRead'] ?? r['CanRead'] ?? false),
      canUpdate: Boolean(r['canUpdate'] ?? r['CanUpdate'] ?? false),
      canDelete: Boolean(r['canDelete'] ?? r['CanDelete'] ?? false),
      canUpdateStatus: Boolean(r['canUpdateStatus'] ?? r['CanUpdateStatus'] ?? false),
    };
  }

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: `Error [${context}]`,
      detail:
        error?.error?.detail ||
        error?.error?.Message ||
        error?.message ||
        'Unexpected error occurred.',
    });
    return throwError(() => error);
  };
}
