import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { ProjectDto } from './Project';
import { UserDto } from './User';

export interface QuotationDto extends BaseModel {
  quotationNo: string;
  referenceNo: string;
  quotationDate: Date;
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
  actionUser: UserDto;
  remarks: string;
  signatureImage: string;
}

export interface QuotationItems extends BaseModel {
  quotationId: string;
  quotation: QuotationDto;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface QuotationItemBase {
  title: string;
  description: string;
  quantity: number;
  unit: string;
  untiPrice: number;
  totalPrice: number;
}

export interface QuotationItemRequest extends QuotationItemBase {}

export interface UpdateQuotationItemRequest extends QuotationItemBase {
  id: string;
}

export interface CreateQuotationRequest {
  quotationNo: string;
  referenceNo: string;
  quotationDate: Date;
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
