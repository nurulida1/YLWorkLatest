import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { DeliveryOrderDto } from './DeliveryOrder';
import { InvoiceDto } from './Invoice';
import { ProductServiceDto } from './ProductService';
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
  remarks?: string;
  salesOrderItems?: SalesOrderItem[];
  salesOrderStatusHistories: SalesOrderStatusHistory[];
  deliveryOrders: DeliveryOrderDto[];
  invoices: InvoiceDto[];
  purchaseOrders: PurchaseOrderDto[];
}

export interface SalesOrderItem extends BaseModel {
  salesOrderId: string;
  salesOrder: SalesOrderDto;
  productServiceId: string;
  productService: ProductServiceDto;
  rowType: string;
  item: string;
  description: string;
  quantity: number;
  quantityDelivered: number;
  quantityAllocated: number;
  quantityRemaining: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  totalPrice: number;
  sortOrder: number;
}

export interface SOItemBase {
  id: string;
  salesOrderId: string;
  productServiceId: string;
  item: string;
  rowType: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  totalPrice: number;
  sortOrder: number;
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
