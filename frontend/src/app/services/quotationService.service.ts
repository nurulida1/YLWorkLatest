import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry, catchError, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment';

import {
  CreateQuotationRequest,
  CreateQuotationTemplateRequest,
  QuotationDto,
  QuotationTemplateDto,
  SaveQuotationAsTemplateRequest,
  UpdateQuotationRequest,
  UpdateQuotationTemplateRequest,
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

  // =========================================================
  // QUERY PARAMETERS
  // =========================================================

  private buildParams(query: GridifyQueryExtend): HttpParams {
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

    return params;
  }

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: `Error in ${context}`,
      detail:
        error?.error?.Error ||
        error?.error?.error ||
        error?.error?.detail ||
        error?.message ||
        'Unexpected error occurred.',
    });

    return throwError(() => error);
  };

  // =========================================================
  // GET MANY
  // =========================================================

  GetMany(query: GridifyQueryExtend): Observable<PagingContent<QuotationDto>> {
    const params = this.buildParams(query);

    return this.http
      .get<PagingContent<QuotationDto>>(`${this.url}/GetMany`, {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('GetMany')));
  }

  // =========================================================
  // GET ONE
  // =========================================================

  GetOne(query: GridifyQueryExtend): Observable<QuotationDto | null> {
    let params = new HttpParams();

    if (query.Filter) {
      params = params.set('filter', query.Filter);
    }

    return this.http
      .get<QuotationDto>(`${this.url}/GetOne`, {
        params,
      })
      .pipe(
        retry(1),
        catchError((error) => {
          if (error.status === 404) {
            return of(null);
          }

          return this.handleError('GetOne')(error);
        }),
      );
  }

  // =========================================================
  // CREATE
  // =========================================================

  Create(request: CreateQuotationRequest): Observable<QuotationDto> {
    return this.http
      .post<QuotationDto>(`${this.url}/Create`, request)
      .pipe(retry(1), catchError(this.handleError('Create')));
  }

  // =========================================================
  // UPDATE
  // =========================================================

  Update(request: UpdateQuotationRequest): Observable<QuotationDto> {
    return this.http
      .put<QuotationDto>(`${this.url}/Update`, request)
      .pipe(retry(1), catchError(this.handleError('Update')));
  }

  // =========================================================
  // CLONE
  // =========================================================

  Clone(id: string): Observable<QuotationDto> {
    return this.http
      .post<QuotationDto>(`${this.url}/Clone/${id}`, {})
      .pipe(retry(1), catchError(this.handleError('Clone')));
  }

  // =========================================================
  // GENERATE QUOTATION NUMBER
  // =========================================================

  GenerateNo(): Observable<{ quotationNo: string }> {
    return this.http
      .get<{ quotationNo: string }>(`${this.url}/generate-no`)
      .pipe(retry(1), catchError(this.handleError('GenerateNo')));
  }

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  UpdateStatus(id: string, status: string): Observable<any> {
    const params = new HttpParams().set('id', id).set('status', status);

    return this.http
      .put<any>(`${this.url}/UpdateStatus`, null, {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('UpdateStatus')));
  }

  // =========================================================
  // CONVERT TO SALES ORDER
  // =========================================================

  ConvertToSalesOrder(
    quotationId: string,
    clientPONumber?: string,
    clientPODate?: string,
    clientPOAttachment?: File,
    remarks?: string,
  ): Observable<{
    message: string;
    salesOrderId: string;
    salesOrderNo: string;
  }> {
    const formData = new FormData();

    if (clientPONumber) {
      formData.append('ClientPONumber', clientPONumber);
    }

    if (clientPODate) {
      formData.append('ClientPODate', clientPODate);
    }

    if (remarks) {
      formData.append('Remarks', remarks);
    }

    if (clientPOAttachment) {
      formData.append(
        'ClientPOAttachment',
        clientPOAttachment,
        clientPOAttachment.name,
      );
    }

    return this.http
      .post<{
        message: string;
        salesOrderId: string;
        salesOrderNo: string;
      }>(`${this.url}/ConvertFromQuotation/${quotationId}`, formData)
      .pipe(retry(1), catchError(this.handleError('ConvertToSalesOrder')));
  }

  // =========================================================
  // DELETE QUOTATION
  // =========================================================

  Delete(id: string): Observable<BaseResponse> {
    const params = new HttpParams().set('id', id);

    return this.http
      .delete<BaseResponse>(`${this.url}/Delete`, {
        params,
      })
      .pipe(retry(1), catchError(this.handleError('Delete')));
  }

  // =========================================================
  // EXPORT EXCEL
  // =========================================================

  ExportToExcel(): Observable<Blob> {
    return this.http
      .get(`${this.url}/ExportExcel`, {
        responseType: 'blob',
      })
      .pipe(retry(1), catchError(this.handleError('ExportToExcel')));
  }

  // =========================================================
  // DROPDOWN
  // =========================================================

  GetDropdown(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/GetDropdown`)
      .pipe(retry(1), catchError(this.handleError('GetDropdown')));
  }

  // =========================================================
  // SAVE AS TEMPLATE
  // =========================================================

  SaveAsTemplate(
    quotationId: string,
    request: SaveQuotationAsTemplateRequest,
  ): Observable<any> {
    return this.http
      .post<any>(`${this.url}/SaveAsTemplate/${quotationId}`, request)
      .pipe(retry(1), catchError(this.handleError('SaveAsTemplate')));
  }
  // =========================================================
  // GET TEMPLATES
  // =========================================================

  GetTemplates(): Observable<QuotationTemplateDto[]> {
    return this.http
      .get<QuotationTemplateDto[]>(`${this.url}/GetTemplates`)
      .pipe(retry(1), catchError(this.handleError('GetTemplates')));
  }

  // =========================================================
  // GET TEMPLATE
  // =========================================================

  GetTemplate(id: string): Observable<QuotationTemplateDto> {
    return this.http
      .get<QuotationTemplateDto>(`${this.url}/GetTemplate/${id}`)
      .pipe(retry(1), catchError(this.handleError('GetTemplate')));
  }

  CreateTemplate(request: CreateQuotationTemplateRequest): Observable<any> {
    return this.http
      .post<any>(`${this.url}/CreateTemplate`, request)
      .pipe(retry(1), catchError(this.handleError('CreateTemplate')));
  }

  UpdateTemplate(request: UpdateQuotationTemplateRequest): Observable<any> {
    return this.http
      .put<any>(`${this.url}/UpdateTemplate`, request)
      .pipe(retry(1), catchError(this.handleError('UpdateTemplate')));
  }

  // =========================================================
  // DELETE TEMPLATE
  // =========================================================

  DeleteTemplate(id: string): Observable<BaseResponse> {
    return this.http
      .delete<BaseResponse>(`${this.url}/DeleteTemplate/${id}`)
      .pipe(retry(1), catchError(this.handleError('DeleteTemplate')));
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.url}/DownloadPdf/${id}`, {
      responseType: 'blob',
    });
  }
}
