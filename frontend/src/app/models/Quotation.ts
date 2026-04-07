import { BaseModel } from './BaseModel';
import { ClientDto } from './Client';
import { UserDto } from './User';

export interface QuotationDto extends BaseModel {
  quotationNo: string;
  referenceNo: string;
  quotationDate: Date;
  dueDate: Date;
  status: string;
  clientId: string;
  client: ClientDto;
  totalAmount: number;
  discountRate: number;
  signatureName: string;
  description: string;
  termsConditions?: string;
  bankDetails?: string;
  signatureImageUrl: string;
  createdById: string;
  createdBy: UserDto;
  assignedToId?: string;
  assignedTo?: UserDto;
  items: QuotationItems[];
}

export interface QuotationItems extends BaseModel {
  quotationId: string;
  quotation: QuotationDto;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
}

export interface CreateQuotationRequest {
  quotationNo: string;
  referenceNo: string;
  clientId: string;
  description: string;
  quotationDate: Date;
  dueDate: Date;
  subTotal: number;
  tax: number;
  discount: number;
  termsConditions?: string;
  bankDetails?: string;
  totalAmount: number;
  signatureName: string;
  signatureImageUrl: string;
  items: QuotationItemRequest[];
}

export interface UpdateQuotationRequest {
  id: string;
  quotationNo: string;
  referenceNo: string;
  clientId: string;
  description: string;
  termsConditions?: string;
  bankDetails?: string;
  quotationDate: Date;
  dueDate: Date;
  discount: number;
  subTotal: number;
  tax: number;
  totalAmount: number;
  signatureName: string;
  signatureImageUrl: string;
  items: UpdateQuotationItemRequest[];
}

export interface UpdateQuotationItemRequest {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
}

export interface QuotationItemRequest {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
}

export interface QuotationItemUpdateRequest extends QuotationItemRequest {
  id: string;
}

export interface UpdateQuotationStatusRequest {
  id: string;
  status: string;
}

export interface SubmitSignatureRequest {
  quotationId: string; // The actual Quotation being signed
  signatureImageUrl: string;
  signedByUserId: string; // The ID of the user signing
}
