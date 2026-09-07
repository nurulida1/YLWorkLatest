import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  ApproveRejectLeaveDto,
  CancelLeaveDto,
  CreateLeaveRequestDto,
  LeaveApprovalChainStepDto,
  LeaveBalanceAllocationDto,
  LeaveCalendarEventDto,
  LeaveCalendarFilters,
  LeaveCalendarResponseDto,
  LeaveRequestDto,
} from '../models/Leave';

@Injectable({ providedIn: 'root' })
export class LeaveRequestService {
  private readonly url = environment.ApiBaseUrl + '/LeaveRequests';

  constructor(private http: HttpClient) {}

  getAll(employeeId?: string): Observable<LeaveRequestDto[]> {
    const options = employeeId ? { params: { employeeId } } : {};
    return this.http
      .get<LeaveRequestDto[] | Record<string, unknown>[]>(this.url, options)
      .pipe(map((rows) => (rows ?? []).map((r) => this.normalizeRequest(r))));
  }

  getById(id: string): Observable<LeaveRequestDto> {
    return this.http
      .get<LeaveRequestDto | Record<string, unknown>>(`${this.url}/${id}`)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  getCalendar(
    from: string,
    to: string,
    filters?: LeaveCalendarFilters,
  ): Observable<LeaveCalendarResponseDto> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (filters?.departmentId) {
      params = params.set('departmentId', filters.departmentId);
    }
    if (filters?.leaveTypeId) {
      params = params.set('leaveTypeId', filters.leaveTypeId);
    }
    return this.http
      .get<LeaveCalendarResponseDto | Record<string, unknown>>(`${this.url}/calendar`, { params })
      .pipe(map((r) => this.normalizeCalendar(r)));
  }

  submit(dto: CreateLeaveRequestDto): Observable<LeaveRequestDto> {
    return this.http
      .post<LeaveRequestDto | Record<string, unknown>>(this.url, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  update(id: string, dto: CreateLeaveRequestDto): Observable<LeaveRequestDto> {
    return this.http
      .put<LeaveRequestDto | Record<string, unknown>>(`${this.url}/${id}`, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  approve(id: string, dto: ApproveRejectLeaveDto): Observable<LeaveRequestDto> {
    return this.http
      .post<LeaveRequestDto | Record<string, unknown>>(`${this.url}/${id}/approve`, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  /** HR finalize: approve without forwarding to further managers (must be eligible). */
  finalize(id: string, dto: ApproveRejectLeaveDto): Observable<LeaveRequestDto> {
    return this.http
      .post<LeaveRequestDto | Record<string, unknown>>(`${this.url}/${id}/finalize`, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  reject(id: string, dto: ApproveRejectLeaveDto): Observable<LeaveRequestDto> {
    return this.http
      .post<LeaveRequestDto | Record<string, unknown>>(`${this.url}/${id}/reject`, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  cancel(id: string, dto: CancelLeaveDto): Observable<LeaveRequestDto> {
    return this.http
      .post<LeaveRequestDto | Record<string, unknown>>(`${this.url}/${id}/cancel`, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  uploadDocument(id: string, file: File): Observable<{ fileUrl: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ fileUrl: string }>(
      `${this.url}/${id}/document`,
      form,
    );
  }

  /** Pending requests where the current user is the active HOD in the approval chain. */
  getPendingForHod(hodId: string): Observable<LeaveRequestDto[]> {
    return this.http
      .get<LeaveRequestDto[] | Record<string, unknown>[]>(
        `${this.url}/pending/hod/${hodId}`,
      )
      .pipe(map((rows) => (rows ?? []).map((r) => this.normalizeRequest(r))));
  }

  /** @deprecated Use getPendingForHod — leave uses HodId chain, not ManagerId. */
  getPendingForManager(managerId: string): Observable<LeaveRequestDto[]> {
    return this.getPendingForHod(managerId);
  }

  private normalizeCalendar(row: LeaveCalendarResponseDto | Record<string, unknown>): LeaveCalendarResponseDto {
    const r = row as Record<string, unknown>;
    const rawEvents = r['events'] ?? r['Events'];
    const events = Array.isArray(rawEvents)
      ? rawEvents.map((e) => this.normalizeCalendarEvent(e))
      : [];
    return {
      canViewDetails: Boolean(r['canViewDetails'] ?? r['CanViewDetails'] ?? false),
      events,
    };
  }

  private normalizeCalendarEvent(row: unknown): LeaveCalendarEventDto {
    const r = (row ?? {}) as Record<string, unknown>;
    const leaveTypeId = r['leaveTypeId'] ?? r['LeaveTypeId'];
    return {
      requestId: String(r['requestId'] ?? r['RequestId'] ?? ''),
      employeeId: String(r['employeeId'] ?? r['EmployeeId'] ?? ''),
      employeeName: String(r['employeeName'] ?? r['EmployeeName'] ?? ''),
      startDate: String(r['startDate'] ?? r['StartDate'] ?? ''),
      endDate: String(r['endDate'] ?? r['EndDate'] ?? ''),
      leaveTypeId: leaveTypeId != null && leaveTypeId !== '' ? String(leaveTypeId) : undefined,
      leaveTypeName: (r['leaveTypeName'] ?? r['LeaveTypeName']) as string | undefined,
      reason: (r['reason'] ?? r['Reason']) as string | undefined,
      totalDays: (() => {
        const v = r['totalDays'] ?? r['TotalDays'];
        return v == null || v === '' ? undefined : Number(v);
      })(),
      startSession: (r['startSession'] ?? r['StartSession']) as string | undefined,
      endSession: (r['endSession'] ?? r['EndSession']) as string | undefined,
      canViewDetails: Boolean(r['canViewDetails'] ?? r['CanViewDetails'] ?? false),
    };
  }

  private normalizeRequest(row: LeaveRequestDto | Record<string, unknown>): LeaveRequestDto {
    const r = row as Record<string, unknown>;
    return {
      requestId: String(r['requestId'] ?? r['RequestId'] ?? ''),
      employeeId: String(r['employeeId'] ?? r['EmployeeId'] ?? ''),
      employeeName: String(r['employeeName'] ?? r['EmployeeName'] ?? ''),
      leaveTypeId: String(r['leaveTypeId'] ?? r['LeaveTypeId'] ?? ''),
      leaveTypeName: String(r['leaveTypeName'] ?? r['LeaveTypeName'] ?? ''),
      startDate: String(r['startDate'] ?? r['StartDate'] ?? ''),
      endDate: String(r['endDate'] ?? r['EndDate'] ?? ''),
      totalDays: Number(r['totalDays'] ?? r['TotalDays'] ?? 0),
      startSession: String(r['startSession'] ?? r['StartSession'] ?? 'Full'),
      endSession: String(r['endSession'] ?? r['EndSession'] ?? 'Full'),
      reason: String(r['reason'] ?? r['Reason'] ?? ''),
      status: String(r['status'] ?? r['Status'] ?? ''),
      isEmergency: Boolean(r['isEmergency'] ?? r['IsEmergency'] ?? false),
      isUnpaid: Boolean(r['isUnpaid'] ?? r['IsUnpaid'] ?? false),
      isShortNoticeAnnual: this.toFlag(r['isShortNoticeAnnual'] ?? r['IsShortNoticeAnnual']),
      conflictOverride: Boolean(r['conflictOverride'] ?? r['ConflictOverride'] ?? false),
      submittedAt: String(r['submittedAt'] ?? r['SubmittedAt'] ?? ''),
      conflictWarning: (r['conflictWarning'] ?? r['ConflictWarning']) as string | undefined,
      remainingBalance: (r['remainingBalance'] ?? r['RemainingBalance']) as number | undefined,
      balanceSufficient: (r['balanceSufficient'] ?? r['BalanceSufficient']) as boolean | undefined,
      requiresBalanceCascadeAccept: Boolean(
        r['requiresBalanceCascadeAccept'] ?? r['RequiresBalanceCascadeAccept'] ?? false,
      ),
      balanceAllocations: this.normalizeAllocations(
        r['balanceAllocations'] ?? r['BalanceAllocations'],
      ),
      balanceOptions: (r['balanceOptions'] ?? r['BalanceOptions']) as string[] | undefined,
      rejectionReason: (r['rejectionReason'] ?? r['RejectionReason']) as string | undefined,
      documentUrl: (r['documentUrl'] ?? r['DocumentUrl']) as string | undefined,
      documentFileName: (r['documentFileName'] ?? r['DocumentFileName']) as string | undefined,
      currentApproverId: (r['currentApproverId'] ?? r['CurrentApproverId']) as string | undefined,
      currentApproverIds: (() => {
        const raw = r['currentApproverIds'] ?? r['CurrentApproverIds'];
        if (!Array.isArray(raw)) return [];
        return raw.map((x) => String(x)).filter(Boolean);
      })(),
      noApproverAssigned: Boolean(r['noApproverAssigned'] ?? r['NoApproverAssigned'] ?? false),
      approvalChain: this.normalizeApprovalChain(r['approvalChain'] ?? r['ApprovalChain']),
    };
  }

  private normalizeApprovalChain(raw: unknown): LeaveApprovalChainStepDto[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item, index) => {
      const s = (item ?? {}) as Record<string, unknown>;
      const approverId = s['approverId'] ?? s['ApproverId'];
      const decidedAt = s['decidedAt'] ?? s['DecidedAt'];
      return {
        stepOrder: Number(s['stepOrder'] ?? s['StepOrder'] ?? index + 1),
        approverId: approverId != null && approverId !== '' ? String(approverId) : undefined,
        approverName: String(s['approverName'] ?? s['ApproverName'] ?? ''),
        status: String(s['status'] ?? s['Status'] ?? 'Waiting'),
        decidedAt: decidedAt != null && decidedAt !== '' ? String(decidedAt) : undefined,
        rejectionReason: (s['rejectionReason'] ?? s['RejectionReason']) as string | undefined,
        isFinalStep: Boolean(s['isFinalStep'] ?? s['IsFinalStep'] ?? false),
      };
    });
  }

  private normalizeAllocations(raw: unknown): LeaveBalanceAllocationDto[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item, index) => {
      const a = (item ?? {}) as Record<string, unknown>;
      return {
        leaveTypeId: String(a['leaveTypeId'] ?? a['LeaveTypeId'] ?? ''),
        leaveTypeName: String(a['leaveTypeName'] ?? a['LeaveTypeName'] ?? ''),
        days: Number(a['days'] ?? a['Days'] ?? 0),
        sortOrder: Number(a['sortOrder'] ?? a['SortOrder'] ?? index),
        isUnpaidBucket: Boolean(a['isUnpaidBucket'] ?? a['IsUnpaidBucket'] ?? false),
      };
    });
  }

  private toFlag(value: unknown): boolean {
    if (value === true || value === 1) return true;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      return v === 'true' || v === '1';
    }
    return false;
  }
}
