import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { MessageService } from 'primeng/api';
import {
  CreateInvoiceRequest,
  InvoiceDto,
  InvoiceSummaryDto,
  UpdateInvoiceRequest,
} from '../models/Invoice';
import { catchError, Observable, of, retry, throwError } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  BaseResponse,
  GridifyQueryExtend,
  PagingContent,
} from '../shared/helpers/helpers';
import { InvoiceStatus } from '../shared/enum/enum';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  url = environment.ApiBaseUrl + '/Invoice';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<InvoiceDto>> {
    let params = new HttpParams()
      .set('page', query.Page.toString())
      .set('pageSize', query.PageSize.toString());

    if (query.Select) {
      params = params.set('select', query.Select);
    }
    if (query.OrderBy) {
      params = params.set('orderBy', query.OrderBy);
    }
    if (query.Filter) {
      params = params.set('filter', query.Filter);
    }
    if (query.Includes) {
      params = params.set('includes', query.Includes);
    }

    return this.http
      .get<PagingContent<InvoiceDto>>(this.url + '/GetMany', {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  GetOne(query: GridifyQueryExtend): Observable<InvoiceDto | null> {
    let params = new HttpParams()
      .set('page', query.Page.toString())
      .set('pageSize', query.PageSize.toString());

    if (query.Select) {
      params = params.set('select', query.Select);
    }
    if (query.OrderBy) {
      params = params.set('orderBy', query.OrderBy);
    }
    if (query.Filter) {
      params = params.set('filter', query.Filter);
    }
    if (query.Includes) {
      params = params.set('includes', query.Includes);
    }

    return this.http.get<InvoiceDto>(this.url + '/GetOne', { params }).pipe(
      retry(1),
      catchError((error) => {
        if (error.status === 404) {
          // Return null gracefully when not found
          return of(null);
        } else {
          // Handle all other errors
          return this.handleError('GetOne')(error);
        }
      }),
    );
  }

  Create(request: CreateInvoiceRequest): Observable<InvoiceDto> {
    return this.http
      .post<InvoiceDto>(`${this.url}/Create`, request) // no { Data: ... }
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  Update(request: UpdateInvoiceRequest): Observable<InvoiceDto> {
    return this.http
      .put<InvoiceDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  Delete(id: string): Observable<BaseResponse> {
    // Build query params
    const params = { id }; // simpler than buildParams if it's just the id

    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, { params })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  MarkAsPaid(
    id: string,
    amount: number,
    paidBy?: string,
    paymentDate?: Date,
    remarks?: string,
    paymentNo?: string,
    paymentMethod?: string,
  ): Observable<any> {
    let params = new HttpParams()
      .set('id', id)
      .set('amount', amount.toString());

    if (paidBy) params = params.set('paidBy', paidBy);
    if (paymentDate)
      params = params.set('paymentDate', paymentDate.toISOString());
    if (remarks) params = params.set('remarks', remarks);
    if (paymentNo) params = params.set('paymentNo', paymentNo);
    if (paymentMethod) params = params.set('paymentMethod', paymentMethod);

    return this.http
      .put<any>(`${this.url}/MarkAsPaid`, null, { params })
      .pipe(retry(1), catchError(this.handleError('MarkAsPaid')));
  }

  VoidInvoice(id: string, remark?: string): Observable<any> {
    let params = new HttpParams().set('id', id);
    if (remark) params = params.set('remark', remark);

    return this.http
      .put<any>(`${this.url}/Void`, null, { params })
      .pipe(retry(1), catchError(this.handleError('VoidInvoice')));
  }

  UpdateStatus(
    id: string,
    status: InvoiceStatus,
    remarks?: string,
    amount?: number,
    paidBy?: string,
    transferedDate?: Date,
    receivedDate?: Date,
    paymentMethod?: string,
  ): Observable<InvoiceDto> {
    const request: any = {
      Id: id,
      Status: status,
      Remarks: remarks || null,
    };

    // Only include payment info if Paid or PartialPaid
    if (status === InvoiceStatus.Paid || status === InvoiceStatus.PartialPaid) {
      request.Amount = amount || null;
      request.PaidBy = paidBy || null;
      request.TransferedDate = transferedDate || null;
      request.ReceivedDate = receivedDate || null;
      request.PaymentMethod = paymentMethod || null;
    }

    return this.http
      .put<InvoiceDto>(`${this.url}/UpdateStatus`, request)
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
  }

  ExportExcel(query: GridifyQueryExtend): Observable<Blob> {
    let params = new HttpParams()
      .set('page', query.Page.toString())
      .set('pageSize', query.PageSize.toString());

    if (query.Select) params = params.set('select', query.Select);
    if (query.OrderBy) params = params.set('orderBy', query.OrderBy);
    if (query.Filter) params = params.set('filter', query.Filter);
    if (query.Includes) params = params.set('includes', query.Includes);

    return this.http.get(`${this.url}/ExportExcel`, {
      params,
      responseType: 'blob', // important for files
    });
  }

  Clone(id: string): Observable<InvoiceDto> {
    const params = new HttpParams().set('id', id);

    return this.http
      .post<InvoiceDto>(`${this.url}/Clone`, {}, { params })
      .pipe(retry(1), catchError(this.handleError('Clone')));
  }

  GetDropdown(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/GetDropdown`)
      .pipe(retry(1), catchError(this.handleError('GetDropdown')));
  }

  GetSummary(): Observable<InvoiceSummaryDto> {
    return this.http
      .get<InvoiceSummaryDto>(`${this.url}/summary`)
      .pipe(retry(1), catchError(this.handleError('GetSummary')));
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
