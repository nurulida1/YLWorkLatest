import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment.development';

/** Matches YLWorks.Model.ReportRequest (camelCase JSON). */
export interface ReportRequestBody {
  reportUri: string;
  parameters: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private readonly http = inject(HttpClient);

  /** POST /api/Report/download — response is raw PDF bytes. */
  downloadReportPdf(body: ReportRequestBody): Observable<Blob> {
    const url = `${environment.ApiBaseUrl}/Report/download`;
    return this.http.post(url, body, { responseType: 'blob' });
  }
}
