import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment.development';
import { DashboardCount, DashboardSummary } from '../models/AppModels';
import { Observable, retry, catchError, throwError } from 'rxjs';
export type DataType = 'PO' | 'Quotation' | 'Invoice' | null;

@Injectable({
  providedIn: 'root',
})
export class AppService {
  url = environment.ApiBaseUrl + '/App';
  private data: any | null = null;
  private dataType: DataType = null;

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  // New: Fetch dashboard summary (role-based)
  GetDashboardSummary(): Observable<DashboardSummary> {
    return this.http
      .get<DashboardSummary>(`${this.url}/dashboardSummary`)
      .pipe(retry(1), catchError(this.handleError('GetDashboardSummary')));
  }

  setData(data: any, type: DataType) {
    this.data = data;
    this.dataType = type;
  }

  getData(): { data: any; type: DataType } | null {
    if (!this.data) return null;
    return { data: this.data, type: this.dataType };
  }

  clear() {
    this.data = null;
    this.dataType = null;
  }

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail:
        error?.error?.detail || error?.message || 'Unexpected error occurred.',
    });
    return throwError(() => error);
  };
}
