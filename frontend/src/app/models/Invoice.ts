import { AttachmentDto } from './AttachmentDto';
import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { DeliveryOrderDto } from './DeliveryOrder';
import { PaymentDto } from './Payments';
import { ProjectDto } from './Project';
import { PurchaseOrderDto } from './PurchaseOrder';
import { QuotationDto } from './Quotation';
import { UserDto } from './User';

// Invoice model
export interface InvoiceDto extends BaseModel {
  invoiceNo: string;
  deliveryOrderId: string;
  deliveryOrder: DeliveryOrderDto;
  clientId: string;
  client: CompanyDto;
  supplierId: string;
  supplier: CompanyDto;
  projectId: string;
  project: ProjectDto;
  purchaseOrderId: string;
  purchaseOrder: PurchaseOrderDto;
  quotationId: string;
  quotation: QuotationDto;
  invoiceDate: Date;
  dueDate: Date;
  terms: string;
  remarks: string;
  status: string;
  type: string;
  discount: number;
  gross: number;
  totalAmount: number;
  paidAmount: number;
  notes: string;
  termsAndConditions: string;
  bankDetails: string;
  attachment: string;
  createdById: string;
  createdBy: UserDto;
  invoiceItems: InvoiceItem[];
  payments: PaymentDto[];
}

// Invoice Item model
export interface InvoiceItem extends BaseModel {
  invoiceId: string;
  invoice: InvoiceDto;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  amount: number;
}

// Create Invoice Request
export interface CreateInvoiceRequest {
  invoiceNo: string;
  deliveryOrderId: string;
  clientId: string;
  supplierId: string;
  projectId: string;
  purchaseOrderId: string;
  quotationId: string;
  type: string;
  invoiceDate: Date;
  dueDate: Date;
  gross: number;
  discount: number;
  totalAmount: number;
  terms: string;
  termsAndConditions: string;
  bankDetails: string;
  remarks: string;
  notes: string;
  attachment: File;
  invoiceItems: InvoiceItemRequest[];
}

export interface InvoiceItemRequest {
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  amount: number;
}

export interface UpdateInvoiceRequest {
  id: string;
  invoiceNo: string;
  deliveryOrderId: string;
  clientId: string;
  supplierId: string;
  projectId: string;
  purchaseOrderId: string;
  quotationId: string;
  invoiceDate: Date;
  dueDate: Date;
  gross: number;
  discount: number;
  totalAmount: number;
  terms: string;
  termsAndConditions: string;
  bankDetails: string;
  remarks: string;
  notes: string;
  attachment: File;
  invoiceItems: InvoiceItemUpdateRequest[];
}

export interface InvoiceItemUpdateRequest extends InvoiceItemRequest {
  id: string;
}

export interface UpdateInvoiceStatusRequest {
  invoiceId: string;
  status: string;
}

export interface MarkInvoicePaidRequest {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  notes: string;
  processedById: string;
}

export interface InvoiceSummaryDto {
  totalAmount: number;
  totalPercentage: number;
  paidAmount: number | null;
  paidPercentage: number;
  pendingAmount: number | null;
  pendingPercentage: number;
  overdueAmount: number | null;
  overduePercentage: number;
}
