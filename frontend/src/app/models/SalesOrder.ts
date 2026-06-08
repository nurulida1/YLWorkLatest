import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { InventoryDto } from './Inventory';
import { InvoiceDto } from './Invoice';
import { ProjectDto } from './Project';
import { PurchaseOrderDto } from './PurchaseOrder';
import { QuotationDto } from './Quotation';
import { UserDto } from './User';

export interface SalesOrderDto extends BaseModel {
  salesOrderNo: string;
  clientId: string;
  client: CompanyDto;
  companyId?: string;
  company?: CompanyDto;
  quotationId?: string;
  quotation?: QuotationDto;
  projectId?: string;
  project?: ProjectDto;
  soDate: Date;
  status: string;
  clientPOAttachment: string;
  clientPODate: Date;
  clientPONumber: string;
  discount: number;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  paymentTerms?: string;
  execution: string;
  warrantyTerms: string;
  remarks?: string;
  salesOrderItems?: SalesOrderItem[];
  salesOrderStatusHistories: SalesOrderStatusHistory[];
  invoices: InvoiceDto[];
  purchaseOrders: PurchaseOrderDto[];
}

export interface SalesOrderItem extends BaseModel {
  salesOrderId: string;
  salesOrder: SalesOrderDto;
  parentId: string;
  sortOrder: number;
  type: string;
  itemType: string;
  isGroup: boolean;
  item?: string;
  description: string;
  quantity: number;
  quantityDelivered: number;
  quantityRemaining: number;
  unit: string;
  discount: number;
  unitPrice: number;
  taxRate: number;
  totalPrice: number;
  inventoryId?: string;
  inventory?: InventoryDto;
  children: SalesOrderItem[];
  includeInDeliveryOrder: boolean;
}

export interface SOItemBase {
  id: string;
  sortOrder: number;
  type: string;
  itemType: string;
  isGroup: boolean;
  parentId: string;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  deliveredQuantity: number;
  discount: number;
  taxRate: number;
  totalPrice: number;
  inventoryId?: string;
  children: SOItemBase[];
  includeInDeliveryOrder: boolean;
}

export interface CreateSalesOrderRequest {
  salesOrderNo: string;
  companyId: string;
  clientId: string;
  projectId: string;
  quotationId: string;
  soDate: Date;
  taxAmount: number;
  discount: number;
  subTotal: number;
  totalAmount: number;
  notes: string;
  remarks: string;
  paymentTerms?: string;
  execution: string;
  warrantyTerms: string;
  clientPOAttachment?: File;
  clientPODate: Date;
  clientPONumber: string;
  salesOrderItems: SOItemBase[];
}

export interface UpdateSalesOrderRequest {
  id: string;
  salesOrderNo: string;
  companyId: string;
  clientId: string;
  projectId: string;
  quotationId: string;
  paymentTerms?: string;
  execution: string;
  warrantyTerms: string;
  soDate: Date;
  subTotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  notes: string;
  remarks: string;
  clientPOAttachment?: File;
  clientPODate: Date;
  clientPONumber: string;
  salesOrderItems: SOItemBase[];
}

export interface SalesOrderStatusHistory {
  id: string;
  salesOrderId: string;
  salesOrder: SalesOrderDto;
  status: string;
  actionAt: Date;
  actionUser: UserDto;
  remarks: string;
}

export interface UpdateSalesOrderStatusRequest {
  id: string;
  status: string;
  remarks: string;
}

export interface SalesOrderDropdownDto {
  id: string;
  salesOrderNo: string;
}
