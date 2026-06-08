import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { ProjectDto } from './Project';
import { UserDto } from './User';

export interface QuotationDto extends BaseModel {
  quotationNo: string;
  quotationDate: Date;
  fromCompanyId: string;
  fromCompany: CompanyDto;
  clientId: string;
  client: CompanyDto;
  projectCode: string;
  project: ProjectDto;
  subject: string;
  discount: number;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms: string;
  validityDays: number;
  execution: string;
  warrantyTerms: string;
  status: string;
  remarks: string;
  quotationItems: QuotationItems[];
  quotationStatusHistories: QuotationStatusHistory[];
}

export interface QuotationStatusHistory extends BaseModel {
  quotationId: string;
  quotation: QuotationDto;
  status: string;
  actionAt: Date;
  actionUserId: string;
  remarks: string;
  actionUser?: {
    id: string;
    fullName: string;
  };
}

export interface QuotationItems extends BaseModel {
  quotationId: string;
  quotation: QuotationDto;
  parentId: string;
  parent: QuotationItems;
  sortOrder: number;
  type: string;
  itemType: string;
  item: string;
  description: string;
  isGroup: boolean;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  discount: number;
  totalPrice: number;
  children: QuotationItems[];
}

export interface QuotationItemDto {
  id: string;
  sortOrder: number;
  type: string;
  itemType: string;
  isGroup: boolean;
  item: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  totalPrice: number;
  children: QuotationItemDto[];
}

export interface QuotationItemBase {
  sortOrder: number;
  type: string;
  itemType: string;
  isGroup: boolean;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  discount: number;
  totalPrice: number;
  children: QuotationItemRequest[];
}

export interface QuotationItemRequest extends QuotationItemBase {}

export interface UpdateQuotationItemRequest extends QuotationItemBase {
  id: string;
}

export interface CreateQuotationRequest {
  quotationNo: string;
  quotationDate: Date;
  fromCompanyId: string;
  clientId: string;
  projectCode: string;
  subject: string;
  taxAmount: number;
  discount: number;
  subTotal: number;
  totalAmount: number;
  paymentTerms: string;
  validityDays: number;
  execution: string;
  warrantyTerms: string;
  quotationItems: QuotationItemRequest[];
}

export interface UpdateQuotationRequest extends CreateQuotationRequest {
  id: string;
  items: UpdateQuotationItemRequest[];
}

export interface UpdateQuotationStatusRequest {
  id: string;
  status: string;
  signatureImage: string;
}
