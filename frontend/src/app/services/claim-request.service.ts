import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  ApproveRejectClaimDto,
  CancelClaimDto,
  ClaimDashboardDto,
  ClaimDocumentDto,
  ClaimRequestDto,
  CreateClaimRequestDto,
  PreviewOtAmountDto,
  PreviewOtAmountResultDto,
  MedicalBalanceDto,
} from '../models/Claim';

@Injectable({ providedIn: 'root' })
export class ClaimRequestService {
  private readonly url = environment.ApiBaseUrl + '/ClaimRequests';

  constructor(private http: HttpClient) {}

  getAll(employeeId?: string): Observable<ClaimRequestDto[]> {
    const options = employeeId ? { params: { employeeId } } : {};
    return this.http
      .get<ClaimRequestDto[] | Record<string, unknown>[]>(this.url, options)
      .pipe(map((rows) => (rows ?? []).map((r) => this.normalizeRequest(r))));
  }

  getDashboard(year?: number, month?: number): Observable<ClaimDashboardDto> {
    const params: Record<string, string> = {};
    if (year != null) params['year'] = String(year);
    if (month != null) params['month'] = String(month);
    return this.http
      .get<ClaimDashboardDto | Record<string, unknown>>(`${this.url}/dashboard`, {
        params,
      })
      .pipe(map((r) => this.normalizeDashboard(r)));
  }

  getById(id: string): Observable<ClaimRequestDto> {
    return this.http
      .get<ClaimRequestDto | Record<string, unknown>>(`${this.url}/${id}`)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  submit(dto: CreateClaimRequestDto): Observable<ClaimRequestDto> {
    return this.http
      .post<ClaimRequestDto | Record<string, unknown>>(this.url, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  update(id: string, dto: CreateClaimRequestDto): Observable<ClaimRequestDto> {
    return this.http
      .put<ClaimRequestDto | Record<string, unknown>>(`${this.url}/${id}`, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  approve(id: string, dto: ApproveRejectClaimDto): Observable<ClaimRequestDto> {
    return this.http
      .post<ClaimRequestDto | Record<string, unknown>>(`${this.url}/${id}/approve`, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  finalize(id: string, dto: ApproveRejectClaimDto): Observable<ClaimRequestDto> {
    return this.http
      .post<ClaimRequestDto | Record<string, unknown>>(`${this.url}/${id}/finalize`, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  reject(id: string, dto: ApproveRejectClaimDto): Observable<ClaimRequestDto> {
    return this.http
      .post<ClaimRequestDto | Record<string, unknown>>(`${this.url}/${id}/reject`, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  cancel(id: string, dto: CancelClaimDto): Observable<ClaimRequestDto> {
    return this.http
      .post<ClaimRequestDto | Record<string, unknown>>(`${this.url}/${id}/cancel`, dto)
      .pipe(map((r) => this.normalizeRequest(r)));
  }

  uploadDocument(
    id: string,
    file: File,
    documentKind: string = 'Receipt',
  ): Observable<ClaimDocumentDto> {
    const form = new FormData();
    form.append('file', file);
    form.append('documentKind', documentKind);
    return this.http
      .post<ClaimDocumentDto | Record<string, unknown>>(`${this.url}/${id}/document`, form)
      .pipe(map((r) => this.normalizeDocument(r)));
  }

  getPendingForHod(hodId: string): Observable<ClaimRequestDto[]> {
    return this.http
      .get<ClaimRequestDto[] | Record<string, unknown>[]>(
        `${this.url}/pending/hod/${hodId}`,
      )
      .pipe(map((rows) => (rows ?? []).map((r) => this.normalizeRequest(r))));
  }

  previewOt(dto: PreviewOtAmountDto): Observable<PreviewOtAmountResultDto> {
    return this.http
      .post<PreviewOtAmountResultDto | Record<string, unknown>>(
        `${this.url}/preview-ot`,
        dto,
      )
      .pipe(
        map((r) => {
          const row = r as Record<string, unknown>;
          return {
            ordinaryRate: Number(row['ordinaryRate'] ?? row['OrdinaryRate'] ?? 0),
            hourlyRate: Number(row['hourlyRate'] ?? row['HourlyRate'] ?? 0),
            amount: Number(row['amount'] ?? row['Amount'] ?? 0),
          };
        }),
      );
  }

  getMedicalBalance(
    employeeId: string,
    year?: number,
    excludeRequestId?: string,
  ): Observable<MedicalBalanceDto> {
    const params: Record<string, string> = { employeeId };
    if (year != null) params['year'] = String(year);
    if (excludeRequestId) params['excludeRequestId'] = excludeRequestId;
    return this.http
      .get<MedicalBalanceDto | Record<string, unknown>>(`${this.url}/medical-balance`, {
        params,
      })
      .pipe(
        map((r) => {
          const row = r as Record<string, unknown>;
          return {
            year: Number(row['year'] ?? row['Year'] ?? new Date().getFullYear()),
            annualLimit: Number(row['annualLimit'] ?? row['AnnualLimit'] ?? 0),
            usedAmount: Number(row['usedAmount'] ?? row['UsedAmount'] ?? 0),
            remainingAmount: Number(row['remainingAmount'] ?? row['RemainingAmount'] ?? 0),
            perReceiptLimit: Number(row['perReceiptLimit'] ?? row['PerReceiptLimit'] ?? 100),
            isProrated: Boolean(row['isProrated'] ?? row['IsProrated'] ?? false),
          };
        }),
      );
  }

  private normalizeDashboard(
    row: ClaimDashboardDto | Record<string, unknown>,
  ): ClaimDashboardDto {
    const r = row as Record<string, unknown>;
    const recentRaw = r['recent'] ?? r['Recent'];
    return {
      approvedTotal: Number(r['approvedTotal'] ?? r['ApprovedTotal'] ?? 0),
      pendingTotal: Number(r['pendingTotal'] ?? r['PendingTotal'] ?? 0),
      approvedCount: Number(r['approvedCount'] ?? r['ApprovedCount'] ?? 0),
      pendingCount: Number(r['pendingCount'] ?? r['PendingCount'] ?? 0),
      recent: Array.isArray(recentRaw)
        ? recentRaw.map((x) => this.normalizeRequest(x))
        : [],
    };
  }

  private normalizeDocument(
    row: ClaimDocumentDto | Record<string, unknown>,
  ): ClaimDocumentDto {
    const r = row as Record<string, unknown>;
    return {
      id: String(r['id'] ?? r['Id'] ?? ''),
      documentKind: String(r['documentKind'] ?? r['DocumentKind'] ?? 'Receipt'),
      fileName: String(r['fileName'] ?? r['FileName'] ?? ''),
      fileUrl: String(r['fileUrl'] ?? r['FileUrl'] ?? ''),
      uploadedAt: String(r['uploadedAt'] ?? r['UploadedAt'] ?? ''),
    };
  }

  normalizeRequest(row: ClaimRequestDto | Record<string, unknown>): ClaimRequestDto {
    const r = row as Record<string, unknown>;
    const lines = r['lineItems'] ?? r['LineItems'];
    const docs = r['documents'] ?? r['Documents'];
    const chain = r['approvalChain'] ?? r['ApprovalChain'];
    const currentIds = r['currentApproverIds'] ?? r['CurrentApproverIds'];

    return {
      requestId: String(r['requestId'] ?? r['RequestId'] ?? ''),
      employeeId: String(r['employeeId'] ?? r['EmployeeId'] ?? ''),
      employeeName: String(r['employeeName'] ?? r['EmployeeName'] ?? ''),
      claimType: String(r['claimType'] ?? r['ClaimType'] ?? ''),
      status: String(r['status'] ?? r['Status'] ?? ''),
      totalAmount: Number(r['totalAmount'] ?? r['TotalAmount'] ?? 0),
      remarks: String(r['remarks'] ?? r['Remarks'] ?? ''),
      submittedAt: String(r['submittedAt'] ?? r['SubmittedAt'] ?? ''),
      destination: (r['destination'] ?? r['Destination']) as string | null,
      tripStartDate: (r['tripStartDate'] ?? r['TripStartDate']) as string | null,
      tripEndDate: (r['tripEndDate'] ?? r['TripEndDate']) as string | null,
      rejectionReason: (r['rejectionReason'] ?? r['RejectionReason']) as string | null,
      lineItems: Array.isArray(lines)
        ? lines.map((l) => {
            const x = l as Record<string, unknown>;
            return {
              id: String(x['id'] ?? x['Id'] ?? ''),
              lineKind: String(x['lineKind'] ?? x['LineKind'] ?? ''),
              description: String(x['description'] ?? x['Description'] ?? ''),
              amount: Number(x['amount'] ?? x['Amount'] ?? 0),
              category: (x['category'] ?? x['Category']) as string | null,
              purchaseDate: (x['purchaseDate'] ?? x['PurchaseDate']) as string | null,
              workDate: (x['workDate'] ?? x['WorkDate']) as string | null,
              dayType: (x['dayType'] ?? x['DayType']) as string | null,
              hours: (x['hours'] ?? x['Hours']) as number | null,
              ordinaryRate: (x['ordinaryRate'] ?? x['OrdinaryRate']) as number | null,
              hourlyRate: (x['hourlyRate'] ?? x['HourlyRate']) as number | null,
              vehicleType: (x['vehicleType'] ?? x['VehicleType']) as string | null,
              kilometers: (x['kilometers'] ?? x['Kilometers']) as number | null,
              mealDays: (x['mealDays'] ?? x['MealDays']) as number | null,
            };
          })
        : [],
      documents: Array.isArray(docs)
        ? docs.map((d) => this.normalizeDocument(d))
        : [],
      currentApproverIds: Array.isArray(currentIds)
        ? currentIds.map((id) => String(id))
        : [],
      currentApproverId: (r['currentApproverId'] ?? r['CurrentApproverId']) as
        | string
        | null,
      noApproverAssigned: Boolean(
        r['noApproverAssigned'] ?? r['NoApproverAssigned'] ?? false,
      ),
      approvalChain: Array.isArray(chain)
        ? chain.map((c) => {
            const x = c as Record<string, unknown>;
            return {
              stepOrder: Number(x['stepOrder'] ?? x['StepOrder'] ?? 0),
              approverId: (x['approverId'] ?? x['ApproverId']) as string | null,
              approverName: String(x['approverName'] ?? x['ApproverName'] ?? ''),
              status: String(x['status'] ?? x['Status'] ?? ''),
              decidedAt: (x['decidedAt'] ?? x['DecidedAt']) as string | null,
              rejectionReason: (x['rejectionReason'] ?? x['RejectionReason']) as
                | string
                | null,
              isFinalStep: Boolean(x['isFinalStep'] ?? x['IsFinalStep'] ?? false),
            };
          })
        : [],
    };
  }
}
