import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  LeavePolicyDto,
  LeaveTenureBandDto,
  UpsertLeavePolicyDto,
} from '../models/Leave';

@Injectable({ providedIn: 'root' })
export class LeavePolicyService {
  private readonly url = environment.ApiBaseUrl + '/LeavePolicy';

  constructor(private http: HttpClient) {}

  get(): Observable<LeavePolicyDto> {
    return this.http
      .get<LeavePolicyDto | Record<string, unknown>>(this.url)
      .pipe(map((r) => this.normalize(r)));
  }

  upsert(dto: UpsertLeavePolicyDto): Observable<LeavePolicyDto> {
    return this.http
      .put<LeavePolicyDto | Record<string, unknown>>(this.url, dto)
      .pipe(map((r) => this.normalize(r)));
  }

  private normalize(row: LeavePolicyDto | Record<string, unknown>): LeavePolicyDto {
    const r = row as Record<string, unknown>;
    const rawBands = r['tenureBands'] ?? r['TenureBands'];
    const bands = Array.isArray(rawBands)
      ? rawBands.map((b) => this.normalizeBand(b))
      : [];
    return {
      id: String(r['id'] ?? r['Id'] ?? ''),
      effectiveFromYear: Number(r['effectiveFromYear'] ?? r['EffectiveFromYear'] ?? 0),
      annualCarryForwardPercent: Number(
        r['annualCarryForwardPercent'] ?? r['AnnualCarryForwardPercent'] ?? 50,
      ),
      isActive: Boolean(r['isActive'] ?? r['IsActive'] ?? true),
      tenureBands: bands,
    };
  }

  private normalizeBand(row: unknown): LeaveTenureBandDto {
    const b = (row ?? {}) as Record<string, unknown>;
    const id = b['id'] ?? b['Id'];
    const max = b['maxYearsExclusive'] ?? b['MaxYearsExclusive'];
    return {
      id: id != null && id !== '' ? String(id) : undefined,
      bandKind: String(b['bandKind'] ?? b['BandKind'] ?? 'Annual'),
      minYearsInclusive: Number(b['minYearsInclusive'] ?? b['MinYearsInclusive'] ?? 0),
      maxYearsExclusive: max == null || max === '' ? null : Number(max),
      daysPerYear: Number(b['daysPerYear'] ?? b['DaysPerYear'] ?? 0),
    };
  }
}
