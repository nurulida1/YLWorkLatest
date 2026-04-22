import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry, catchError, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment.development';
import {
  CreateQuotationRequest,
  QuotationDto,
  UpdateQuotationRequest,
} from '../models/Quotation';
import {
  GridifyQueryExtend,
  PagingContent,
  BaseResponse,
} from '../shared/helpers/helpers';

@Injectable({
  providedIn: 'root',
})
export class QuotationService {
  url = environment.ApiBaseUrl + '/Quotation';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  /**
   * Helper to build HttpParams from GridifyQueryExtend
   */
  private buildParams(query: GridifyQueryExtend): HttpParams {
    let params = new HttpParams()
      .set('page', query.Page.toString())
      .set('pageSize', query.PageSize.toString());

    if (query.Select) params = params.set('select', query.Select);
    if (query.OrderBy) params = params.set('orderBy', query.OrderBy);
    if (query.Filter) params = params.set('filter', query.Filter);
    if (query.Includes) params = params.set('includes', query.Includes);

    return params;
  }

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<QuotationDto>> {
    const params = this.buildParams(query);
    return this.http
      .get<PagingContent<QuotationDto>>(`${this.url}/GetMany`, { params })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<QuotationDto | null> {
    const params = this.buildParams(query);
    return this.http.get<QuotationDto>(`${this.url}/GetOne`, { params }).pipe(
      retry(1),
      catchError((error) => {
        if (error.status === 404) return of(null);
        return this.handleError('GetOne')(error);
      }),
    );
  }

  Create(request: CreateQuotationRequest): Observable<QuotationDto> {
    return this.http
      .post<QuotationDto>(`${this.url}/Create`, request)
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: UpdateQuotationRequest): Observable<QuotationDto> {
    return this.http
      .put<QuotationDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Preview(request: CreateQuotationRequest | QuotationDto): Observable<any> {
    return this.http
      .post<any>(`${this.url}/Preview`, request)
      .pipe(retry(1), catchError(this.handleError('Preview')));
  }

  UpdateStatus(
    id: string,
    status: string,
    userId?: string | null,
  ): Observable<any> {
    const params: any = {
      id,
      status,
    };
    if (userId) {
      params.userId = userId;
    }
    return this.http
      .put<any>(`${this.url}/UpdateStatus`, null, { params })
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
  }

  ConvertToInvoice(
    id: string,
  ): Observable<{ message: string; invoiceNo: string }> {
    return this.http
      .post<{
        message: string;
        invoiceNo: string;
      }>(`${this.url}/ConvertToInvoice/${id}`, {})
      .pipe(retry(1), catchError(this.handleError('ConvertToInvoice')));
  }

  ConvertToPO(id: string): Observable<{ message: string; poNo: string }> {
    return this.http
      .post<{
        message: string;
        poNo: string;
      }>(`${this.url}/ConvertToPO/${id}`, {})
      .pipe(retry(1), catchError(this.handleError('ConvertToPO')));
  }

  GetDashboardCount(): Observable<{
    pending: number;
    approved: number;
    rejected: number;
  }> {
    return this.http
      .get<{
        pending: number;
        approved: number;
        rejected: number;
      }>(`${this.url}/DashboardCount`)
      .pipe(retry(1), catchError(this.handleError('GetDashboardCount')));
  }

  ExportExcel(query: GridifyQueryExtend): Observable<Blob> {
    const params = this.buildParams(query);
    return this.http.get(`${this.url}/ExportExcel`, {
      params,
      responseType: 'blob',
    });
  }

  downloadPdf(id: string) {
    const url = `${environment.ApiBaseUrl}/Quotation/DownloadPdf/${id}`;
    // We specify responseType: 'blob' so Angular knows this is a file
    return this.http.get(url, { responseType: 'blob' });
  }

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: `Error in ${context}`,
      detail:
        error?.error?.Error ||
        error?.error?.detail ||
        error?.message ||
        'Unexpected error occurred.',
    });
    return throwError(() => error);
  };
}
