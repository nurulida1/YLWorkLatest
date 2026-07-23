import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { PurchaseOrderReportParams } from '../models/PurchaseOrder';
import { PurchaseOrderService } from './purchaseOrderService';
import { ReportApiService } from './report-api.service';
import { UserService } from './userService.service';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderReportService {
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly reportApiService = inject(ReportApiService);
  private readonly userService = inject(UserService);

  readonly reportUri = '/REPORT_REPO/PurchaseOrder';

  fetchPdfByPurchaseOrderId(purchaseOrderId: string): Observable<Blob> {
    return this.purchaseOrderService.GetReportParams(purchaseOrderId).pipe(
      switchMap((params) =>
        this.reportApiService.downloadReportPdf({
          reportUri: this.reportUri,
          parameters: this.toJasperParameters(purchaseOrderId, params),
        }),
      ),
    );
  }

  fetchPdfFromFormValues(
    fromCompanyId?: string | null,
    supplierId?: string | null,
    purchaseOrderId?: string,
  ): Observable<Blob> {
    return this.reportApiService.downloadReportPdf({
      reportUri: this.reportUri,
      parameters: this.toJasperParameters(purchaseOrderId ?? '', {
        fromCompanyId: fromCompanyId ?? undefined,
        supplierId: supplierId ?? undefined,
      }),
    });
  }

  toJasperParameters(
    purchaseOrderId: string,
    params: Pick<
      PurchaseOrderReportParams,
      'fromCompanyId' | 'supplierId' | 'companyLogoB64'
    >,
  ): Record<string, string> {
    const reportParameters: Record<string, string> = {};

    if (purchaseOrderId) {
      reportParameters['PurchaseOrderId'] = purchaseOrderId;
    }
    if (params.fromCompanyId) {
      reportParameters['FromCompanyId'] = params.fromCompanyId;
    }
    if (params.supplierId) {
      reportParameters['SupplierId'] = params.supplierId;
    }
    if (params.companyLogoB64) {
      reportParameters['Company_LogoB64'] = this.stripDataUriPrefix(
        params.companyLogoB64,
      );
    }

    const fullName = this.userService.currentUser?.fullName;
    if (fullName) {
      reportParameters['FullName'] = fullName;
    }

    return reportParameters;
  }

  private stripDataUriPrefix(value: string): string {
    if (value.startsWith('data:')) {
      const commaIndex = value.indexOf(',');
      if (commaIndex >= 0) {
        return value.slice(commaIndex + 1);
      }
    }
    return value;
  }
}
