import { BaseModel } from './BaseModel';
import { ClientDto } from './Client';
import { ProjectDto } from './Project';
import { QuotationDto } from './Quotation';
import { SupplierDto } from './SupplierDto';
import { UserDto } from './User';

export interface PurchaseOrderDto extends BaseModel {
  poNo: string;
  referenceNo: string;
  poDate: Date;
  dueDate: Date;
  projectId: string;
  project: ProjectDto;
  quotationId?: string;
  quotation?: QuotationDto;
  supplierId: string;
  supplier: SupplierDto;
  clientId: string;
  client: ClientDto;
  poReceivedDate: Date;
  orderDate: Date;
  discountRate: Number;
  totalAmount: number;
  signatureName: string;
  signatureImageUrl: string;
  createdById: string;
  createdBy: UserDto;
  status: string;
  description: string;
  termsConditions: string;
  bankDetails: string;
  paymentTerms: string;
  poItems: POItem[];
}

export interface POItem extends BaseModel {
  purchaseOrderId: string;
  purchaseOrder: PurchaseOrderDto;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
}

export interface POItemBase {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
}

export interface POItemRequest extends POItemBase {}

export interface UpdatePOItemRequest extends POItemBase {
  id: string;
}

export interface CreatePORequest {
  poNo: string;
  referenceNo: string;
  quotationId: string;
  supplierId: string;
  clientId: string;
  poDate: Date;
  dueDate: Date;
  poReceivedDate: Date;
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  isDraft: boolean;
  description: string;
  termsConditions: string;
  bankDetails: string;
  paymentTerms: string;
  signatureName: string;
  signatureImageUrl: string;
  poItems: POItemRequest[];
}

export interface UpdatePORequest extends CreatePORequest {
  id: string;
  poItems: UpdatePOItemRequest[];
}

export interface UpdatePurchaseOrderStatusRequest {
  id: string;
  status: string;
}
