import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { ProductServiceDto } from './ProductService';
import { ProjectDto } from './Project';
import { TermsAndConditionDto } from './TermsAndCondition';
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
  noValidity: boolean;
  validity: number;
  validityType: string;
  dueDate: Date;
  status: string;
  remarks: string;
  quotationItems: QuotationItems[];
  quotationStatusHistories: QuotationStatusHistory[];
  termsAndConditions: QuotationTermsAndCondition[];
  otherInformations: QuotationOtherInformation[];
  createdBy: UserDto;
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
  productServiceId?: string;
  productService?: ProductServiceDto;
  rowType: string;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  sortOrder: number;
}

export interface QuotationTermsAndCondition {
  id: string;
  quotationId: string;
  termsAndConditionId: string;
  termsAndCondition: TermsAndConditionDto;
  sortOrder: number;
  title: string;
  description: string;
  selected?: boolean;
}

export interface QuotationItemDto {
  id: string;
  quotationId: string;
  productServiceId?: string;
  rowType: string;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  sortOrder: number;
}

export interface QuotationItemBase {
  id?: string | null;
  quotationId?: string;
  productServiceId?: string | null;
  rowType: string;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  sortOrder: number;
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
  noValidity: boolean;
  validity: number;
  validityType: string;
  quotationItems: QuotationItemRequest[];
  termsAndConditions: TermsAndConditionOrderDto[];
  otherInformations: QuotationOtherInformation[];
}

export interface UpdateQuotationRequest extends CreateQuotationRequest {
  id: string;
  quotationItems: UpdateQuotationItemRequest[];
}

export interface UpdateQuotationStatusRequest {
  id: string;
  status: string;
  signatureImage: string;
}

export interface QuotationOtherInformation {
  id?: string;
  quotationId?: string;
  key: string;
  value: string;
  sortOrder?: number;
}

// Matches backend TermsAndConditionOrderDto
export interface TermsAndConditionOrderDto {
  id?: string | null;
  title?: string;
  description?: string;
  sortOrder: number;
}

// Save quotation as template
export interface SaveQuotationAsTemplateRequest {
  name: string;
  description?: string;
}

// Create quotation template
export interface CreateQuotationTemplateRequest {
  name: string;
  description?: string;
  fromCompanyId: string;
  subject?: string;
  projectCode?: string;
  discount?: number;
  taxAmount?: number;
  paymentTerms?: string;
  noValidity: boolean;
  validity?: number;
  validityType?: string;
  items: QuotationTemplateItem[];
  termsAndConditions: TermsAndConditionOrderDto[];
}

// Update quotation template
export interface UpdateQuotationTemplateRequest extends CreateQuotationTemplateRequest {
  id: string;
}

// Template response
export interface QuotationTemplateDto {
  id: string;
  name: string;
  description?: string;
  fromCompanyId: string;
  subject?: string;
  projectCode?: string;
  discount?: number;
  taxAmount?: number;
  paymentTerms?: string;
  noValidity: boolean;
  validity?: number;
  validityType?: string;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdById?: string;
  createdByName?: string;
  createdBy?: UserDto | null;
  items?: QuotationTemplateItem[];
  terms?: QuotationTemplateTerm[];
}

// Template item
export interface QuotationTemplateItem {
  id?: string;
  templateId?: string;
  productServiceId?: string;
  rowType?: string;
  item?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  discount?: number;
  totalPrice?: number;
  sortOrder?: number;
}

// Template terms and conditions
export interface QuotationTemplateTerm {
  id?: string;
  templateId?: string;
  termsAndConditionId?: string;
  title?: string;
  description?: string;
  sortOrder?: number;
}
