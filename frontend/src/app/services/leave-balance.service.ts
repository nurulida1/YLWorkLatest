import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { CreditLeaveBalanceDto, LeaveBalanceDto } from '../models/Leave';

@Injectable({ providedIn: 'root' })
export class LeaveBalanceService {
  private readonly url = environment.ApiBaseUrl + '/LeaveBalance';

  constructor(private http: HttpClient) {}

  getBalances(employeeId: string, year?: number): Observable<LeaveBalanceDto[]> {
    const path = year
      ? `${this.url}/${employeeId}/${year}`
      : `${this.url}/${employeeId}`;
    return this.http
      .get<LeaveBalanceDto[] | Record<string, unknown>[]>(path)
      .pipe(map((rows) => (rows ?? []).map((r) => this.normalizeBalance(r))));
  }

  credit(dto: CreditLeaveBalanceDto): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.url}/credit`, dto);
  }

  runYearEnd(year?: number): Observable<{ success: boolean; closedYear: number; rows: number }> {
    const path = year != null
      ? `${this.url}/run-year-end?year=${year}`
      : `${this.url}/run-year-end`;
    return this.http.post<{ success: boolean; closedYear: number; rows: number }>(path, {});
  }

  private normalizeBalance(row: LeaveBalanceDto | Record<string, unknown>): LeaveBalanceDto {
    const r = row as Record<string, unknown>;
    return {
      leaveTypeId: String(r['leaveTypeId'] ?? r['LeaveTypeId'] ?? ''),
      leaveTypeName: String(r['leaveTypeName'] ?? r['LeaveTypeName'] ?? ''),
      policyKind: String(r['policyKind'] ?? r['PolicyKind'] ?? ''),
      applicableGender: String(r['applicableGender'] ?? r['ApplicableGender'] ?? 'All'),
      year: Number(r['year'] ?? r['Year'] ?? 0),
      entitledDays: Number(r['entitledDays'] ?? r['EntitledDays'] ?? 0),
      tenureEntitledDays: Number(r['tenureEntitledDays'] ?? r['TenureEntitledDays'] ?? 0),
      carriedForwardDays: Number(r['carriedForwardDays'] ?? r['CarriedForwardDays'] ?? 0),
      creditedDays: Number(r['creditedDays'] ?? r['CreditedDays'] ?? 0),
      usedDays: Number(r['usedDays'] ?? r['UsedDays'] ?? 0),
      pendingDays: Number(r['pendingDays'] ?? r['PendingDays'] ?? 0),
      remainingDays: Number(r['remainingDays'] ?? r['RemainingDays'] ?? 0),
    };
  }
}
