import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { ProjectDto } from './Project';
import { QuotationDto } from './Quotation';
import { UserDto } from './User';

export interface PurchaseOrderDto extends BaseModel {
  purchaseOrderNo: string;
  type: string;
  poDate: Date;
  poReceivedDate: Date;
  clientId: string;
  client: CompanyDto;
  supplierId: string;
  supplier: CompanyDto;
  terms: string;
  projectCode: string;
  project: ProjectDto;
  quotationId?: string;
  quotation?: QuotationDto;
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
  purchaseOrderStatusHistories: PurchaseOrderStatusHistory[];
  purchaseOrderItems: PurchaseOrderItem[];
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
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  totalAmount: number;
}

export interface POItemBase {
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  totalAmount: number;
}

export interface POItemRequest extends POItemBase {}

export interface UpdatePOItemRequest extends POItemBase {
  id: string;
}

export interface CreatePORequest {
  purchaseOrderNo: string;
  type: string;
  poDate: Date;
  poReceivedDate: Date;
  clientId: string;
  supplierId: string;
  terms: string;
  quotationId: string;
  projectCode: string;
  gross: number;
  discount: number;
  totalAmount: number;
  notes: string;
  remarks: string;
  termsAndConditions: string;
  bankDetails: string;
  totalQuantity: number;
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
