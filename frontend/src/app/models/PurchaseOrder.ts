import { BaseModel } from './BaseModel';
import { ClientDto } from './Client';
import { ProjectDto } from './Project';
import { QuotationDto } from './Quotation';
import { SupplierDto } from './SupplierDto';
import { UserDto } from './User';

export interface PurchaseOrderDto extends BaseModel {
  poNo: string;
  type: string;
  terms: string;
  page: string;
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
  totalQuantity: number;
  gross: number;
  discount: number;
  totalAmount: number;
  deliveryInstruction: string;
  deliveryDate: Date;
  remarks: string;
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
  poNo: string;
  quotationId: string;
  projectId: string;
  supplierId: string;
  clientId: string;
  terms: string;
  poReceivedDate: Date;
  page: string;
  gross: number;
  discount: number;
  totalAmount: number;
  deliveryInstruction: string;
  deliveryDate: Date;
  termsConditions: string;
  bankDetails: string;
  remarks: string;
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
