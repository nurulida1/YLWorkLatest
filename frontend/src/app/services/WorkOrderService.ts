import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry, catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

import {
  WorkOrderDto,
  CreateWorkOrderRequest,
  UpdateWorkOrderRequest,
  UpdateWorkOrderStatusRequest,
  UpdateWorkOrderChecklistStatusRequest,
  WorkOrderDropdownDto,
  WorkOrderPagingContent,
} from '../models/WorkOrder';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WorkOrderService {
  private readonly url = `${environment.ApiBaseUrl}/WorkOrder`;

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: context,
      detail:
        error?.error?.detail ||
        error?.error?.message ||
        error?.error?.error ||
        error?.message ||
        'Unexpected error occurred.',
    });

    return throwError(() => error);
  };

  // =====================================================
  // FORM DATA BUILDER
  // =====================================================

  private buildFormData(
    request: CreateWorkOrderRequest | UpdateWorkOrderRequest,
  ): FormData {
    const formData = new FormData();

    const appendValue = (key: string, value: any) => {
      if (value === null || value === undefined || value === '') {
        return;
      }

      if (value instanceof Date) {
        formData.append(key, value.toISOString());
        return;
      }

      formData.append(key, String(value));
    };

    // BASIC INFORMATION
    appendValue('Id', 'id' in request ? request.id : null);
    appendValue('ProjectId', request.projectId);
    appendValue('Title', request.title);
    appendValue('Description', request.description);
    appendValue('WorkType', request.workType);
    appendValue('Priority', request.priority);
    appendValue('Status', request.status);
    appendValue('Location', request.location);
    appendValue('ScopeOfWork', request.scopeOfWork);
    appendValue('Remarks', request.remarks);

    // SCHEDULE
    appendValue('ScheduledDate', request.scheduledDate);
    appendValue('DueDate', request.dueDate);

    // ASSIGNMENT
    appendValue('AssignedToId', request.assignedToId);

    // MEMBERS
    request.workOrderMembers?.forEach((memberId) => {
      formData.append('WorkOrderMembers', memberId);
    });

    // CHECKLISTS
    request.checklists?.forEach((checklist, index) => {
      formData.append(`Checklists[${index}].Title`, checklist.title);

      formData.append(
        `Checklists[${index}].Sequence`,
        String(checklist.sequence),
      );
    });

    // FILE ATTACHMENTS
    request.files?.forEach((file) => {
      formData.append('Files', file, file.name);
    });

    return formData;
  }

  // =====================================================
  // GET MANY
  // =====================================================

  GetMany(query: {
    Page: number;
    PageSize: number;
    ProjectId?: string;
    Search?: string;
    Status?: string;
    Priority?: string;
    WorkType?: string;
    AssignedToId?: string;
    OrderBy?: string;
  }): Observable<WorkOrderPagingContent> {
    let params = new HttpParams()
      .set('page', query.Page.toString())
      .set('pageSize', query.PageSize.toString());

    if (query.ProjectId) {
      params = params.set('projectId', query.ProjectId);
    }

    if (query.Search) {
      params = params.set('search', query.Search);
    }

    if (query.Status) {
      params = params.set('status', query.Status);
    }

    if (query.Priority) {
      params = params.set('priority', query.Priority);
    }

    if (query.WorkType) {
      params = params.set('workType', query.WorkType);
    }

    if (query.AssignedToId) {
      params = params.set('assignedToId', query.AssignedToId);
    }

    if (query.OrderBy) {
      params = params.set('orderBy', query.OrderBy);
    }

    return this.http
      .get<WorkOrderPagingContent>(`${this.url}/GetMany`, {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('Get Work Orders')));
  }

  // =====================================================
  // GET ONE
  // =====================================================

  GetOne(id: string): Observable<WorkOrderDto> {
    const params = new HttpParams().set('id', id);

    return this.http
      .get<WorkOrderDto>(`${this.url}/GetOne`, {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('Get Work Order')));
  }

  // =====================================================
  // CREATE
  // =====================================================

  Create(request: CreateWorkOrderRequest): Observable<any> {
    const formData = this.buildFormData(request);

    return this.http
      .post(`${this.url}/Create`, formData)
      .pipe(catchError(this.handleError('Create Work Order')));
  }

  // =====================================================
  // UPDATE
  // =====================================================

  Update(request: UpdateWorkOrderRequest): Observable<WorkOrderDto> {
    const formData = this.buildFormData(request);

    return this.http
      .put<WorkOrderDto>(`${this.url}/Update`, formData)
      .pipe(catchError(this.handleError('Update Work Order')));
  }

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  UpdateStatus(
    request: UpdateWorkOrderStatusRequest,
  ): Observable<WorkOrderDto> {
    return this.http
      .put<WorkOrderDto>(`${this.url}/UpdateStatus`, request)
      .pipe(catchError(this.handleError('Update Work Order Status')));
  }

  // =====================================================
  // UPDATE CHECKLIST STATUS
  // =====================================================

  UpdateChecklistStatus(
    request: UpdateWorkOrderChecklistStatusRequest,
  ): Observable<WorkOrderDto> {
    return this.http
      .put<WorkOrderDto>(`${this.url}/UpdateChecklistStatus`, request)
      .pipe(catchError(this.handleError('Update Checklist')));
  }

  // =====================================================
  // DELETE
  // =====================================================

  Delete(id: string): Observable<any> {
    const params = new HttpParams().set('id', id);

    return this.http
      .delete(`${this.url}/Delete`, {
        params,
      })
      .pipe(catchError(this.handleError('Delete Work Order')));
  }

  // =====================================================
  // DROPDOWN
  // =====================================================

  GetDropdown(projectId?: string): Observable<WorkOrderDropdownDto> {
    let params = new HttpParams();

    if (projectId) {
      params = params.set('projectId', projectId);
    }

    return this.http
      .get<WorkOrderDropdownDto>(`${this.url}/GetDropdown`, { params })
      .pipe(retry(1), catchError(this.handleError('Get Work Order Dropdown')));
  }

  // =====================================================
  // NEXT WORK ORDER NUMBER
  // =====================================================

  GetNextWorkOrderNo(): Observable<{ workOrderNo: string }> {
    return this.http
      .get<{ workOrderNo: string }>(`${this.url}/GetNextWorkOrderNo`)
      .pipe(
        retry(1),
        catchError(this.handleError('Generate Work Order Number')),
      );
  }
}
