import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { LeaveTypeDto, UpsertLeaveTypeDto } from '../models/Leave';

@Injectable({ providedIn: 'root' })
export class LeaveTypeService {
  private readonly url = environment.ApiBaseUrl + '/LeaveTypes';

  constructor(private http: HttpClient) {}

  getAll(employeeId?: string): Observable<LeaveTypeDto[]> {
    const path = employeeId
      ? `${this.url}?employeeId=${encodeURIComponent(employeeId)}`
      : this.url;
    return this.http
      .get<LeaveTypeDto[] | Record<string, unknown>[]>(path)
      .pipe(map((rows) => (rows ?? []).map((r) => this.normalizeType(r))));
  }

  create(dto: UpsertLeaveTypeDto): Observable<LeaveTypeDto> {
    return this.http
      .post<LeaveTypeDto | Record<string, unknown>>(this.url, dto)
      .pipe(map((r) => this.normalizeType(r)));
  }

  update(id: string, dto: UpsertLeaveTypeDto): Observable<LeaveTypeDto> {
    return this.http
      .put<LeaveTypeDto | Record<string, unknown>>(`${this.url}/${id}`, dto)
      .pipe(map((r) => this.normalizeType(r)));
  }

  delete(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.url}/${id}`);
  }

  private normalizeType(row: LeaveTypeDto | Record<string, unknown>): LeaveTypeDto {
    const r = row as Record<string, unknown>;
    return {
      id: String(r['id'] ?? r['Id'] ?? ''),
      name: String(r['name'] ?? r['Name'] ?? ''),
      description: (r['description'] ?? r['Description']) as string | undefined,
      isPaid: Boolean(r['isPaid'] ?? r['IsPaid'] ?? true),
      isEmergency: Boolean(r['isEmergency'] ?? r['IsEmergency'] ?? false),
      defaultDaysPerYear: Number(r['defaultDaysPerYear'] ?? r['DefaultDaysPerYear'] ?? 0),
      requiresDocument: Boolean(r['requiresDocument'] ?? r['RequiresDocument'] ?? false),
      policyKind: String(r['policyKind'] ?? r['PolicyKind'] ?? 'Fixed'),
      applicableGender: String(r['applicableGender'] ?? r['ApplicableGender'] ?? 'All'),
    };
  }
}
