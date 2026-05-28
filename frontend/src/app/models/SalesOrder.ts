import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { ProjectDto } from './Project';
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
  totalAmount: number;
  notes?: string;
  terms?: string;
  remarks?: string;
  salesOrderItems?: SalesOrderItem[];
  salesOrderStatusHistories: SalesOrderStatusHistory[];
}

export interface SalesOrderItem extends BaseModel {
  salesOrderId: string;
  salesOrder: SalesOrderDto;
  item?: string;
  description: string;
  quantity: number;
  unit: string;
  discount: number;
  unitPrice: number;
  totalPrice: number;
  deliveredQuantity: number;
}

export interface SOItemBase {
  id: string;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface CreateSalesOrderRequest {
  salesOrderNo: string;
  companyId: string;
  clientId: string;
  projectId: string;
  quotationId: string;
  soDate: Date;
  totalAmount: number;
  notes: string;
  remarks: string;
  terms?: string;
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
  terms?: string;
  soDate: Date;
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
