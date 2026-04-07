import { AttachmentDto } from './AttachmentDto';
import { BaseModel } from './BaseModel';
import { ClientDto } from './Client';
import { PaymentDto } from './Payments';
import { ProjectDto } from './Project';
import { PurchaseOrderDto } from './PurchaseOrder';
import { QuotationDto } from './Quotation';
import { SupplierDto } from './SupplierDto';
import { UserDto } from './User';

// Invoice model
export interface InvoiceDto extends BaseModel {
  invoiceNo: string;
  referenceNo?: string;
  projectId: string;
  project: ProjectDto;
  clientId: string;
  client: ClientDto;
  supplierId: string;
  supplier: SupplierDto;
  invoiceDate: Date;
  dueDate: Date;
  poId: string;
  purchaseOrder: PurchaseOrderDto;
  quotationId?: string;
  quotation?: QuotationDto;
  remarks?: string;
  status: string;
  discountRate: number;
  totalAmount: number;
  paidAmount?: number;
  signatureName: string;
  signatureImageUrl: string;
  description: string;
  termsConditions: string;
  bankDetails: string;
  createdById: string;
  createdBy: UserDto;
  invoiceItems: InvoiceItem[];
  attachments: AttachmentDto[];
  payments: PaymentDto[];
}

// Invoice Item model
export interface InvoiceItem extends BaseModel {
  invoiceId: string;
  invoice: InvoiceDto;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
}

// Create Invoice Request
export interface CreateInvoiceRequest {
  invoiceNo: string;
  referenceNo: string;
  clientId: string;
  supplierId: string;
  invoiceDate: Date;
  dueDate: Date;
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  isDraft: boolean;
  description: string;
  termsConditions: string;
  bankDetails: string;
  signatureName: string;
  signatureImageUrl: string;
  invoiceItems?: InvoiceItemRequest[];
}

export interface InvoiceItemRequest {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
}

export interface UpdateInvoiceRequest {
  id: string;
  invoiceNo: string;
  referenceNo: string;
  clientId: string;
  supplierId: string;
  invoiceDate: Date;
  dueDate: Date;
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  isDraft: boolean;
  description: string;
  termsConditions: string;
  bankDetails: string;
  signatureName: string;
  signatureImageUrl: string;
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
