import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { ProjectDto } from './Project';
import { UserDto } from './User';

export interface QuotationDto extends BaseModel {
  quotationNo: string;
  referenceNo: string;
  quotationDate: Date;
  fromCompanyId: string;
  fromCompany: CompanyDto;
  clientId: string;
  client: CompanyDto;
  projectCode: string;
  project: ProjectDto;
  subject: string;
  totalAmount: number;
  termsAndConditions: string;
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
  reviewedByUserId: string;
  remarks: string;
  actionUser?: {
    id: string;
    fullName: string;
  };

  reviewedByUser?: {
    id: string;
    fullName: string;
  };
  signatureImage: string;
}

export interface QuotationItems extends BaseModel {
  quotationId: string;
  quotation: QuotationDto;
  parentId: string;
  parent: QuotationItems;
  sortOrder: number;
  type: string;
  description: string;
  isGroup: boolean;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  children: QuotationItems[];
}

export interface QuotationItemDto {
  id: string;
  sortOrder: number;
  type: string;
  isGroup: boolean;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  children: QuotationItemDto[];
}

export interface QuotationItemBase {
  sortOrder: number;
  type: string;
  isGroup: boolean;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  children: QuotationItemRequest[];
}

export interface QuotationItemRequest extends QuotationItemBase {}

export interface UpdateQuotationItemRequest extends QuotationItemBase {
  id: string;
}

export interface CreateQuotationRequest {
  quotationNo: string;
  referenceNo: string;
  quotationDate: Date;
  fromCompanyId: string;
  clientId: string;
  projectCode: string;
  subject: string;
  totalAmount: number;
  termsAndConditions: string;
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
