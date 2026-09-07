import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { PublicHolidayDto, UpsertPublicHolidayDto } from '../models/Leave';

@Injectable({ providedIn: 'root' })
export class LeaveHolidayService {
  private readonly url = environment.ApiBaseUrl + '/LeaveHolidays';

  constructor(private http: HttpClient) {}

  getByYear(year: number, includeInactive = false): Observable<PublicHolidayDto[]> {
    let params = new HttpParams().set('year', String(year));
    if (includeInactive) params = params.set('includeInactive', 'true');
    return this.http
      .get<PublicHolidayDto[] | Record<string, unknown>[]>(this.url, { params })
      .pipe(map((rows) => (rows ?? []).map((r) => this.normalize(r))));
  }

  getInRange(from: Date | string, to: Date | string, includeInactive = false): Observable<PublicHolidayDto[]> {
    let params = new HttpParams()
      .set('from', this.toIsoDate(from))
      .set('to', this.toIsoDate(to));
    if (includeInactive) params = params.set('includeInactive', 'true');
    return this.http
      .get<PublicHolidayDto[] | Record<string, unknown>[]>(this.url, { params })
      .pipe(map((rows) => (rows ?? []).map((r) => this.normalize(r))));
  }

  create(dto: UpsertPublicHolidayDto): Observable<PublicHolidayDto> {
    return this.http
      .post<PublicHolidayDto | Record<string, unknown>>(this.url, dto)
      .pipe(map((r) => this.normalize(r)));
  }

  update(id: string, dto: UpsertPublicHolidayDto): Observable<PublicHolidayDto> {
    return this.http
      .put<PublicHolidayDto | Record<string, unknown>>(`${this.url}/${id}`, dto)
      .pipe(map((r) => this.normalize(r)));
  }

  delete(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.url}/${id}`);
  }

  private toIsoDate(value: Date | string): string {
    if (typeof value === 'string') return value.slice(0, 10);
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private normalize(row: PublicHolidayDto | Record<string, unknown>): PublicHolidayDto {
    const r = row as Record<string, unknown>;
    const rawDate = r['date'] ?? r['Date'] ?? '';
    const date =
      typeof rawDate === 'string'
        ? rawDate.slice(0, 10)
        : rawDate instanceof Date
          ? this.toIsoDate(rawDate)
          : String(rawDate).slice(0, 10);
    return {
      id: String(r['id'] ?? r['Id'] ?? ''),
      date,
      name: String(r['name'] ?? r['Name'] ?? ''),
      isActive: Boolean(r['isActive'] ?? r['IsActive'] ?? true),
    };
  }
}
