import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ClaimSettingsDto, UpsertClaimSettingsDto } from '../models/Claim';

@Injectable({ providedIn: 'root' })
export class ClaimSettingsService {
  private readonly url = environment.ApiBaseUrl + '/ClaimSettings';

  constructor(private http: HttpClient) {}

  get(): Observable<ClaimSettingsDto> {
    return this.http
      .get<ClaimSettingsDto | Record<string, unknown>>(this.url)
      .pipe(map((r) => this.normalize(r)));
  }

  upsert(dto: UpsertClaimSettingsDto): Observable<ClaimSettingsDto> {
    return this.http
      .put<ClaimSettingsDto | Record<string, unknown>>(this.url, dto)
      .pipe(map((r) => this.normalize(r)));
  }

  private normalize(row: ClaimSettingsDto | Record<string, unknown>): ClaimSettingsDto {
    const r = row as Record<string, unknown>;
    const num = (a: string, b: string, d = 0) => Number(r[a] ?? r[b] ?? d);
    const str = (a: string, b: string, d = '') => String(r[a] ?? r[b] ?? d);
    return {
      id: str('id', 'Id'),
      medicalPerReceiptLimit: num('medicalPerReceiptLimit', 'MedicalPerReceiptLimit', 100),
      medicalAnnualLimit: Number(
        r['medicalAnnualLimit'] ??
          r['MedicalAnnualLimit'] ??
          r['medicalMonthlyTotalLimit'] ??
          r['MedicalMonthlyTotalLimit'] ??
          400,
      ),
      safetyShoesLimit: num('safetyShoesLimit', 'SafetyShoesLimit', 100),
      mileageCarRatePerKm: num('mileageCarRatePerKm', 'MileageCarRatePerKm', 0.5),
      mileageMotorcycleRatePerKm: num(
        'mileageMotorcycleRatePerKm',
        'MileageMotorcycleRatePerKm',
        0.3,
      ),
      mealAllowancePerDay: num('mealAllowancePerDay', 'MealAllowancePerDay', 50),
      ordinaryRateDivisorDays: num('ordinaryRateDivisorDays', 'OrdinaryRateDivisorDays', 26),
      ordinaryDayHours: num('ordinaryDayHours', 'OrdinaryDayHours', 8),
      otNormalMultiplier: num('otNormalMultiplier', 'OtNormalMultiplier', 1.5),
      otRestDayFirstBandMultiplier: num(
        'otRestDayFirstBandMultiplier',
        'OtRestDayFirstBandMultiplier',
        0.5,
      ),
      otRestDaySecondBandMultiplier: num(
        'otRestDaySecondBandMultiplier',
        'OtRestDaySecondBandMultiplier',
        1,
      ),
      otRestDayAfter8HourlyMultiplier: num(
        'otRestDayAfter8HourlyMultiplier',
        'OtRestDayAfter8HourlyMultiplier',
        2,
      ),
      otPublicHolidayUpTo8Multiplier: num(
        'otPublicHolidayUpTo8Multiplier',
        'OtPublicHolidayUpTo8Multiplier',
        2,
      ),
      otPublicHolidayAfter8HourlyMultiplier: num(
        'otPublicHolidayAfter8HourlyMultiplier',
        'OtPublicHolidayAfter8HourlyMultiplier',
        3,
      ),
      defaultWorkStartTime: str('defaultWorkStartTime', 'DefaultWorkStartTime', '09:00'),
      defaultWorkEndTime: str('defaultWorkEndTime', 'DefaultWorkEndTime', '18:00'),
      defaultUsesRestDayHalfDay: Boolean(
        r['defaultUsesRestDayHalfDay'] ?? r['DefaultUsesRestDayHalfDay'] ?? true,
      ),
      defaultRestDayHalfDayStart: str(
        'defaultRestDayHalfDayStart',
        'DefaultRestDayHalfDayStart',
        '08:00',
      ),
      defaultRestDayHalfDayEnd: str(
        'defaultRestDayHalfDayEnd',
        'DefaultRestDayHalfDayEnd',
        '12:00',
      ),
    };
  }
}
