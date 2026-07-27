import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface LeaveCalendarSyncStatusDto {
  googleConnected: boolean;
  googleAccountEmail?: string | null;
  connectedAtUtc?: string | null;
  lastSyncAtUtc?: string | null;
  lastError?: string | null;
  outlookConnected: boolean;
  outlookFeedUrl?: string | null;
  outlookConnectedAtUtc?: string | null;
  outlookLastAccessedAtUtc?: string | null;
}

export interface LeaveCalendarOutlookFeedDto {
  feedUrl: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class LeaveCalendarSyncService {
  private readonly url = environment.ApiBaseUrl + '/LeaveCalendarSync';

  constructor(private http: HttpClient) {}

  getStatus(): Observable<LeaveCalendarSyncStatusDto> {
    return this.http
      .get<LeaveCalendarSyncStatusDto | Record<string, unknown>>(`${this.url}/status`)
      .pipe(map((r) => this.normalizeStatus(r)));
  }

  getGoogleConnectUrl(): Observable<string> {
    return this.http
      .get<{ authUrl?: string; AuthUrl?: string }>(`${this.url}/google/connect-url`)
      .pipe(map((r) => r.authUrl ?? r.AuthUrl ?? ''));
  }

  disconnectGoogle(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.url}/google/disconnect`, {});
  }

  resyncGoogle(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.url}/google/resync`, {});
  }

  enableOutlookIcs(): Observable<LeaveCalendarOutlookFeedDto> {
    return this.http
      .post<LeaveCalendarOutlookFeedDto | Record<string, unknown>>(`${this.url}/outlook/ics/enable`, {})
      .pipe(map((r) => this.normalizeFeed(r)));
  }

  rotateOutlookIcs(): Observable<LeaveCalendarOutlookFeedDto> {
    return this.http
      .post<LeaveCalendarOutlookFeedDto | Record<string, unknown>>(`${this.url}/outlook/ics/rotate`, {})
      .pipe(map((r) => this.normalizeFeed(r)));
  }

  disableOutlookIcs(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.url}/outlook/ics/disable`, {});
  }

  private normalizeStatus(row: LeaveCalendarSyncStatusDto | Record<string, unknown>): LeaveCalendarSyncStatusDto {
    const r = row as Record<string, unknown>;
    return {
      googleConnected: Boolean(r['googleConnected'] ?? r['GoogleConnected'] ?? false),
      googleAccountEmail: (r['googleAccountEmail'] ?? r['GoogleAccountEmail'] ?? null) as string | null,
      connectedAtUtc: (r['connectedAtUtc'] ?? r['ConnectedAtUtc'] ?? null) as string | null,
      lastSyncAtUtc: (r['lastSyncAtUtc'] ?? r['LastSyncAtUtc'] ?? null) as string | null,
      lastError: (r['lastError'] ?? r['LastError'] ?? null) as string | null,
      outlookConnected: Boolean(r['outlookConnected'] ?? r['OutlookConnected'] ?? false),
      outlookFeedUrl: (r['outlookFeedUrl'] ?? r['OutlookFeedUrl'] ?? null) as string | null,
      outlookConnectedAtUtc: (r['outlookConnectedAtUtc'] ?? r['OutlookConnectedAtUtc'] ?? null) as
        | string
        | null,
      outlookLastAccessedAtUtc: (r['outlookLastAccessedAtUtc'] ?? r['OutlookLastAccessedAtUtc'] ?? null) as
        | string
        | null,
    };
  }

  private normalizeFeed(row: LeaveCalendarOutlookFeedDto | Record<string, unknown>): LeaveCalendarOutlookFeedDto {
    const r = row as Record<string, unknown>;
    return {
      feedUrl: String(r['feedUrl'] ?? r['FeedUrl'] ?? ''),
      message: String(r['message'] ?? r['Message'] ?? ''),
    };
  }
}
