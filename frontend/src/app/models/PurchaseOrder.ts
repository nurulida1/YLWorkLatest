import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { InvoiceDto } from './Invoice';
import { ProjectDto } from './Project';
import { QuotationDto } from './Quotation';
import { SalesOrderItem } from './SalesOrder';
import { UserDto } from './User';
import { SalesOrderDto } from './SalesOrder';

export interface PurchaseOrderDto extends BaseModel {
  purchaseOrderNo: string;
  fromCompanyId: string;
  fromCompany: CompanyDto;
  poDate: Date;
  poReceivedDate: Date;
  supplierId: string;
  supplier: CompanyDto;
  paymentTerms: string;
  projectId: string;
  project: ProjectDto;
  quotationId?: string;
  quotation?: QuotationDto;
  salesOrderId: string;
  salesOrder: SalesOrderDto;
  totalQuantity: number;
  gross: number;
  discount: number;
  totalAmount: number;
  remarks: string;
  notes: string;
  poClientNo: string;
  soClientNo: string;
  status: string;
  termsAndConditions: string;
  bankDetails: string;
  attachment: string;
  purchaseOrderStatusHistories: PurchaseOrderStatusHistory[];
  purchaseOrderItems: PurchaseOrderItem[];
  invoices: InvoiceDto[];
}

export interface PurchaseOrderStatusHistory extends BaseModel {
  purchaseOrderId: string;
  purchaseOrder: PurchaseOrderDto;
  status: string;
  actionAt: Date;
  actionUserId: string;
  actionUser: UserDto;
  remarks: string;
  signatureImage: string;
}

export interface PurchaseOrderItem extends BaseModel {
  purchaseOrderId: string;
  purchaseOrder: PurchaseOrderDto;
  salesOrderItemId: string;
  salesOrderItem: SalesOrderItem;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  receivedQuantity: number;
}

export interface POItemBase {
  salesOrderItemId: string;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  receivedQuantity: number;
}

export interface POItemRequest extends POItemBase {}

export interface UpdatePOItemRequest extends POItemBase {
  id: string;
}

export interface CreatePORequest {
  purchaseOrderNo: string;
  fromCompanyId: string;
  poDate: Date;
  poReceivedDate: Date;
  supplierId?: string;
  paymentTerms: string;
  quotationId: string;
  salesOrderId: string;
  projectId: string;
  gross: number;
  discount: number;
  totalAmount: number;
  notes: string;
  remarks: string;
  termsAndConditions: string;
  bankDetails: string;
  totalQuantity: number;
  attachment?: string;
  purchaseOrderItems: POItemBase[];
}

export interface UpdatePORequest extends CreatePORequest {
  id: string;
  purchaseOrderItems: UpdatePOItemRequest[];
}

export interface UpdatePOStatusRequest {
  id: string;
  status: string;
  remarks: string;
  signatureImage: string;
}

export interface PurchaseOrderDropdownDto {
  clients: CompanyDto[];
  suppliers: CompanyDto[];
  quotations: QuotationDto[];
}
